// Language: JavaScript
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const WebSocket = require('ws');
const { MenuList } = require('./data/initialData');
const { body, param, validationResult } = require('express-validator');
const { sequelize, Mouse, Category, Op, getMiceFilters, getMiceOrder, initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database with seed data if empty
initDb(MenuList);

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });
let clients = [];

// Broadcast data to all connected WebSocket clients
const broadcast = (data) => {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Generation logic controlled by endpoints
let generationInterval = null;
const generateNewMouse = async () => {
    try {
        const newMouse = await Mouse.create({
            name: `Mouse ${Date.now()}`,
            price: parseFloat((Math.random() * 100).toFixed(2)),
            details: 'Generated dynamically',
            image: '/assets/viperv3pro.avif',
            isGenerated: true
        });

        // Add random categories to the generated mouse
        const categories = await Category.findAll();
        if (categories.length > 0) {
            const randomCategories = categories
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 3) + 1);

            await newMouse.addCategories(randomCategories);
        }

        // Get the mouse with its categories for broadcasting
        const mouseWithCategories = await Mouse.findByPk(newMouse.id, {
            include: Category
        });

        broadcast({ type: 'NEW_MOUSE', data: mouseWithCategories });
    } catch (error) {
        console.error('Error generating new mouse:', error);
    }
};

app.post('/api/generation/start', (req, res) => {
    if (generationInterval === null) {
        generationInterval = setInterval(generateNewMouse, 10000); // every 10 seconds
        return res.status(200).json({ message: 'Generation started' });
    }
    res.status(400).json({ message: 'Generation is already running' });
});

app.post('/api/generation/stop', (req, res) => {
    if (generationInterval !== null) {
        clearInterval(generationInterval);
        generationInterval = null;
        return res.status(200).json({ message: 'Generation stopped' });
    }
    res.status(400).json({ message: 'Generation is not running' });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    res.status(201).json({ message: 'File uploaded successfully', filePath: `/uploads/${req.file.filename}` });
});

app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});

// CRUD operations for mice
app.post(
    '/api/mice',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        body('details').optional().isString(),
        body('image').optional().isString(),
        body('categoryIds').optional().isArray()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, image, price, details, categoryIds } = req.body;

            // Create the mouse
            const newMouse = await Mouse.create({
                name,
                price: parseFloat(price),
                details,
                image,
                isGenerated: false
            });

            // Add categories if provided
            if (categoryIds && Array.isArray(categoryIds)) {
                const categories = await Category.findAll({
                    where: { id: categoryIds }
                });
                await newMouse.addCategories(categories);
            }

            // Get the complete mouse with categories
            const mouseWithCategories = await Mouse.findByPk(newMouse.id, {
                include: Category
            });

            broadcast({ type: 'NEW_MOUSE', data: mouseWithCategories });
            res.status(201).json(mouseWithCategories);
        } catch (error) {
            console.error('Error creating mouse:', error);
            res.status(500).json({ message: 'Error creating mouse', error: error.message });
        }
    }
);


// Add this route before any specific mouse ID routes to avoid conflict
app.get('/api/mice/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const offset = (page - 1) * pageSize;

        // Get filter parameters
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
        const order = req.query.order || null;

        // Build where clause for filters
        const where = {};

        if (minPrice !== null) {
            where.price = where.price || {};
            where.price = { ...where.price, [Op.gte]: minPrice };
        }

        if (maxPrice !== null) {
            where.price = where.price || {};
            where.price = { ...where.price, [Op.lte]: maxPrice };
        }

        // Build order clause
        let orderClause = [['createdAt', 'DESC']]; // default ordering

        if (order === 'priceAsc') {
            orderClause = [['price', 'ASC']];
        } else if (order === 'priceDesc') {
            orderClause = [['price', 'DESC']];
        }

        const { count, rows } = await Mouse.findAndCountAll({
            where,
            order: orderClause,
            include: Category,
            limit: pageSize,
            offset: offset
        });

        res.json({
            mice: rows,
            totalCount: count,
            totalPages: Math.ceil(count / pageSize),
            currentPage: page,
            pageSize: pageSize
        });
    } catch (error) {
        console.error('Error fetching paginated mice:', error);
        res.status(500).json({ error: 'Failed to fetch mice' });
    }
});

// Add this route for paginated menu items
app.get('/api/menu/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const offset = (page - 1) * pageSize;

        // Similar filtering logic as above
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
        const order = req.query.order || null;

        const where = {};
        if (minPrice !== null) {
            where.price = where.price || {};
            where.price = { ...where.price, [Op.gte]: minPrice };
        }
        if (maxPrice !== null) {
            where.price = where.price || {};
            where.price = { ...where.price, [Op.lte]: maxPrice };
        }

        let orderClause = [['createdAt', 'DESC']];
        if (order === 'priceAsc') {
            orderClause = [['price', 'ASC']];
        } else if (order === 'priceDesc') {
            orderClause = [['price', 'DESC']];
        }

        const { count, rows } = await Mouse.findAndCountAll({
            where,
            order: orderClause,
            include: Category,
            limit: pageSize,
            offset: offset
        });

        res.json({
            menuItems: rows,
            totalCount: count,
            totalPages: Math.ceil(count / pageSize),
            currentPage: page,
            pageSize: pageSize
        });
    } catch (error) {
        console.error('Error fetching paginated menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});


app.get('/api/mice', async (req, res) => {
    try {
        const where = getMiceFilters(req.query);
        const order = getMiceOrder(req.query);

        const mice = await Mouse.findAll({
            where,
            order,
            include: Category
        });

        res.json(mice);
    } catch (error) {
        console.error('Error fetching mice:', error);
        res.status(500).json({ message: 'Error fetching mice', error: error.message });
    }
});

app.get('/api/mice/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const mouse = await Mouse.findByPk(id, {
            include: Category
        });

        if (!mouse) {
            return res.status(404).json({ message: 'Mouse not found' });
        }

        res.json(mouse);
    } catch (error) {
        console.error('Error fetching mouse:', error);
        res.status(500).json({ message: 'Error fetching mouse', error: error.message });
    }
});

app.patch(
    '/api/mice/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('Valid mouse id is required'),
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be positive'),
        body('details').optional().isString(),
        body('image').optional().isString(),
        body('categoryIds').optional().isArray()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = parseInt(req.params.id);
            const mouse = await Mouse.findByPk(id);

            if (!mouse) {
                return res.status(404).json({ message: 'Mouse not found' });
            }

            const { name, image, price, details, categoryIds } = req.body;
            const updateData = {};

            if (name !== undefined) updateData.name = name;
            if (image !== undefined) updateData.image = image;
            if (price !== undefined) updateData.price = parseFloat(price);
            if (details !== undefined) updateData.details = details;

            await mouse.update(updateData);

            // Update categories if provided
            if (categoryIds && Array.isArray(categoryIds)) {
                const categories = await Category.findAll({
                    where: { id: categoryIds }
                });
                await mouse.setCategories(categories);
            }

            // Get updated mouse with categories
            const updatedMouse = await Mouse.findByPk(id, {
                include: Category
            });

            broadcast({ type: 'UPDATED_MOUSE', data: updatedMouse });
            res.json(updatedMouse);
        } catch (error) {
            console.error('Error updating mouse:', error);
            res.status(500).json({ message: 'Error updating mouse', error: error.message });
        }
    }
);

app.delete('/api/mice/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const mouse = await Mouse.findByPk(id, {
            include: Category
        });

        if (!mouse) {
            return res.status(404).json({ message: 'Mouse not found' });
        }

        // Store mouse data before deletion for broadcasting
        const deletedMouse = { ...mouse.get({ plain: true }) };

        // Remove associations and delete the mouse
        await mouse.setCategories([]);
        await mouse.destroy();

        broadcast({ type: 'DELETED_MOUSE', data: deletedMouse });
        res.json({ message: 'Mouse deleted successfully', mouse: deletedMouse });
    } catch (error) {
        console.error('Error deleting mouse:', error);
        res.status(500).json({ message: 'Error deleting mouse', error: error.message });
    }
});

// CRUD operations for categories
app.post(
    '/api/categories',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, description } = req.body;
            const newCategory = await Category.create({ name, description });

            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ message: 'Error creating category', error: error.message });
        }
    }
);

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: { model: Mouse, through: { attributes: [] } }
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

app.get('/api/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const category = await Category.findByPk(id, {
            include: { model: Mouse, through: { attributes: [] } }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
});

app.patch(
    '/api/categories/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('Valid category id is required'),
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = parseInt(req.params.id);
            const category = await Category.findByPk(id);

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const { name, description } = req.body;
            await category.update({
                name: name !== undefined ? name : category.name,
                description: description !== undefined ? description : category.description
            });

            const updatedCategory = await Category.findByPk(id, {
                include: { model: Mouse, through: { attributes: [] } }
            });

            res.json(updatedCategory);
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Error updating category', error: error.message });
        }
    }
);

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Remove associations and delete the category
        await category.setMice([]);
        await category.destroy();

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
});

// Serve React production build static files
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Start server and WebSocket only if this file is executed directly
if (require.main === module) {
    const server = app.listen(5002, '0.0.0.0', () => {
        console.log('Server running on port 5002 and accessible externally');
    });

    // Upgrade HTTP server to WebSocket server
    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    // WebSocket connection handling
    wss.on('connection', async (ws) => {
        try {
            clients.push(ws);
            console.log('New WebSocket client connected');

            // Send only a limited number of mice
            const mice = await Mouse.findAll({
                include: Category,
                limit: 50,  // Only load 50 records
                order: [['createdAt', 'DESC']] // Get the most recent ones
            });

            // Get total count without loading all records
            const totalCount = await Mouse.count();

            ws.send(JSON.stringify({
                type: 'INITIAL_DATA',
                data: mice,
                meta: {
                    totalCount: totalCount,
                    loadedCount: mice.length,
                    message: `Showing ${mice.length} of ${totalCount} records. Use pagination for more.`
                }
            }));

            ws.on('close', () => {
                clients = clients.filter((client) => client !== ws);
                console.log('WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        } catch (error) {
            console.error('Error handling WebSocket connection:', error);
        }
    });
}

module.exports = app;


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(cors());
app.use(bodyParser.json());

// In-memory data store
let mice = [];
let nextId = 1;

// Import initial data
const { MenuList } = require('./data/initialData');

// Initialize mice data with IDs
mice = MenuList.map(mouse => ({
    ...mouse,
    id: nextId++
}));

// API routes
// GET all mice with filtering and sorting
app.get('/api/mice', (req, res) => {
    try {
        const { minPrice, maxPrice, sortOrder } = req.query;

        // Start with a copy of all mice
        let result = [...mice];

        // Apply filtering
        if (minPrice) {
            result = result.filter(mouse => mouse.price >= parseFloat(minPrice));
        }

        if (maxPrice) {
            result = result.filter(mouse => mouse.price <= parseFloat(maxPrice));
        }

        // Apply sorting
        if (sortOrder === 'lowToHigh') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'highToLow') {
            result.sort((a, b) => b.price - a.price);
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a single mouse by ID
app.get('/api/mice/:id', (req, res) => {
    const mouse = mice.find(m => m.id === parseInt(req.params.id));

    if (!mouse) {
        return res.status(404).json({ message: 'Mouse not found' });
    }

    res.json(mouse);
});

// POST a new mouse
app.post('/api/mice', (req, res) => {
    try {
        // Validate required fields
        const { name, image, price, details } = req.body;

        if (!name || !image || !price || !details) {
            return res.status(400).json({
                message: 'Missing required fields: name, image, price, and details are required'
            });
        }

        // Validate price is positive
        if (price <= 0) {
            return res.status(400).json({ message: 'Price must be positive' });
        }

        // Create new mouse with unique ID
        const newMouse = {
            ...req.body,
            id: nextId++
        };

        mice.push(newMouse);
        res.status(201).json(newMouse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT (update) a mouse
app.put('/api/mice/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = mice.findIndex(m => m.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Mouse not found' });
        }

        // Validate required fields if they exist in request
        const { name, image, price, details } = req.body;

        if (price !== undefined && price <= 0) {
            return res.status(400).json({ message: 'Price must be positive' });
        }

        // Update mouse preserving the ID
        mice[index] = {
            ...mice[index],
            ...req.body,
            id
        };

        res.json(mice[index]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a mouse
app.delete('/api/mice/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = mice.findIndex(m => m.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Mouse not found' });
        }

        const deletedMouse = mice[index];
        mice = mice.filter(m => m.id !== id);

        res.json({
            message: 'Mouse deleted successfully',
            mouse: deletedMouse
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
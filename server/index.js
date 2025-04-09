// Language: JavaScript
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const WebSocket = require('ws');
const { MenuList } = require('./data/initialData');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize data
let mice = MenuList.map((mouse, index) => ({ id: index + 1, ...mouse }));
let nextId = mice.length + 1;

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

// Generate new entities asynchronously
setInterval(() => {
    const newMouse = {
        id: nextId++,
        name: `Mouse ${Date.now()}`,
        price: (Math.random() * 100).toFixed(2),
        details: 'Generated dynamically',
        image: '/assets/viperv3pro.avif',
    };
    mice.push(newMouse);
    broadcast({ type: 'NEW_MOUSE', data: newMouse });
}, 10000); // Every 10 seconds

// WebSocket connection
wss.on('connection', (ws) => {
    clients.push(ws);
    console.log('New WebSocket client connected');

    // Send initial data to the client
    ws.send(JSON.stringify({ type: 'INITIAL_DATA', data: mice }));

    ws.on('close', () => {
        clients = clients.filter((client) => client !== ws);
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// File upload setup with custom storage and 100MB file size limit
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

// File upload endpoint with the new upload middleware
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.status(201).json({ message: 'File uploaded successfully', filePath: `/uploads/${req.file.filename}` });
});

// File download endpoint
app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});

// CRUD endpoints
app.post('/api/mice', (req, res) => {
    const { name, image, price, details } = req.body;

    if (!name || isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Invalid mouse data. Name and positive price are required.' });
    }

    const newMouse = { id: nextId++, name, image, price, details };
    mice.push(newMouse);
    broadcast({ type: 'NEW_MOUSE', data: newMouse });
    res.status(201).json(newMouse);
});

app.get('/api/mice', (req, res) => {
    const { minPrice, maxPrice, sortOrder } = req.query;
    let filteredMice = [...mice];

    if (minPrice) filteredMice = filteredMice.filter((m) => m.price >= parseFloat(minPrice));
    if (maxPrice) filteredMice = filteredMice.filter((m) => m.price <= parseFloat(maxPrice));

    if (sortOrder === 'lowToHigh') {
        filteredMice.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'highToLow') {
        filteredMice.sort((a, b) => b.price - a.price);
    }

    res.json(filteredMice);
});

app.patch('/api/mice/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = mice.findIndex((m) => m.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mouse not found' });
    }

    const { name, image, price, details } = req.body;

    if (price !== undefined && price <= 0) {
        return res.status(400).json({ message: 'Price must be positive' });
    }

    mice[index] = { ...mice[index], ...req.body, id };
    broadcast({ type: 'UPDATED_MOUSE', data: mice[index] });
    res.json(mice[index]);
});

app.delete('/api/mice/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = mice.findIndex((m) => m.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mouse not found' });
    }

    const deletedMouse = mice[index];
    mice = mice.filter((m) => m.id !== id);
    broadcast({ type: 'DELETED_MOUSE', data: deletedMouse });
    res.json({ message: 'Mouse deleted successfully', mouse: deletedMouse });
});

// Start server
const server = app.listen(5002, () => {
    console.log('Server running on port 5002');
});

// Upgrade HTTP server to WebSocket server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
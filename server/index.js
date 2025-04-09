const express = require('express');
const cors = require('cors');
const path = require('path'); // Import path module
const { MenuList } = require('./data/initialData'); // Import the initial data

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the "assets" directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

let mice = MenuList.map((mouse, index) => ({ id: index + 1, ...mouse })); // Initialize with unique IDs
let nextId = mice.length + 1;

// POST: Add a new mouse
app.post('/api/mice', (req, res) => {
    const { name, image, price, details } = req.body;

    if (!name || !price || price <= 0) {
        return res.status(400).json({ message: 'Invalid mouse data' });
    }

    const newMouse = { id: nextId++, name, image, price, details };
    mice.push(newMouse);
    res.status(201).json(newMouse);
});

// GET: Retrieve all mice
app.get('/api/mice', (req, res) => {
    const { minPrice, maxPrice, sortOrder } = req.query;
    let filteredMice = [...mice];

    if (minPrice) filteredMice = filteredMice.filter(m => m.price >= parseFloat(minPrice));
    if (maxPrice) filteredMice = filteredMice.filter(m => m.price <= parseFloat(maxPrice));

    if (sortOrder === 'lowToHigh') {
        filteredMice.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'highToLow') {
        filteredMice.sort((a, b) => b.price - a.price);
    }

    res.json(filteredMice);
});

// PATCH: Update a mouse partially
app.patch('/api/mice/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = mice.findIndex(m => m.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Mouse not found' });
    }

    const { name, image, price, details } = req.body;

    if (price !== undefined && price <= 0) {
        return res.status(400).json({ message: 'Price must be positive' });
    }

    mice[index] = { ...mice[index], ...req.body, id };
    res.json(mice[index]);
});

// DELETE: Remove a mouse
app.delete('/api/mice/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log('Deleting mouse with ID:', id);

    const index = mice.findIndex(m => m.id === id);
    if (index === -1) {
        console.error('Mouse not found:', id);
        return res.status(404).json({ message: 'Mouse not found' });
    }

    const deletedMouse = mice[index];
    mice = mice.filter(m => m.id !== id);
    console.log('Mouse deleted:', deletedMouse);

    res.json({ message: 'Mouse deleted successfully', mouse: deletedMouse });
});

// Start server
if (require.main === module) {
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
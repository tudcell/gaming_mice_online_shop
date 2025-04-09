const request = require('supertest');
const app = require('../index'); // Adjust the path to your server file

describe('Mice API', () => {
    let createdMouseId;

    // Test POST: Add a new mouse
    it('should add a new mouse', async () => {
        const response = await request(app)
            .post('/api/mice')
            .send({ name: 'Test Mouse', image: '/test.jpg', price: 10, details: 'Test details' });
        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test Mouse');
        createdMouseId = response.body.id; // Save the ID for later tests
    });

    // Test GET: Retrieve all mice
    it('should retrieve all mice', async () => {
        const response = await request(app).get('/api/mice');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // Test GET with filtering
    it('should filter mice by price range', async () => {
        const response = await request(app).get('/api/mice?minPrice=5&maxPrice=15');
        expect(response.status).toBe(200);
        expect(response.body.every(mouse => mouse.price >= 5 && mouse.price <= 15)).toBe(true);
    });

    // Test GET with sorting
    it('should sort mice by price in ascending order', async () => {
        const response = await request(app).get('/api/mice?sortOrder=lowToHigh');
        expect(response.status).toBe(200);
        const prices = response.body.map(mouse => mouse.price);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    // Test PATCH: Update a mouse partially
    it('should update a mouse partially', async () => {
        const response = await request(app)
            .patch(`/api/mice/${createdMouseId}`)
            .send({ price: 20 });
        expect(response.status).toBe(200);
        expect(response.body.price).toBe(20);
    });

    it('should return 404 if mouse to patch is not found', async () => {
        const response = await request(app)
            .patch('/api/mice/9999')
            .send({ price: 20 });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Mouse not found');
    });

    it('should return 400 if invalid data is provided in patch', async () => {
        const response = await request(app)
            .patch(`/api/mice/${createdMouseId}`)
            .send({ price: -10 });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Price must be positive');
    });

    // Test DELETE: Remove a mouse
    it('should delete a mouse', async () => {
        const response = await request(app).delete(`/api/mice/${createdMouseId}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Mouse deleted successfully');
    });

    it('should return 404 if mouse to delete is not found', async () => {
        const response = await request(app).delete('/api/mice/9999');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Mouse not found');
    });
});
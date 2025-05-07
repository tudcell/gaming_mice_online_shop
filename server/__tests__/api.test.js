// Language: JavaScript
const request = require('supertest');
const app = require('../index'); // adjust the path if needed

describe('Mice API Unit Tests', () => {
    let createdMouseId;

    // Test POST: Add a new mouse
    it('should add a new mouse', async () => {
        const response = await request(app)
            .post('/api/mice')
            .send({ name: 'Test Mouse', image: '/test.jpg', price: 10, details: 'Test details' });
        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test Mouse');
        expect(response.body.price).toBe(10);
        createdMouseId = response.body.id;
    });

    // Test PATCH: Update the mouse's price
    it('should update the mouse price', async () => {
        const response = await request(app)
            .patch(`/api/mice/${createdMouseId}`)
            .send({ price: 20 });
        expect(response.status).toBe(200);
        expect(response.body.price).toBe(20);
    });

    // Test PATCH: Return 400 with invalid price (negative price)
    it('should return 400 when updating with an invalid price', async () => {
        const response = await request(app)
            .patch(`/api/mice/${createdMouseId}`)
            .send({ price: -5 });
        expect(response.status).toBe(400);
        // The response errors array should contain at least one error message
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
    });

    // Test DELETE: Remove the mouse
    it('should delete the mouse', async () => {
        const response = await request(app).delete(`/api/mice/${createdMouseId}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/deleted successfully/);
    });

    // Test DELETE: Return 404 for a non-existent mouse
    it('should return 404 when attempting to delete a non-existent mouse', async () => {
        const response = await request(app).delete(`/api/mice/99999`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Mouse not found');
    });
});
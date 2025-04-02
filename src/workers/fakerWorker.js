/* eslint-disable no-restricted-globals */
// src/workers/fakerWorker.js
import { faker } from '@faker-js/faker';

// Handle messages from the main thread
self.onmessage = (event) => {
    const { action } = event.data;

    if (action === 'addMouse') {
        const newMouse = {
            name: `${faker.company.name()} ${faker.commerce.productName()}`,
            image: faker.image.urlLoremFlickr(640, 480, 'technics', true),
            price: parseFloat(faker.commerce.price(100, 1000, 2)),
            details: faker.lorem.paragraph(),
            isFake: true
        };
        self.postMessage({ type: 'newMouse', mouse: newMouse });
    } else if (action === 'startGeneration') {
        // Start timers for adding and removing mice
        const addInterval = setInterval(() => {
            const newMouse = {
                name: `${faker.company.name()} ${faker.commerce.productName()}`,
                image: faker.image.urlLoremFlickr(640, 480, 'technics', true),
                price: parseFloat(faker.commerce.price(100, 1000, 2)),
                details: faker.lorem.paragraph(),
                isFake: true
            };
            self.postMessage({ type: 'newMouse', mouse: newMouse });
        }, 5000);

        const deleteInterval = setInterval(() => {
            self.postMessage({ type: 'deleteMouse' });
        }, 10000);

        // Store interval IDs internally - we don't send these back to main thread
        self._addInterval = addInterval;
        self._deleteInterval = deleteInterval;

        self.postMessage({ type: 'intervalsStarted' });
    } else if (action === 'stopGeneration') {
        // Clear intervals using the IDs stored in the worker
        if (self._addInterval) clearInterval(self._addInterval);
        if (self._deleteInterval) clearInterval(self._deleteInterval);
        self._addInterval = null;
        self._deleteInterval = null;
    }
};
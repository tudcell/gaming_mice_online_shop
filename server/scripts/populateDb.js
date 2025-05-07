// server/scripts/populateDb.js
const { faker } = require('@faker-js/faker');
const { sequelize, Mouse, Category } = require('../db');
const cliProgress = require('cli-progress');

// Constants
const MICE_COUNT = 200000;
const CATEGORIES_COUNT = 100;
const BATCH_SIZE = 1000;

async function populateDatabase() {
    console.log('Starting massive data population...');

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established');

        // Create progress bars
        const multiBar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: '{bar} {percentage}% | {value}/{total} | {name}'
        }, cliProgress.Presets.shades_classic);

        const catBar = multiBar.create(CATEGORIES_COUNT, 0, { name: 'Categories' });
        const miceBar = multiBar.create(MICE_COUNT, 0, { name: 'Mice      ' });
        const relBar = multiBar.create(MICE_COUNT, 0, { name: 'Relations  ' });

        // Generate categories in one batch
        console.log('\nGenerating categories...');
        const categoryData = Array.from({ length: CATEGORIES_COUNT }, (_, i) => ({
            name: `${faker.commerce.department()} ${faker.commerce.productAdjective()} ${i}`,
            description: faker.commerce.productDescription()
        }));

        await Category.bulkCreate(categoryData);
        catBar.update(CATEGORIES_COUNT);

        // Fetch all categories for relationships
        const categories = await Category.findAll();
        const categoryIds = categories.map(c => c.id);

        // Generate mice in batches
        console.log('\nGenerating mice...');
        for (let i = 0; i < MICE_COUNT; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, MICE_COUNT - i);
            const miceData = Array.from({ length: batchSize }, () => ({
                name: `${faker.commerce.productName()} ${faker.string.uuid().substring(0, 8)}`, // Fixed here
                price: parseFloat(faker.commerce.price({ min: 10, max: 300, precision: 2 })), // Fixed here
                details: faker.lorem.paragraph(),
                image: `/assets/${faker.helpers.arrayElement(['viperv3pro.avif', 'deathadderV3.avif', 'superlight.avif'])}`, // Fixed here
                isGenerated: true,
                createdAt: faker.date.past({ years: 2 }), // Fixed here
                updatedAt: faker.date.recent({ days: 30 }) // Fixed here
            }));

            const createdMice = await Mouse.bulkCreate(miceData);
            miceBar.update(i + batchSize);

            // Create relations for this batch
            const mouseCategories = [];
            for (const mouse of createdMice) {
                // Randomly select 1-4 categories for this mouse
                const numCats = faker.number.int({ min: 1, max: 4 }); // Fixed here
                const selectedCats = faker.helpers.arrayElements(categoryIds, numCats); // Fixed here

                for (const catId of selectedCats) {
                    mouseCategories.push({
                        MouseId: mouse.id,
                        CategoryId: catId
                    });
                }
            }

            // Bulk insert the relations
            await sequelize.models.MouseCategories.bulkCreate(mouseCategories);
            relBar.update(i + batchSize);
        }

        multiBar.stop();
        console.log('\nCreating database indices...');

        // Create optimized indices
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_mouse_price ON "Mice" (price);
            CREATE INDEX IF NOT EXISTS idx_mouse_created ON "Mice" ("createdAt");
            CREATE INDEX IF NOT EXISTS idx_mousecategories_mouse ON "MouseCategories" ("MouseId");
            CREATE INDEX IF NOT EXISTS idx_mousecategories_category ON "MouseCategories" ("CategoryId");
        `);

        console.log('Database population completed successfully!');
    } catch (error) {
        console.error('Error populating database:', error);
    } finally {
        await sequelize.close();
    }
}

populateDatabase();
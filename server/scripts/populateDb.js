// server/scripts/populateDb.js
const { faker } = require('@faker-js/faker');
const { sequelize, Mouse, Category } = require('../db');
const cliProgress = require('cli-progress');

// Constants - adjusted to have ~100k in each table
const MICE_COUNT = 200000;       // ~99k mice
const CATEGORIES_COUNT = 99000; // ~99k categories
const BATCH_SIZE = 1000;

async function populateDatabase() {
    console.log('Starting data population with ~100k entities per table...');

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

        // Generate categories in batches
        console.log('\nGenerating categories...');
        for (let i = 0; i < CATEGORIES_COUNT; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, CATEGORIES_COUNT - i);
            const categoryData = Array.from({ length: batchSize }, (_, idx) => ({
                name: `${faker.commerce.department()} ${faker.commerce.productAdjective()} ${i + idx}`,
                description: faker.commerce.productDescription()
            }));

            await Category.bulkCreate(categoryData);
            catBar.update(i + batchSize);
        }

        // Fetch all categories for relationships
        const categories = await Category.findAll();
        const categoryIds = categories.map(c => c.id);

        // Generate mice in batches
        console.log('\nGenerating mice...');
        for (let i = 0; i < MICE_COUNT; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, MICE_COUNT - i);
            const miceData = Array.from({ length: batchSize }, () => {
                return {
                    name: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
                    price: faker.number.float({ min: 10, max: 300, precision: 0.01 }),
                    details: faker.lorem.paragraph(1),
                    image: `/assets/viperv3pro.avif`, // Only using viperv3pro image
                    isGenerated: true,
                    createdAt: faker.date.past({ years: 1 }),
                    updatedAt: faker.date.recent({ days: 10 })
                };
            });

            const createdMice = await Mouse.bulkCreate(miceData);
            miceBar.update(i + batchSize);

            // Create relations for this batch - ~1 relation per mouse to reach ~99k total
            const mouseCategories = [];
            for (const mouse of createdMice) {
                // Select a random category for each mouse to avoid duplicate relations
                const catId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
                mouseCategories.push({
                    MouseId: mouse.id,
                    CategoryId: catId
                });
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

        // Get final count of records
        const miceCount = await Mouse.count();
        const catCount = await Category.count();
        const relCount = await sequelize.models.MouseCategories.count();

        console.log('\nDatabase population completed successfully!');
        console.log('─────────────────────────────────');
        console.log(`Total Mice: ${miceCount}`);
        console.log(`Total Categories: ${catCount}`);
        console.log(`Total Relationship records: ${relCount}`);
        console.log(`Total records: ${miceCount + catCount + relCount}`);
        console.log('─────────────────────────────────');

    } catch (error) {
        console.error('Error populating database:', error);
    } finally {
        await sequelize.close();
    }
}

populateDatabase();
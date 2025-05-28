// server/scripts/deleteAllData.js
const { sequelize, Mouse, Category } = require('../db');

async function deleteAllData() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established');

        // First delete all relationships in the junction table
        console.log('Deleting all mouse-category relationships...');
        const relationshipsDeleted = await sequelize.models.MouseCategories.destroy({
            where: {} // Empty where clause means delete all
        });
        console.log(`Deleted ${relationshipsDeleted} mouse-category relationships`);

        // Delete all mice
        console.log('Deleting all mice...');
        const miceDeleted = await Mouse.destroy({
            where: {} // Empty where clause means delete all
        });
        console.log(`Deleted ${miceDeleted} mice records`);

        // Delete all categories
        console.log('Deleting all categories...');
        const categoriesDeleted = await Category.destroy({
            where: {} // Empty where clause means delete all
        });
        console.log(`Deleted ${categoriesDeleted} category records`);

        // Reset the auto-increment sequences
        if (sequelize.options.dialect === 'postgres') {
            await sequelize.query(`SELECT setval('"Mice_id_seq"', 1, false);`);
            await sequelize.query(`SELECT setval('"Categories_id_seq"', 1, false);`);

            // Check if MouseCategories has an id sequence
            try {
                await sequelize.query(`SELECT setval('"MouseCategories_id_seq"', 1, false);`);
            } catch (error) {
                console.log('Note: MouseCategories table does not have an id sequence.');
            }

            console.log('Reset sequence counters');
        }

        // Drop all custom indexes
        console.log('Dropping all custom indexes...');
        await sequelize.query(`
            DROP INDEX IF EXISTS idx_mice_price_covering;
            DROP INDEX IF EXISTS idx_mice_created_price;
            DROP INDEX IF EXISTS idx_mousecategories_composite;
            DROP INDEX IF EXISTS idx_mice_id_price;
            DROP INDEX IF EXISTS idx_categories_name;
            DROP INDEX IF EXISTS idx_mice_premium;
            DROP INDEX IF EXISTS idx_mice_price_range;
            DROP INDEX IF EXISTS idx_mouse_price;
            DROP INDEX IF EXISTS idx_mouse_created;
            DROP INDEX IF EXISTS idx_mousecategories_mouse;
            DROP INDEX IF EXISTS idx_mousecategories_category;
        `);
        console.log('All custom indexes dropped');

        console.log('All database data and indexes deleted successfully!');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await sequelize.close();
    }
}

deleteAllData();
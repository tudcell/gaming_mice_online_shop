// server/scripts/clearGeneratedMice.js
const { sequelize, Mouse } = require('../db');

async function clearGeneratedMice() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established');

        console.log('Counting generated mice...');
        const count = await Mouse.count({ where: { isGenerated: true } });

        console.log(`Found ${count} generated mice. Deleting...`);

        // Delete all generated mice
        const result = await Mouse.destroy({
            where: { isGenerated: true }
        });

        console.log(`Successfully deleted ${result} generated mice records`);

        // Reset the auto-increment sequence to avoid gaps
        if (sequelize.options.dialect === 'postgres') {
            await sequelize.query(`SELECT setval('"Mice_id_seq"', (SELECT MAX(id) FROM "Mice"));`);
            console.log('Reset sequence counter');
        }

        console.log('Database cleanup completed successfully!');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await sequelize.close();
    }
}

clearGeneratedMice();
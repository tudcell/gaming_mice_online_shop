// server/scripts/optimizeIndices.js
const { sequelize } = require('../db');

async function optimizeIndices() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');

        console.log('Creating optimized database indices...');

        // Drop existing basic indices to replace with better ones
        await sequelize.query(`
            DROP INDEX IF EXISTS idx_mouse_price;
            DROP INDEX IF EXISTS idx_mouse_created;
            DROP INDEX IF EXISTS idx_mousecategories_mouse;
            DROP INDEX IF EXISTS idx_mousecategories_category;
        `);

        // Create more specialized indices
        await sequelize.query(`
            -- Better price index with included columns for covering queries
            CREATE INDEX IF NOT EXISTS idx_mice_price_covering ON "Mice" (price) INCLUDE (name, "createdAt");
            
            -- Index for date range queries, optimized for sorting
            CREATE INDEX IF NOT EXISTS idx_mice_created_price ON "Mice" ("createdAt", price);
            
            -- Composite index for the MouseCategories junction
            CREATE INDEX IF NOT EXISTS idx_mousecategories_composite ON "MouseCategories" ("CategoryId", "MouseId");
            
            -- Additional index for common JOIN conditions
            CREATE INDEX IF NOT EXISTS idx_mice_id_price ON "Mice" (id, price);
            
            -- Index for category name searches
            CREATE INDEX IF NOT EXISTS idx_categories_name ON "Categories" (name);
            
            -- Partial index for high-priced mice (if those are queried often)
            CREATE INDEX IF NOT EXISTS idx_mice_premium ON "Mice" (id, name, price) 
            WHERE price > 100;
            
            -- Expression-based index for price range queries
            CREATE INDEX IF NOT EXISTS idx_mice_price_range ON "Mice" ((
                CASE
                    WHEN price < 50 THEN 0
                    WHEN price BETWEEN 50 AND 100 THEN 1
                    WHEN price BETWEEN 100 AND 200 THEN 2
                    ELSE 3
                END
            ));
        `);

        // Update statistics for PostgreSQL query planner
        await sequelize.query(`ANALYZE "Mice"`);
        await sequelize.query(`ANALYZE "Categories"`);
        await sequelize.query(`ANALYZE "MouseCategories"`);

        console.log('Database indices optimized!');

    } catch (error) {
        console.error('Error optimizing indices:', error);
    } finally {
        await sequelize.close();
    }
}

optimizeIndices();
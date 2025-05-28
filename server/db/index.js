// server/db/index.js
const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Configure Sequelize with PostgreSQL

// Modified version for server/db/index.js
const sequelize = new Sequelize({
    database: process.env.PG_DATABASE || 'MICE_DB',
    username: process.env.PG_USER || 'tudorsabau',
    password: process.env.PG_PASSWORD || '',
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
        freezeTableName: false,
        timestamps: true
    },
    // Remove operatorsAliases as it's deprecated
    skipIndexes: true,
    dialectOptions: {
        // Disable SSL for local development
        ssl: false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
// Define Mouse model
const Mouse = sequelize.define('Mouse', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isGenerated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Define Category model
const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

// Define many-to-many relationship
Mouse.belongsToMany(Category, { through: 'MouseCategories' });
Category.belongsToMany(Mouse, { through: 'MouseCategories' });

// Helper function for filtering mice
const getMiceFilters = (queryParams) => {
    const where = {};

    if (queryParams.minPrice || queryParams.maxPrice) {
        where.price = {};
        if (queryParams.minPrice) {
            where.price[Op.gte] = parseFloat(queryParams.minPrice);
        }
        if (queryParams.maxPrice) {
            where.price[Op.lte] = parseFloat(queryParams.maxPrice);
        }
    }

    if (queryParams.search) {
        where.name = { [Op.iLike]: `%${queryParams.search}%` };
    }

    if (queryParams.isGenerated !== undefined) {
        where.isGenerated = queryParams.isGenerated === 'true';
    }

    return where;
};

// Helper function for sorting mice
const getMiceOrder = (queryParams) => {
    if (queryParams.sortField) {
        const direction = queryParams.sortOrder === 'desc' ? 'DESC' : 'ASC';
        return [[queryParams.sortField, direction]];
    }
    return [['createdAt', 'DESC']]; // Default sorting
};

// Sync models with database
// More robust initialization function
const initDb = async (initialData) => {
    try {
        // First test connectivity
        await sequelize.authenticate();
        console.log('Database connection established successfully');

        // Use alter: true instead of sync to avoid the problematic index queries
         await sequelize.sync({ alter: true });
        console.log('Database synchronized');

        // Seed initial data if provided
        if (initialData && Array.isArray(initialData)) {
            const count = await Mouse.count();
            if (count === 0) {
                console.log('Seeding initial data...');
                await Mouse.bulkCreate(initialData);

                const categories = [
                    { name: 'Gaming', description: 'Mice optimized for gaming performance' },
                    { name: 'Office', description: 'Mice for everyday office use' },
                    { name: 'Wireless', description: 'Mice with wireless connectivity' },
                    { name: 'Ergonomic', description: 'Mice designed for comfort and ergonomics' }
                ];

                await Category.bulkCreate(categories, { ignoreDuplicates: true });
            }
        }
    } catch (error) {
        console.error('Database synchronization failed:', error);
        console.error('Error details:', error.stack);
        // Continue execution even if sync fails
    }
};


module.exports = {
    sequelize,
    Mouse,
    Category,
    Op,
    getMiceFilters,
    getMiceOrder,
    initDb
};
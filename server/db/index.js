// server/db/index.js
const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Configure Sequelize with PostgreSQL
const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'MICE_DB',
    process.env.PG_USER || 'tudorsabau',
    process.env.PG_PASSWORD || '',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

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
const initDb = async (initialData) => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');

        // Seed initial data if provided
        if (initialData && Array.isArray(initialData)) {
            const count = await Mouse.count();
            if (count === 0) {
                console.log('Seeding initial data...');
                await Mouse.bulkCreate(initialData);

                // Create some default categories
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
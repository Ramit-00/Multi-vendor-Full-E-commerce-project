const HomeCategory = require('../models/HomeCategory');

class HomeCategoryService {
 
    // Create a single home category
    async createHomeCategory(homeCategory) {
        return await HomeCategory.create(homeCategory);
    }

    // Helper to deduplicate categories by section and categoryId (or image for GRID)
    _deduplicateCategories(categories) {
        const seen = new Set();
        return (categories || []).filter(c => {
            const key = c.section === 'GRID' 
                ? `${c.section}_${c.image || c.categoryId}`
                : `${c.section}_${(c.categoryId || c.name || '').toLowerCase().trim()}`;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // Create multiple home categories or return existing ones
    async createCategories(homeCategories) {
        const mongoose = require('mongoose');
        try {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                const existingCategories = await HomeCategory.find();
                if (existingCategories.length === 0) {
                    const dedupedToInsert = this._deduplicateCategories(homeCategories);
                    return await HomeCategory.insertMany(dedupedToInsert);
                }
                return this._deduplicateCategories(existingCategories);
            }
        } catch (e) {
            console.warn('[HomeCategoryService] MongoDB unavailable, using fallback categories');
        }
        return this._deduplicateCategories(homeCategories);
    }

    // Update an existing home category
    async updateHomeCategory(category, id) {
        const existingCategory = await HomeCategory.findById(id);
        if (!existingCategory) {
            throw new Error("Category not found");
        }
        return await HomeCategory.findByIdAndUpdate(existingCategory._id,category,{new : true});
    }

    // Get all home categories
    async getAllHomeCategories() {
        const mongoose = require('mongoose');
        try {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                const categories = await HomeCategory.find();
                return this._deduplicateCategories(categories);
            }
        } catch (e) {
            console.warn('[HomeCategoryService] MongoDB query warning:', e.message);
        }
        try {
            const path = require('path');
            const fallbackPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'data', 'homeCategories.json');
            const fallback = require(fallbackPath);
            return this._deduplicateCategories(fallback);
        } catch (fallbackErr) {
            return [];
        }
    }
}

module.exports = new HomeCategoryService();

const HomeCategorySection = require('../domain/HomeCategorySection');
const Deal = require('../models/Deal');

class HomeService {
    async createHomePageData(allCategories) {
        // Helper to deduplicate by categoryId or name
        const dedupeByCategory = (list) => {
            const seen = new Set();
            return list.filter(item => {
                const key = (item.categoryId || item.name || '').toLowerCase().trim();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        // Helper for grid editorial items (distinguished by image or categoryId)
        const dedupeGrid = (list) => {
            const seen = new Set();
            return list.filter(item => {
                const key = (item.image || item.categoryId || item.name || '').toLowerCase().trim();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        // Filter and deduplicate categories based on their section
        const gridCategories = dedupeGrid(allCategories.filter(category => 
            category.section === HomeCategorySection.GRID
        ));

        const shopByCategories = dedupeByCategory(allCategories.filter(category => 
            category.section === HomeCategorySection.SHOP_BY_CATEGORIES
        ));

        const electricCategories = dedupeByCategory(allCategories.filter(category => 
            category.section === HomeCategorySection.ELECTRIC_CATEGORIES
        ));

        const dealCategories = dedupeByCategory(allCategories.filter(category => 
            category.section === HomeCategorySection.DEALS
        ));

        // Check if there are existing deals
        const mongoose = require('mongoose');
        let createdDeals = [];

        try {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                const existingDeals = await Deal.find().populate("category");
                if (existingDeals.length === 0) {
                    // Create new deals if none exist
                    const deals = dealCategories.map(category => 
                        new Deal({ discount: 10, category: category }) 
                    );

                    createdDeals = await Deal.insertMany(deals);
                    createdDeals = await Deal.find({ _id: { $in: createdDeals.map(deal => deal._id) } })
                    .populate('category'); 
                } else {
                    createdDeals = existingDeals;
                }
            } else {
                createdDeals = dealCategories.map((category, idx) => ({
                    _id: `fallback_deal_${idx}`,
                    discount: [20, 30, 40, 50, 15, 25][idx % 6],
                    category: category
                }));
            }
        } catch (e) {
            console.warn('[HomeService] MongoDB unavailable, using fallback deals');
            createdDeals = dealCategories.map((category, idx) => ({
                _id: `fallback_deal_${idx}`,
                discount: [20, 30, 40, 50, 15, 25][idx % 6],
                category: category
            }));
        }

        // Deduplicate deals by category
        const seenDealCategories = new Set();
        const uniqueDeals = createdDeals.filter(deal => {
            const cat = deal.category;
            const key = cat ? (cat.categoryId || cat._id || cat.name) : deal._id;
            if (!key || seenDealCategories.has(String(key))) return false;
            seenDealCategories.add(String(key));
            return true;
        });

        const home = {
            grid: gridCategories,
            shopByCategories: shopByCategories,
            electricCategories: electricCategories,
            deals: uniqueDeals,
            dealCategories: dealCategories
        };

        return home; 
    }
}

module.exports = new HomeService();

const HomeCategorySection = require('../domain/HomeCategorySection');
const Deal = require('../models/Deal');

class HomeService {
    async createHomePageData(allCategories) {
        // Filter categories based on their section
        const gridCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.GRID
        );

        const shopByCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.SHOP_BY_CATEGORIES
        );

        const electricCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.ELECTRIC_CATEGORIES
        );

        const dealCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.DEALS
        );

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

        const home = {
            grid: gridCategories,
            shopByCategories: shopByCategories,
            electricCategories: electricCategories,
            deals: createdDeals,
            dealCategories: dealCategories
        };

        return home; 
    }
}

module.exports = new HomeService();

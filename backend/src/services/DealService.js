const Deal = require("../models/Deal");
const HomeCategory = require("../models/HomeCategory");

class DealService {
  async getDeals() {
    return await Deal.find().populate({ path: "category" });
  }

  async createDeal(deal) {
    try {
      const category = await HomeCategory.findById(deal.category._id);

      const newDeal = new Deal({
        ...deal,
        category: category,
      });

      const savedDeal = await newDeal.save();
      return await Deal.findById(savedDeal._id).populate({ path: "category" });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update an existing deal
  async updateDeal(deal, id) {
    const existingDeal = await Deal.findById(id).populate({ path: "category" });

    console.log("existing deal ", existingDeal.category, deal);

    if (existingDeal) {
      return await Deal.findByIdAndUpdate(
        existingDeal._id,
        { discount: deal.discount },
        { new: true }
      ).populate({ path: "category" });
    }
    throw new Error("Deal not found");
  }

  // Delete an existing deal
  async deleteDeal(id) {
    const deal = await Deal.findById(id); // Fetch the deal by ID
    if (!deal) {
      throw new Error("Deal not found"); // Throw an error if deal not found
    }
    await Deal.deleteOne({ _id: id }); // Delete the deal by ID
  }
}

module.exports = new DealService(); // Exporting an instance of DealService

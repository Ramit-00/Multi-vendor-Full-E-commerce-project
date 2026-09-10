const PayoutService = require('../services/PayoutService');

class PayoutController {
  async getPayoutsBySeller(req, res) {
    try {
      const sellerId = req.seller?.id || req.seller?._id;
      if (!sellerId) {
        return res.status(401).json({ message: 'Seller authentication required' });
      }

      const payouts = await PayoutService.getPayoutsBySeller(sellerId);
      return res.status(200).json(payouts);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getPayoutById(req, res) {
    try {
      const { id } = req.params;
      const payout = await PayoutService.getPayoutById(id);
      return res.status(200).json(payout);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  async updatePayoutStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.query;
      const updated = await PayoutService.updatePayoutStatus(id, status);
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new PayoutController();

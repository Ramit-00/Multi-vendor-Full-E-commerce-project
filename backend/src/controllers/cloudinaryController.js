const { cloudinary } = require('../config/cloudinary');

class CloudinaryController {
  async getUploadSignature(req, res) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = 'ecom_products';

      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

      if (!apiSecret || !apiKey || !cloudName) {
        return res.status(500).json({
          message: 'Cloudinary credentials are not configured in environment',
        });
      }

      const paramsToSign = {
        folder,
        timestamp,
      };

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      return res.status(200).json({
        signature,
        timestamp,
        folder,
        apiKey,
        cloudName,
      });
    } catch (err) {
      console.error('[CloudinaryController] getUploadSignature error:', err.message);
      return res.status(500).json({
        message: 'Failed to generate Cloudinary upload signature',
        error: err.message,
      });
    }
  }
}

module.exports = new CloudinaryController();

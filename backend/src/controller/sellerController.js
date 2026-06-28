

import sellerService from '../service/sellerService.js';
import VerificationCode from '../model/VerificationCode.js';
import jwtProvider from '../util/jwtProvider.js';
import userRoles from '../domain/userRole.js';

class SellerController {

  async getSellerProfile(req, res) {   // Bearer token is expected in the Authorization header
    try {
      const profile = await req.seller;  // The seller object is attached to the request by the sellerMiddleware
      const jwt = req.headers.authorization.split(' ')[1]; // Assuming JWT is sent in the Authorization header
      const sellerData = await sellerService.getSellerProfile(jwt);
      res.status(200).json(sellerData);
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }   
  }

  async createSeller(req, res) {
    try {
      const sellerData = req.body;
      const newSeller = await sellerService.createSeller(sellerData);
      res.status(201).json({ message: 'Seller created successfully', seller: newSeller });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async getAllSellers(req, res) {
    try{
      const status = req.query.status;
      const sellersList = await sellerService.getAllSellers(status);
      res.status(200).json(sellersList);
    } catch(error){
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async updateSeller(req, res) {
    try {
      const existingSeller = req.seller;
      const sellerData = req.body;
      const updatedSeller = await sellerService.updateSeller(existingSeller.id, sellerData);
      res.status(200).json({ message: 'Seller updated successfully', updatedSeller });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async deleteSeller(req, res) {
    try{
      const existingSeller = req.seller;
      await sellerService.deleteSeller(existingSeller.id);
      res.status(200).json({ message: 'Seller account deleted successfully' });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async updateSellerAccountStatus(req, res) {
    try {
      const updatedSeller = await sellerService.updateSellerAccountStatus(req.params.id, req.params.status);
      res.status(200).json({ message: 'Seller account status updated successfully', updatedSeller });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async verifyLoginOtp(req, res) {
    try{
      const{ email, otp } = req.body;
      const sellerData = await sellerService.getSellerByEmail(email);
      const verificationCodeData = await VerificationCode.findOne({ email });

      if(!verificationCodeData || verificationCodeData.otp !== otp){
        throw new Error('Invalid OTP');
      }

      const token = jwtProvider.createJwt({ email });

      const authResponse = {
        message: "Login successful",
        jwt: token,
        role:userRoles.SELLER
      }

      return res.status(200).json(authResponse);

    }catch(error){
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }
}

export default new SellerController();
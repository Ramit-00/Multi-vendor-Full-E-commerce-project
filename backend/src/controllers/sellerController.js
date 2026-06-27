

import sellerService from '../service/SellerService.js';
import VerificationCode from '../model/VerificationCode.js';
import jwtProvider from '../util/jwtProvider.js';
import UserRole from '../domain/UserRole.js';

class SellerController {

  async getSellerProfile(req, res) {   // Bearer token is expected in the Authorization header
    try {
      const profile = await req.seller;  // The seller object is attached to the request by the sellerMiddleware
      const jwt = req.headers.authorization.split(' ')[1]; // Assuming JWT is sent in the Authorization header
      const seller = await sellerService.getSellerProfile(jwt);
      res.status(200).json(seller);
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }   
  }

  async createSeller(req, res) {
    try {
      const sellerData = req.body;
      const seller = await sellerService.createSeller(sellerData);
      res.status(201).json({ message: 'Seller created successfully', seller });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async getAllSellers(req, res) {
    try{
      const status = req.query.status;
      const seller = await sellerService.getAllSellers(status);
      res.status(200).json(seller);
    } catch(error){
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async updateSeller(req, res) {
    try {
      const sellerId = req.params.id;
      const sellerData = req.body;
      const updatedSeller = await sellerService.updateSeller(sellerId, sellerData);
      res.status(200).json({ message: 'Seller updated successfully', updatedSeller });
    } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }

  async deleteSeller(req, res) {
    try{
      const sellerId = req.params.id;
      await sellerService.deleteSeller(sellerId);
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
      const seller = await sellerService.getSellerByEmail(email);
      const verificationCode = await VerificationCode.findOne({ email });

      if(!verificationCode || verificationCode.otp !== otp){
        throw new Error('Invalid OTP');
      }

      const token = jwtProvider.createJWT({ email });

      const authResponse = {
        message: "Login successful",
        jwt: token,
        role:UserRole.SELLER
      }

      return res.status(200).json(authResponse);

    }catch(error){
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
    }
  }
}

export default new SellerController();
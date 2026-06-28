import Seller from '../model/Seller.js';
import { Address } from '../model/Address.js';
import jwtProvider from '../util/jwtProvider.js';

class SellerService {

  async createSeller(sellerData) {
    const existingSeller = await Seller.findOne({ email: sellerData.email });
    if (existingSeller) {
      throw new Error('Seller with this email already exists');
    }

    let savedAddress = sellerData.pickupAddress;
    savedAddress = await Address.create(sellerData.pickupAddress);

    const newSeller = new Seller({
      sellerName: sellerData.sellerName,
      email: sellerData.email,
      password: sellerData.password,
      mobileNumber: sellerData.mobileNumber,
      pickupAddress: savedAddress._id,
      GSTIN: sellerData.GSTIN,
      buissnessDetails:sellerData.buisnessDetails,
      bankDetails:sellerData.bankDetails
    });

    return await newSeller.save();  // to save in database
  }

  async getSellerProfile(jwt){
    const email = jwtProvider.getEmailFromJwt(jwt);
    return this.getSellerByEmail(email);
  }

  async getSellerByEmail(email){
    const sellerData = await Seller.findOne({ email });
    if (!sellerData) {
      throw new Error('Seller not found');
    }
    return sellerData;
  }

  async getSellerById(sellerId){
    const sellerData = await Seller.findById(sellerId);
    if (!sellerData) {
      throw new Error('Seller not found');
    }
    return sellerData;
  }

  async getAllSellers(status){
    const filter = status ? { accountStatus: status } : {};
    return await Seller.find(filter);
  }

  async updateSeller(sellerId, sellerData){
    return await Seller.findByIdAndUpdate(sellerId, sellerData, { new: true });
  }

  async updateSellerAccountStatus(sellerId,status){
    return await Seller.findByIdAndUpdate(
      sellerId,
      {$set:{accountStatus:status}},          // Only update the accountStatus field
      {new:true});
  }
}

export default new SellerService();
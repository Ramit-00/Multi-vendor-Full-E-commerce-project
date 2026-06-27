import Seller from '../model/Seller.js';
import VerificationCode from '../model/VerificationCode.js';
import generateOTP from '../util/generateOTP.js';
import sendVerificationEmail from '../util/sendEmail.js';
import sellerService from './SellerService.js';

class AuthService {

  async sendLoginOtp(email) {

    const SIGNIN_PRIFIX = "signin-";   // it's a prefix to identify the email is for signin purpose, not for signup

    if(email.startsWith(SIGNIN_PRIFIX)){
      const seller = await sellerService.getSellerByEmail(email.replace(SIGNIN_PRIFIX, ''));
      if (!seller) {
        throw new Error('Seller not found');
      } 
    }


    const existingVerificationCode = await VerificationCode.findOne({ email });
    if(existingVerificationCode){
      await VerificationCode.deleteOne({ email });
    }

    const otp = generateOTP();
    const verificationCode = new VerificationCode({ email, otp });
    await verificationCode.save();

    // send email to seller
    const subject = " Your Login OTP for E-commerce project Platform";
    const body = `<p>Your OTP for logging into the E-commerce project platform is: <strong>${otp}</strong></p>`;

    await sendVerificationEmail(email, subject, body);
  }
}
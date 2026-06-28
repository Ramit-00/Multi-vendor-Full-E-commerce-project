import bcrypt from 'bcrypt';
import Seller from '../model/Seller.js';
import { User } from '../model/User.js';
import VerificationCode from '../model/VerificationCode.js';
import generateOTP from '../util/generateOTP.js';
import sendVerificationEmail from '../util/sendEmail.js';
import sellerService from './sellerService.js';
import userService from './userService.js';
import jwtProvider from '../util/jwtProvider.js';

class AuthService {

  async sendLoginOtp(email) {

    const SIGNIN_PRIFIX = "signin-";   // it's a prefix to identify the email is for signin purpose, not for signup

    if(email.startsWith(SIGNIN_PRIFIX)){
      const sellerData = await Seller.findOne({ email: email.replace(SIGNIN_PRIFIX, '') });
      const userData = await User.findOne({ email: email.replace(SIGNIN_PRIFIX, '') });
      if (!sellerData && !userData) {
        throw new Error('Seller or User not found');
      } 
    }


    const existingVerificationCode = await VerificationCode.findOne({ email });
    if(existingVerificationCode){
      await VerificationCode.deleteOne({ email });
    }

    const otp = generateOTP();
    const verificationCodeData = new VerificationCode({ email, otp });
    await verificationCodeData.save();

    // send email to seller
    const subject = " Your Login OTP for E-commerce project Platform";
    const body = `<p>Your OTP for logging into the E-commerce project platform is: <strong>${otp}</strong></p>`;

    await sendVerificationEmail(email, subject, body);
  }

  async createUser(req){
    const { fullname, email, otp } = req;
    let userData = await User.findOne({ email });
    if(userData){
      throw new Error('User already exists');
    }

    const verificationCodeData = await VerificationCode.findOne({ email });
    if(!verificationCodeData || verificationCodeData.otp !== req.otp){
      throw new Error('Invalid OTP');
    }

    const newUser  = new User({ fullname, email , password : await bcrypt.hash(2277767671, 10) });
    await newUser.save();

    const cart = new Cart({ user: newUser._id });
    await cart.save();

    return jwtProvider.createJwt({ email});
  }

  async signin(req){
    const { email, otp } = req;
    const userData = await User.findOne({ email });
    if(!userData){
      throw new Error('User not found');
    }

    const verificationCodeData = await VerificationCode.findOne({ email });
    if(!verificationCodeData || verificationCodeData.otp !== otp){
      throw new Error('Invalid OTP');
    }

    return {
      message: "Login successful",
      jwt : jwtProvider.createJwt({ email }),
      role: userData.role
    };
  }
}

export default new AuthService();
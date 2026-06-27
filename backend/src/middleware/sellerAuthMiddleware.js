import {User} from '../models/userModels.js';
import jwt from 'jsonwebtoken';


export const sellerMiddleware = async (req,res,next) => {
  try{
    const authHeader = req.headers.authorization;
    if(!(authHeader && authHeader.startsWith('Bearer'))){
      return res.status(400).json({
        success:false,
        message:"Authorization token is missing or invalid"
      })
    }

    const token = authHeader.split(' ')[1];
    if(!token){
      return res.status(400).json({
        success:false,
        message:"Access token is missing or invalid"
      })
    }

    let email = jwtProvder.getEmailFromjwt(token);

    const seller = sellerService.getSellerByEmail(email);
    req.seller = seller;  // Attach seller object to request for use in subsequent middleware or route handlers

    next();

  } catch(error){
    res.status(500).json({
      success:false,
      message:`Error in authenticating seller: ${error.message}`
    })
  }
}

import { User } from '../model/User.js';
import jwt from 'jsonwebtoken';
import jwtProvider from '../util/jwtProvider.js';
import userService from '../service/userService.js';

export const authMiddleware = async (req,res,next) => {
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

    let email = jwtProvider.getEmailFromJwt(token);

    const userData = await userService.findUserByEmail(email);
    req.user = userData;  // Attach user object to request for use in subsequent middleware or route handlers

    next();

  } catch(error){
    res.status(500).json({
      success:false,
      message:`Error in authenticating user: ${error.message}`
    })
  }
}

export default authMiddleware;

import User from '../model/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyEmail } from '../emailVerify/verifyEmail.js';
import Session from '../model/Session.js';
import 'dotenv/config';
import { sendOTPMail } from '../emailVerify/sendOTPMail.js';

export const register = async(req,res)=>{
  try{
    const{firstName,lastName,email,password} = req.body;
    if(!firstName || !lastName || !email || !password){
      return res.status(400).json({
        success:false,
        message:"All fields are required"
      })
    }

    const user = await User.findOne({email});
    if(user){
      return res.status(409).json({
        success:false,
        message:"User already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password : hashedPassword

    })

    const token = jwt.sign({id:newUser._id} , process.env.SECRET_KEY, {expiresIn:"10m"});

    await verifyEmail(token,email);  // send email here
    newUser.token = token;

    await newUser.save();

    res.status(201).json({
      success:true,
      message:"User registered successfully",
      user:newUser
    })
  } catch(error){
    res.status(500).json({
      success:false,
      message:`Error in registering user: ${error.message}`
    })
  }
}

export const verify = async (req, res) => {
  try{
    const authHeader = req.headers.authorization;
    if (!(authHeader && authHeader.startsWith('Bearer'))) {
      return res.status(400).json({
        success: false,
        message: 'Authorization token is missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Token has expired'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Token verification failed'
      });
    }

    const user = await User.findById(decoded.id);
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    user.token = null;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({
      success:true,
      message:"Email verified successfully"
    })

  } catch(error){
    res.status(500).json({
      success:false,
      message:`Error in verifying user: ${error.message}`
    })
  }
}

export const reverify = async(req,res)=>{
try{
  const {email} = req.body;
  const user = await User.findOne({email});
  if(!user){
    return res.status(400).json({
      success:false,
      message:"User not found"
    })
  }
  const token = jwt.sign({id:user._id} , process.env.SECRET_KEY, {expiresIn:"10m"});

  await verifyEmail(token,email);  // send email here
  user.token = token;

  await user.save();

  res.status(201).json({
    success:true,
    message:"verification email sent again successfully",
    token:user.token
  })
} catch(error){
    res.status(500).json({
      success:false,
      message:`Error in re-verifying user: ${error.message}`
    })
  }
}

export const login = async (req,res) => {
  try{
    const {email,password} = req.body;
    if(!(email && password)){
      return res.status(400).json({
        success:false,
        message:"Email and password are required"
      })
    }

    const existingUser = await User.findOne({email});
    if(!existingUser){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if(!isPasswordCorrect){
      return res.status(400).json({
        success:false,
        message:"Invalid credentials"
      })
    }

    if(existingUser.isVerified === false){
      return res.status(400).json({
        success:false,
        message:"verify your email before logging in"
      })
    }

    // generate token

    const accessToken = jwt.sign({id:existingUser._id} , process.env.SECRET_KEY, {expiresIn:"10d"});
    const refreshToken = jwt.sign({id:existingUser._id} , process.env.SECRET_KEY, {expiresIn:"30d"});

    existingUser.isLoggedIn = true;
    await existingUser.save();

    // check for existing session and delete it before creating a new one
    const existingSession = await Session.findOne({userId:existingUser._id});
    if(existingSession){
      await Session.findByIdAndDelete(existingSession._id);
    }

    // create a new Session
    await Session.create({userId:existingUser._id});

    return res.status(200).json({
      success:true,
      message:`Welcome back ${existingUser.firstName}`,
      user:existingUser,
      accessToken,
      refreshToken
    })

  } catch(error){
    res.status(500).json({
      success:false,
      message:`Error in logging in user: ${error.message}`
    })
  }
}

export const logout = async (req, res) => {
  try {
    const userId = req.userId;

    const sessionResult = await Session.deleteMany({ userId });

    const user = await User.findByIdAndUpdate(
      userId,
      { isLoggedIn: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (sessionResult.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No active session found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User logged out successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in logging out user: ${error.message}`
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // Set OTP expiry time to 10 minutes from now

    await user.save();

    await sendOTPMail(otp, email);


    return res.status(200).json({
      success: true,
      message: "otp sent to email successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in forgot password: ${error.message}`
    });
  }
};

export const verifyOTP = async (req,res) => {
    try {
    const { otp } = req.body;
    const email = req.params.email;

    if(!otp){
      return res.status(400).json({
        success:false,
        message:"OTP is required"
      })
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }
    if(!(user.otp && user.otpExpiry)){
      return res.status(400).json({
        success:false,
        message:"OTP is already used or not generated"
      })
    }

    if(user.otpExpiry < new Date()){
      return res.status(400).json({
        success:false,
        message:"OTP has expired please request a new one"
      })
    }

    if(user.otp !== otp){
      return res.status(400).json({
        success:false,
        message:"Invalid OTP"
      })
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success:true,
      message:"OTP verified successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in verifying OTP: ${error.message}`
    });
  } 
}

export const changePassword = async (req,res) => {
  try {
    const { newPassword , confirmPassword } = req.body;
    const email = req.params.email;
    
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    if(!newPassword || !confirmPassword){
      return res.status(400).json({
        success: false,
        message: "Both new password and confirm password are required"
      });
    }

    if(newPassword !== confirmPassword){
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  }catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in changing password: ${error.message}`
    });
  }
}

export const allUser = async (req,res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({
      success: true,
      users
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in fetching users: ${error.message}`
    });
  }
}

export const getUserById = async(req,res) => {
  try{
    const {userId} = req.params;
    const user = await User.findById(userId).select("-password -token -otp -otpExpiry");
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }
    return res.status(200).json({
      success:true,
      user
    })


  } catch(error){
    return res.status(500).json({
      success:false,
      message:`Error in fetching user: ${error.message}`
    })
  }
}



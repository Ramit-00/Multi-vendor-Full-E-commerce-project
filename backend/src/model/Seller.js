import mongoose from 'mongoose';
import userRoles from '../domain/userRole.js';
import accountStatus from '../domain/accountStatus.js';

const sellerSchema = new mongoose.Schema({
  sellerName:{type:String,required:true},
  phone:{type:Number,required:true,unique:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true,select:false},
  buisnessDetails:{
    buissnessName:{type:String,required:true},
    buissnessEmail:{type:String,required:true},
    buissnessMobile:{type:Number,required:true},
    buissnessAddress:{type:String,required:true},
  },
  bankDetails:{
    accountNumber:{type:Number},
    accountHolderName:{type:String},
    ifscCode:{type:String},
    bankName:{type:String},
  },
  pickupAddress:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Address"        // Name of the model for pickup address
  },
  GSTIN:{type:String,required:true},
  role:{
    type:String,
    enum:[userRoles.SELLER],
    default:userRoles.SELLER
  },
  accountStatus:{
    type:String,
    enum:[
      accountStatus.PENDING_VERIFICATION,
      accountStatus.ACTIVE,
      accountStatus.SUSPENDED,  
      accountStatus.DEACTIVATED,
      accountStatus.BANNED,
      accountStatus.CLOSED],

    default:accountStatus.PENDING_VERIFICATION
    
  }

},{timestamps:true})

const Seller = mongoose.model("Seller", sellerSchema);

export default Seller;
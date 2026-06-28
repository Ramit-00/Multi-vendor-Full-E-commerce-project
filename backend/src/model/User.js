import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName:{type:String , required:true},
  email:{type:String , required:true , unique:true},
  password:{type:String , required:true},
  mobile:{type:String , required:true , unique:true},

  addresses:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Address"

    }
  ],

  role:{
    type:String,
    enum:["ROLE_ADMIN","ROLE_CUSTOMER","ROLE_SELLER"],
    default:"ROLE_CUSTOMER"
  }

},{timestamps:true} )   // It will automatically create createdAt and updatedAt fields

export const User = mongoose.model("User", userSchema);  // Registers a model named "User" Internally creates a MongoDB collection:
// //  export 'user' is used to export it with 'user' name
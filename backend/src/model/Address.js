import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locality: { type: String, required: true },
  pincode: { type: Number, required: true },
  state: { type: String, required: true },
  address: { type: String, required: true },
  mobileNumber: { type: Number, required: true }
}, { timestamps: true });

export const Address = mongoose.model('Address', addressSchema);

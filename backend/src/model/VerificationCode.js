import mongoose from 'mongoose';

const VerificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // }
});

const VerificationCode = mongoose.model('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
const VerificationCode = require('../models/VerificationCode'); 

class VerificationService {
    async createVerificationCode(otp, email) {
        const existingCode = await VerificationCode.findOne({ email });

        if (existingCode) {
            await VerificationCode.deleteOne({ _id: existingCode._id });
        }

        const verificationCode = new VerificationCode({
            otp,
            email,
        });

        // Save the new verification code to the database
        return await verificationCode.save();
    }
}

module.exports = new VerificationService();

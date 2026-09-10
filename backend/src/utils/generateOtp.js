const crypto = require('crypto');

// Cryptographically secure 6-digit OTP generation
function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

module.exports = generateOTP;
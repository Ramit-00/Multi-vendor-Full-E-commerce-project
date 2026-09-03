// utils/JwtProvider.js
const jwt = require('jsonwebtoken');
const SECERET_KEY=process.env.SECERET_KEY
if (!SECERET_KEY) {
    console.error('WARNING: JWT secret (SECERET_KEY) is not set in environment. JWT operations will fail.');
}
class JwtProvider {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    // Method to create JWT
    createJwt(payload) {
        return jwt.sign(payload, this.secretKey, { expiresIn: '24h' }); 
    }

    getEmailFromJwt(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded.email; 
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    getPayloadFromJwt(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Method to verify JWT
    verifyJwt(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new JwtProvider(SECERET_KEY); 

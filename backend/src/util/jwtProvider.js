import jwt from 'jsonwebtoken';

class JwtProvider {
  constructor() {
    this.secretKey = process.env.SECRET_KEY;
  }

  createJwt(payload) {    // email as payload
    return jwt.sign(payload, this.secretKey, { expiresIn: "10m" });
  }

  getEmailFromJwt(token) {
    try {
      const decodedToken = jwt.verify(token, this.secretKey);
      return decodedToken.email;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  verifyJwt(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new JwtProvider(process.env.SECRET_KEY);
import authService from '../service/authService.js';
import userRoles from '../domain/userRole.js';

class AuthController {

  async sendLoginOtp(req, res) {  
      try {
        const { email } = req.body;
        await authService.sendLoginOtp(email);
        res.status(200).json({ message: 'OTP sent successfully' });
      } catch (error) {
        res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
      }
    }

    async createUser(req, res) {
      try {
        const jwt = await authService.createUser(req.body);

        const authResponse = {
          jwt,
          message:"User created successfully",
          role: userRoles.CUSTOMER
        }

        res.status(200).json(authResponse);
      } catch (error) {
      res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
      }
    }

    async signin(req,res){
      try{
        const authResponse = await authService.signin(req.body);
        res.status(200).json(authResponse );

      } catch (error){
        res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
      }
    }
}

export default new AuthController();
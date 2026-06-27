class AuthController {

  async sendLoginOtp(req, res) {  
      try {
        const { email } = req.body;
        await AuthService.sendLoginOtp(email);
        res.status(200).json({ message: 'OTP sent successfully' });
      } catch (error) {
        res.status(error instanceof Error ? 404 : 500).json({ error: error.message });
      }
    }
}

module.exports = new AuthController();
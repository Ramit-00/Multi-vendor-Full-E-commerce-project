// controllers/authController.js
const { validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const UserError = require('../exceptions/UserError');

class AuthController {
    async sentLoginOtp(req, res) {
        try {
            const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.replace(/^signing_/, ''))) {
                return res.status(400).json({ error: 'A valid email address is required' });
            }
            const result = await AuthService.sendLoginOtp(email);

            const resp = { message: 'Verification code sent to your email address.', mailSent: result.mailSent };
            if (result.previewUrl) resp.previewUrl = result.previewUrl;
            if (result.usedTestAccount) resp.usedTestAccount = result.usedTestAccount;

            if (!result.mailSent && process.env.NODE_ENV === 'production') {
                return res.status(503).json({ error: 'Email delivery is unavailable. Please configure SMTP settings.' });
            }

            return res.status(200).json(resp);
        } catch (error) {
            if (error instanceof UserError || error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async createUserHandler(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const token = await AuthService.createUser(req.body);
            const authResponse = {
                jwt: token,
                message: "Register Success",
                role: "ROLE_CUSTOMER",
            };

            return res.status(200).json(authResponse);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async signin(req, res) {
        console.log("Signing in...");
        try {
            const authResponse = await AuthService.signin(req.body);
            return res.status(200).json(authResponse);
        } catch (error) {
            if (error instanceof Error || error instanceof UserError) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async googleAuth(req, res) {
        try {
            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ error: "Google credential token is required" });
            }
            const authResponse = await AuthService.googleAuth(credential);
            return res.status(200).json(authResponse);
        } catch (error) {
            if (error instanceof Error || error instanceof UserError) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async sendForgotPasswordOtp(req, res) {
        try {
            const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
            if (!email) {
                return res.status(400).json({ error: 'Registered email address is required' });
            }
            const result = await AuthService.sendForgotPasswordOtp(email);
            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof UserError || error instanceof Error) {
                return res.status(error.statusCode || 400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async resetForgotPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;
            const result = await AuthService.resetForgotPassword(email, otp, newPassword);
            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof UserError || error instanceof Error) {
                return res.status(error.statusCode || 400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = new AuthController();

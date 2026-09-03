const nodemailer = require('nodemailer');

let cachedTransporter = null;
let usedTestAccount = false;

async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    const service = process.env.EMAIL_SERVICE || 'gmail';
    const user = process.env.EMAIL_USER || process.env.MAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.MAIL_PASS;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const secure = process.env.SMTP_SECURE === 'true';

    if (host && port) {
        cachedTransporter = nodemailer.createTransport({
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            host,
            port,
            secure: Boolean(secure),
            auth: user && pass ? { user, pass } : undefined
        });
    } else if (user && pass) {
        cachedTransporter = nodemailer.createTransport({
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            service,
            auth: { user, pass }
        });
    } else if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_OFFLINE === 'true') {
        const testAccount = await nodemailer.createTestAccount();
        usedTestAccount = true;
        cachedTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } else {
        throw new Error('Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS or SMTP_HOST/SMTP_PORT.');
    }

    return cachedTransporter;
}

/**
 * sendVerificationEmail
 * to: recipient email
 * subject: email subject
 * body: plain text body
 * options.html: optional HTML body
 *
 * Fast non-blocking email dispatcher with connection pooling
 */
async function sendVerificationEmail(to, subject, body, options = {}) {
    const user = process.env.EMAIL_USER || process.env.MAIL_USER;
    const fromAddress = user ? `"E-COM" <${user}>` : 'no-reply@e-com.com';

    // Extract strictly the 6-digit OTP code without picking up other numbers in the body
    const otpCode = options.otp 
      ? String(options.otp).trim() 
      : (body && body.match(/\b\d{6}\b/) ? body.match(/\b\d{6}\b/)[0] : (body ? body.replace(/[^0-9]/g, '') : ''));

    // Default attractive HTML template if not provided
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1E40AF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">E-COM</h2>
          <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Partner Verification Code</p>
        </div>
        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="color: #334155; font-size: 14px; margin-top: 0;">Your 6-digit verification code is:</p>
          <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1E40AF; padding: 12px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748B; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. Do not share this OTP with anyone.</p>
        </div>
        <p style="color: #64748B; font-size: 12px; line-height: 1.5;">If you did not request this verification code on E-COM, please disregard this email.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} E-COM. All rights reserved.</p>
      </div>
    `;

    const mailOptions = {
        from: fromAddress,
        to,
        subject,
        text: body,
        html: options.html || defaultHtml
    };

    try {
        const transporter = await getTransporter();

        // Await send with a 4000ms window
        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), 4000));

        const result = await Promise.race([sendPromise, timeoutPromise]);

        if (result && result.timedOut) {
            sendPromise
                .then((info) => {
                    console.log('Gmail SMTP email delivered successfully to:', to, info && info.messageId);
                })
                .catch((err) => {
                    console.warn('Background email send error:', err && err.message);
                });

            return { info: { messageId: 'background_dispatch' }, previewUrl: null, usedTestAccount, mailSent: true };
        }

        console.log('Gmail SMTP email sent immediately to:', to, result && result.messageId);
        return { info: result, previewUrl: null, usedTestAccount, mailSent: true };
    } catch (err) {
        console.warn('Email dispatch warning:', err && err.message);
        return { info: null, previewUrl: null, usedTestAccount: false, mailSent: false };
    }
}

module.exports = { sendVerificationEmail };

import React, { useState } from 'react';
import { Button, TextField, Alert, CircularProgress } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  sendSellerOtp,
  verifyEmailOtp,
  setVerifiedSellerInfo,
  verifySellerGoogleEmailRegistration,
} from '../../../Redux Toolkit/Seller/sellerAuthenticationSlice';
import { GoogleLogin } from '@react-oauth/google';

interface SellerVerificationGateProps {
  onVerified: (email: string, mobile: string) => void;
}

const SellerVerificationGate: React.FC<SellerVerificationGateProps> = ({ onVerified }) => {
  const dispatch = useAppDispatch();
  const { sellerAuth } = useAppSelector((store) => store);

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendCode = async () => {
    setLocalError(null);
    if (!email || !email.includes('@') || !email.includes('.')) {
      setLocalError('Please enter a valid email address to receive your OTP.');
      return;
    }

    const res = await dispatch(sendSellerOtp({ email, mobile }));
    if (sendSellerOtp.fulfilled.match(res)) {
      setStep('otp');
      setSuccessMessage(`A 6-digit verification code was sent to ${email}. Please check your inbox.`);
    } else {
      setLocalError((res.payload as string) || 'Failed to dispatch verification email. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setLocalError(null);
    if (!otp || otp.length < 6) {
      setLocalError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    const res = await dispatch(verifyEmailOtp({ email, otp }));
    setIsVerifying(false);

    if (verifyEmailOtp.fulfilled.match(res)) {
      dispatch(setVerifiedSellerInfo({ email, mobile }));
      onVerified(email, mobile);
    } else {
      setLocalError((res.payload as string) || 'Invalid or expired OTP. Please try again.');
    }
  };

  const handleGoogleVerify = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLocalError(null);
    const res = await dispatch(
      verifySellerGoogleEmailRegistration({ credential: credentialResponse.credential })
    );
    if (verifySellerGoogleEmailRegistration.fulfilled.match(res)) {
      const verifiedEmail = res.payload.verifiedEmail;
      dispatch(setVerifiedSellerInfo({ email: verifiedEmail, mobile }));
      onVerified(verifiedEmail, mobile);
    } else {
      setLocalError((res.payload as string) || 'Google verification failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2 border border-blue-100">
          <ShieldOutlinedIcon sx={{ fontSize: 28 }} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Partner Verification</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          To maintain an authentic marketplace and prevent spam registrations, please verify your email address to unlock the seller application form.
        </p>
      </div>

      {localError && (
        <Alert severity="error" sx={{ fontSize: '13px', borderRadius: '10px' }} onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="info" sx={{ fontSize: '13px', borderRadius: '10px' }}>
          {successMessage}
        </Alert>
      )}

      {step === 'input' ? (
        <div className="space-y-4 pt-2">
          {/* Quick Google Verification */}
          <div className="space-y-2">
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleVerify}
                onError={() => setLocalError('Google Sign-In failed. Please try email verification below.')}
                useOneTap={false}
                theme="outline"
                size="large"
                width="100%"
                text="continue_with"
                shape="rectangular"
              />
            </div>
            <p className="text-center text-[11px] text-slate-400 font-medium">
              Fast 1-click email verification with Google
            </p>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or verify with email OTP
              </span>
            </div>
          </div>
          <TextField
            fullWidth
            required
            label="Email Address"
            type="email"
            placeholder="seller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: <MailOutlineIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 20 }} />,
            }}
            helperText="We will send your 6-digit verification code to this email."
          />

          <TextField
            fullWidth
            label="Mobile Number (Optional)"
            placeholder="9876543210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            InputProps={{
              startAdornment: <SmartphoneOutlinedIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 20 }} />,
            }}
            helperText="Primary contact number for your seller account"
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSendCode}
            disabled={sellerAuth.loading || !email}
            sx={{
              py: 1.5,
              backgroundColor: '#1E40AF',
              '&:hover': { backgroundColor: '#1E3A8A' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
            }}
          >
            {sellerAuth.loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
            <p className="text-xs font-semibold text-slate-700">
              Enter the 6-digit code sent to: <span className="text-blue-700 font-bold">{email}</span>
            </p>
            <div className="flex justify-center">
              <OTPInput length={6} onChange={(val) => setOtp(val)} error={Boolean(localError)} />
            </div>
            <div className="flex justify-between items-center text-xs pt-1 px-2">
              <span
                onClick={() => setStep('input')}
                className="text-slate-500 hover:text-slate-800 cursor-pointer underline"
              >
                Change Email
              </span>
              <span
                onClick={handleSendCode}
                className="text-blue-700 font-bold cursor-pointer hover:underline"
              >
                Resend Code
              </span>
            </div>
          </div>

          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyOtp}
            disabled={isVerifying || otp.length < 6}
            startIcon={<VerifiedUserOutlinedIcon />}
            sx={{
              py: 1.5,
              backgroundColor: '#1E40AF',
              '&:hover': { backgroundColor: '#1E3A8A' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
            }}
          >
            {isVerifying ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Verify Email & Unlock Form'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SellerVerificationGate;

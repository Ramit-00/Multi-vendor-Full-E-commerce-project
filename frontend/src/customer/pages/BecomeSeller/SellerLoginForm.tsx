import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  verifySellerGoogleAuth,
  sellerPasswordLogin,
  sendForgotPasswordOtp,
  resetForgotPassword,
  resetSellerAuthState,
  clearGoogleVerifiedSeller,
} from '../../../Redux Toolkit/Seller/sellerAuthenticationSlice';
import { fetchSellerProfile } from '../../../Redux Toolkit/Seller/sellerSlice';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SellerLoginFormProps {
  onSwitchToRegister?: () => void;
}

const SellerLoginForm: React.FC<SellerLoginFormProps> = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sellerAuth } = useAppSelector((store) => store);

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showDirectLogin, setShowDirectLogin] = useState(false);

  // Forgot Password state
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotTimer, setForgotTimer] = useState<number>(30);
  const [isForgotTimerActive, setIsForgotTimerActive] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [forgotLocalError, setForgotLocalError] = useState<string | null>(null);

  // Google verified seller email & name from Redux
  const verifiedSeller = sellerAuth.googleVerifiedSeller;

  // Password for Google-verified seller
  const [verifiedPassword, setVerifiedPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Direct email + password formik
  const directFormik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .required('Registered seller email is required')
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          'Please enter a valid email address'
        ),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
    }),
    onSubmit: async (values) => {
      const res = await dispatch(
        sellerPasswordLogin({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          navigate,
        })
      );
      if (sellerPasswordLogin.fulfilled.match(res)) {
        if (res.payload?.jwt) {
          dispatch(fetchSellerProfile(res.payload.jwt));
        }
      }
    },
  });

  // Handle Google Auth Verification
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setResetSuccessMessage(null);
    setPasswordError(null);
    await dispatch(verifySellerGoogleAuth({ credential: credentialResponse.credential }));
  };

  // Handle Submit Password for Google-verified seller
  const handleVerifiedPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!verifiedPassword || verifiedPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (!verifiedSeller?.email) return;

    const res = await dispatch(
      sellerPasswordLogin({
        email: verifiedSeller.email,
        password: verifiedPassword,
        navigate,
      })
    );

    if (sellerPasswordLogin.fulfilled.match(res)) {
      if (res.payload?.jwt) {
        dispatch(fetchSellerProfile(res.payload.jwt));
      }
    }
  };

  // Switch to different account / clear Google verification
  const handleClearGoogleVerify = () => {
    dispatch(clearGoogleVerifiedSeller());
    setVerifiedPassword('');
    setPasswordError(null);
  };

  // Timer for Forgot Password OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isForgotTimerActive) {
      interval = setInterval(() => {
        setForgotTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsForgotTimerActive(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isForgotTimerActive]);

  // Forgot Password: Send OTP
  const handleSendForgotOtp = async () => {
    setForgotLocalError(null);
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotLocalError('Please enter a valid registered seller email address.');
      return;
    }
    const res = await dispatch(sendForgotPasswordOtp(forgotEmail.trim().toLowerCase()));
    if (sendForgotPasswordOtp.fulfilled.match(res)) {
      setForgotTimer(30);
      setIsForgotTimerActive(true);
    }
  };

  // Forgot Password: Reset Submit
  const handleResetPasswordSubmit = async () => {
    setForgotLocalError(null);
    if (!forgotOtp || forgotOtp.length < 6) {
      setForgotLocalError('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotLocalError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotLocalError('New passwords do not match. Please re-enter.');
      return;
    }

    const res = await dispatch(
      resetForgotPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword,
      })
    );

    if (resetForgotPassword.fulfilled.match(res)) {
      setResetSuccessMessage(
        'Password updated successfully! First verify your identity with Google, then enter your new store password.'
      );
      setMode('login');
      dispatch(resetSellerAuthState());
      setVerifiedPassword('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleSwitchToForgot = (prefillEmail?: string) => {
    dispatch(resetSellerAuthState());
    setResetSuccessMessage(null);
    setForgotEmail(prefillEmail || verifiedSeller?.email || directFormik.values.email || '');
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotLocalError(null);
    setMode('forgot');
  };

  const handleSwitchToLogin = () => {
    dispatch(resetSellerAuthState());
    setResetSuccessMessage(null);
    setForgotLocalError(null);
    setMode('login');
  };

  return (
    <div className="space-y-5">
      {/* View 1: Forgot Password View */}
      {mode === 'forgot' ? (
        <div className="space-y-5">
          <div className="text-center space-y-1 pb-1">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
              <KeyIcon sx={{ fontSize: 26 }} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Reset Seller Password</h2>
            <p className="text-xs text-slate-500">
              Enter your registered seller email to receive a password reset verification code
            </p>
          </div>

          {(sellerAuth.error || forgotLocalError) && (
            <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              {sellerAuth.error || forgotLocalError}
            </Alert>
          )}

          {sellerAuth.forgotPasswordOtpSent && (
            <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              Verification code sent to <strong>{forgotEmail}</strong>. Please check your email inbox!
            </Alert>
          )}

          <div className="space-y-4">
            <TextField
              fullWidth
              label="Registered Seller Email"
              placeholder="seller@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              disabled={sellerAuth.forgotPasswordOtpSent}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: sellerAuth.forgotPasswordOtpSent ? '#F1F5F9' : 'white',
                },
              }}
            />

            {sellerAuth.forgotPasswordOtpSent ? (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <p className="font-medium text-xs text-slate-600 text-center">
                    Enter the 6-digit verification code sent to your email:
                  </p>
                  <div className="flex justify-center py-1">
                    <OTPInput length={6} onChange={(val) => setForgotOtp(val)} error={false} />
                  </div>
                  <div className="text-xs text-center text-slate-500">
                    {isForgotTimerActive ? (
                      <span>Resend code in {forgotTimer}s</span>
                    ) : (
                      <span>
                        Didn’t receive code?{' '}
                        <span
                          onClick={handleSendForgotOtp}
                          className="text-blue-700 cursor-pointer hover:underline font-semibold"
                        >
                          Resend Code
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <TextField
                  fullWidth
                  required
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <TextField
                  fullWidth
                  required
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <Button
                  disabled={sellerAuth.loading || !forgotOtp || forgotOtp.length < 6 || !newPassword}
                  onClick={handleResetPasswordSubmit}
                  fullWidth
                  variant="contained"
                  sx={{
                    py: '11px',
                    backgroundColor: '#0F172A',
                    '&:hover': { backgroundColor: '#1E293B' },
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '10px',
                  }}
                >
                  {sellerAuth.loading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
                </Button>
              </div>
            ) : (
              <Button
                disabled={sellerAuth.loading || !forgotEmail}
                onClick={handleSendForgotOtp}
                fullWidth
                variant="contained"
                sx={{
                  py: '11px',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '10px',
                }}
              >
                {sellerAuth.loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Code'}
              </Button>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold hover:underline cursor-pointer"
              >
                <ArrowBackIcon sx={{ fontSize: 14 }} />
                <span>Back to Seller Portal Login</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Seller Login View */
        <div className="space-y-5">
          <div className="text-center space-y-1 pb-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-2 border border-blue-100">
              <StorefrontIcon sx={{ fontSize: 26 }} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Seller Portal Login</h2>
            <p className="text-xs text-slate-500">
              {verifiedSeller
                ? 'Enter your store password to complete login'
                : 'Verify your identity with Google, then enter your store password'}
            </p>
          </div>

          {resetSuccessMessage && (
            <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              {resetSuccessMessage}
            </Alert>
          )}

          {/* Not Registered Seller Warning Banner */}
          {sellerAuth.notRegisteredError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-amber-600 font-bold text-base mt-0.5">⚠</span>
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Store Account Not Found</p>
                  <p className="mt-0.5 text-amber-800">
                    {sellerAuth.error || 'No registered seller account was found with this Google email. You must register your store first before logging in.'}
                  </p>
                </div>
              </div>
              {onSwitchToRegister && (
                <Button
                  onClick={onSwitchToRegister}
                  fullWidth
                  variant="contained"
                  size="small"
                  sx={{
                    py: '8px',
                    backgroundColor: '#D97706',
                    '&:hover': { backgroundColor: '#B45309' },
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  Register New Seller Account
                </Button>
              )}
            </div>
          )}

          {/* Other Errors */}
          {sellerAuth.error && !sellerAuth.notRegisteredError && (
            <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              {sellerAuth.error}
            </Alert>
          )}

          {/* STEP 2: Google Identity Verified -> Enter Store Password */}
          {verifiedSeller ? (
            <form onSubmit={handleVerifiedPasswordSubmit} className="space-y-4 pt-1">
              {/* Verified Identity Badge */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon sx={{ color: '#059669', fontSize: 24 }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {verifiedSeller.sellerName || 'Verified Merchant'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Google Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">{verifiedSeller.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearGoogleVerify}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Switch
                </button>
              </div>

              {passwordError && (
                <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '12px' }}>
                  {passwordError}
                </Alert>
              )}

              <div className="space-y-1">
                <TextField
                  fullWidth
                  autoFocus
                  required
                  type={showPassword ? 'text' : 'password'}
                  label="Store Password"
                  placeholder="Enter your store password"
                  value={verifiedPassword}
                  onChange={(e) => setVerifiedPassword(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchToForgot(verifiedSeller.email)}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <Button
                disabled={sellerAuth.loading || !verifiedPassword}
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  py: '11px',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '10px',
                }}
              >
                {sellerAuth.loading ? <CircularProgress size={22} color="inherit" /> : 'Login to Seller Dashboard'}
              </Button>
            </form>
          ) : (
            /* STEP 1: Primary Google Auth Flow */
            <div className="space-y-5 pt-1">
              <div className="space-y-2">
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.error('Seller Google Sign-In Failed')}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-400 font-medium">
                  Step 1: Sign in with your registered Google account
                </p>
              </div>

              {/* Collapsible / Optional Direct Email + Password Form */}
              <div className="pt-2">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                      Or Direct Merchant Login
                    </span>
                  </div>
                </div>

                {!showDirectLogin ? (
                  <div className="text-center">
                    <Button
                      size="small"
                      onClick={() => setShowDirectLogin(true)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#1E40AF',
                      }}
                    >
                      Sign in directly with Email & Password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={directFormik.handleSubmit} className="space-y-4 pt-2">
                    <TextField
                      fullWidth
                      name="email"
                      label="Registered Seller Email"
                      placeholder="seller@example.com"
                      value={directFormik.values.email}
                      onChange={directFormik.handleChange}
                      onBlur={directFormik.handleBlur}
                      error={Boolean(directFormik.touched.email && directFormik.errors.email)}
                      helperText={
                        directFormik.touched.email && directFormik.errors.email
                          ? String(directFormik.errors.email)
                          : undefined
                      }
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MailOutlineIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />

                    <div className="space-y-1">
                      <TextField
                        fullWidth
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Account Password"
                        placeholder="Enter your store password"
                        value={directFormik.values.password}
                        onChange={directFormik.handleChange}
                        onBlur={directFormik.handleBlur}
                        error={Boolean(directFormik.touched.password && directFormik.errors.password)}
                        helperText={
                          directFormik.touched.password && directFormik.errors.password
                            ? String(directFormik.errors.password)
                            : undefined
                        }
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleSwitchToForgot(directFormik.values.email)}
                          className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <Button
                      disabled={sellerAuth.loading || !directFormik.values.email || !directFormik.values.password}
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        py: '11px',
                        backgroundColor: '#0F172A',
                        '&:hover': { backgroundColor: '#1E293B' },
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '10px',
                      }}
                    >
                      {sellerAuth.loading ? <CircularProgress size={22} color="inherit" /> : 'Login to Seller Portal'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerLoginForm;

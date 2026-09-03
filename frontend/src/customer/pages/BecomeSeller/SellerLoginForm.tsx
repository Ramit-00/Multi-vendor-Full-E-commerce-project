import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  sendLoginOtp,
  verifyLoginOtp,
  sendForgotPasswordOtp,
  resetForgotPassword,
  resetSellerAuthState,
} from '../../../Redux Toolkit/Seller/sellerAuthenticationSlice';
import { fetchSellerProfile } from '../../../Redux Toolkit/Seller/sellerSlice';
import { useNavigate } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const loginValidationSchema = Yup.object({
  email: Yup.string()
    .required('Registered seller email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address (e.g., seller@example.com)'
    ),
  password: Yup.string()
    .required('Account password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const SellerLoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sellerAuth } = useAppSelector((store) => store);

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Login OTP state
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotTimer, setForgotTimer] = useState<number>(30);
  const [isForgotTimerActive, setIsForgotTimerActive] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [forgotLocalError, setForgotLocalError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values: any) => {
      const resultAction = await dispatch(
        verifyLoginOtp({
          email: values.email.trim().toLowerCase(),
          otp: otp.trim(),
          navigate,
        })
      );
      if (verifyLoginOtp.fulfilled.match(resultAction)) {
        if (resultAction.payload?.jwt) {
          dispatch(fetchSellerProfile(resultAction.payload.jwt));
        }
      }
    },
  });

  const handleSendLoginOtp = async () => {
    const errors = await formik.validateForm();
    if (errors.email || errors.password) {
      formik.setFieldTouched('email', true);
      formik.setFieldTouched('password', true);
      return;
    }
    const cleanEmail = formik.values.email.trim().toLowerCase();
    dispatch(sendLoginOtp({ email: cleanEmail, password: formik.values.password }));
    setTimer(30);
    setIsTimerActive(true);
  };

  // Timer for Login OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerActive(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

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
      // Clear forgot password state and return to login mode
      setResetSuccessMessage('Password reset successfully! Please log in with your new password.');
      setMode('login');
      dispatch(resetSellerAuthState());
      formik.setFieldValue('email', forgotEmail);
      formik.setFieldValue('password', '');
      setOtp('');
    }
  };

  const handleSwitchToForgot = () => {
    dispatch(resetSellerAuthState());
    setResetSuccessMessage(null);
    setForgotEmail(formik.values.email || '');
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
              Enter your registered email to receive a password reset code
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
                    Enter the 6-digit verification code received in your email:
                  </p>
                  <div className="flex justify-center py-1">
                    <OTPInput length={6} onChange={(val) => setForgotOtp(val)} error={false} />
                  </div>
                  <div className="text-xs text-center text-slate-500">
                    {isForgotTimerActive ? (
                      <span>Resend code in {forgotTimer}s</span>
                    ) : (
                      <span>
                        Didn’t receive the code?{' '}
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
                  placeholder="Re-type new password"
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
        /* View 2: Standard Seller Login View */
        <div className="space-y-5">
          <div className="text-center space-y-1 pb-1">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mb-2">
              <StorefrontIcon sx={{ fontSize: 26 }} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Seller Portal Login</h2>
            <p className="text-xs text-slate-500">
              Sign in with your email and password to access your dashboard
            </p>
          </div>

          {resetSuccessMessage && (
            <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              {resetSuccessMessage}
            </Alert>
          )}

          {sellerAuth.error && (
            <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              {sellerAuth.error}
            </Alert>
          )}

          {sellerAuth.otpSent && (
            <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '12px' }}>
              Verification code sent to <strong>{formik.values.email}</strong>. Please check your email inbox!
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <TextField
              fullWidth
              name="email"
              label="Registered Seller Email"
              placeholder="seller@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.email && formik.errors.email)}
              helperText={
                formik.touched.email && formik.errors.email
                  ? String(formik.errors.email)
                  : undefined
              }
              disabled={sellerAuth.otpSent}
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
                  backgroundColor: sellerAuth.otpSent ? '#F1F5F9' : 'white',
                },
              }}
            />

            <div className="space-y-1">
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Account Password"
                placeholder="Enter your password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.password && formik.errors.password)}
                helperText={
                  formik.touched.password && formik.errors.password
                    ? String(formik.errors.password)
                    : undefined
                }
                disabled={sellerAuth.otpSent}
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
                        disabled={sellerAuth.otpSent}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: sellerAuth.otpSent ? '#F1F5F9' : 'white',
                  },
                }}
              />

              {!sellerAuth.otpSent && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSwitchToForgot}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {sellerAuth.otpSent && (
              <div className="space-y-3 pt-2">
                <p className="font-medium text-xs text-slate-600 text-center">
                  Enter the 6-digit verification code sent to your email inbox:
                </p>

                <div className="flex justify-center py-2">
                  <OTPInput length={6} onChange={(newOtp) => setOtp(newOtp)} error={false} />
                </div>

                <div className="text-xs text-center text-slate-500">
                  {isTimerActive ? (
                    <span>Resend verification code in {timer}s</span>
                  ) : (
                    <span>
                      Didn’t receive the code?{' '}
                      <span
                        onClick={handleSendLoginOtp}
                        className="text-blue-700 cursor-pointer hover:underline font-semibold"
                      >
                        Resend Code
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {sellerAuth.otpSent ? (
              <Button
                disabled={sellerAuth.loading || !otp || otp.length < 6}
                onClick={() => formik.handleSubmit()}
                fullWidth
                variant="contained"
                sx={{
                  py: '11px',
                  mt: 2,
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '10px',
                }}
              >
                {sellerAuth.loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Login to Seller Portal'
                )}
              </Button>
            ) : (
              <Button
                disabled={sellerAuth.loading || !formik.values.email || !formik.values.password}
                fullWidth
                variant="contained"
                onClick={handleSendLoginOtp}
                sx={{
                  py: '11px',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '10px',
                }}
              >
                {sellerAuth.loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default SellerLoginForm;
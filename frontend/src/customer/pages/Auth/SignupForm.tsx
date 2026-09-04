import { Button, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import OTPInput from '../../components/OtpFild/OTPInput';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { useNavigate } from 'react-router-dom';
import { sendLoginSignupOtp, signup, googleAuthLogin } from '../../../Redux Toolkit/Customer/AuthSlice';
import { GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Full name is required')
        .min(2, 'Name must be at least 2 characters'),
    email: Yup.string()
        .required('Email address is required')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email address (e.g., user@example.com)'
        )
});

const SignupForm = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState<number>(30);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const { auth } = useAppSelector(store => store);

    const formik = useFormik({
        initialValues: {
            email: '',
            otp: '',
            name: ''
        },
        validationSchema,
        onSubmit: (values: any) => {
            dispatch(signup({
                fullName: values.name.trim(),
                email: values.email.trim().toLowerCase(),
                otp: otp || values.otp,
                navigate
            }));
        }
    });

    const handleOtpChange = (newOtp: any) => {
        setOtp(newOtp);
    };

    const handleResendOTP = async () => {
        const errors = await formik.validateForm();
        if (errors.email || errors.name) {
            formik.setFieldTouched('name', true);
            formik.setFieldTouched('email', true);
            return;
        }
        dispatch(sendLoginSignupOtp({ email: formik.values.email.trim().toLowerCase() }));
        setTimer(30);
        setIsTimerActive(true);
    };

    const handleSentOtp = () => {
        handleResendOTP();
    };

    const handleSignup = () => {
        formik.handleSubmit();
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isTimerActive) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev === 1) {
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

    return (
        <div className="space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Create Your Account</h2>
                <p className="text-xs text-slate-500">
                    Join E-COM to enjoy exclusive offers and seamless shopping
                </p>
            </div>

            {/* Error Notification Banner */}
            {auth.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                    <span className="text-red-500 font-bold">⚠</span>
                    <span>{auth.error.includes("user not founed") ? "Incorrect credentials" : auth.error}</span>
                </div>
            )}

            {/* Google One-Click Sign Up / Sign In */}
            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                            dispatch(googleAuthLogin({ credential: credentialResponse.credential, navigate }));
                        }
                    }}
                    onError={() => {
                        console.error("Google Sign-In Failed");
                    }}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="signup_with"
                    shape="rectangular"
                />
            </div>

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">Or continue with email</span>
                </div>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
                <TextField
                    fullWidth
                    name="name"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.touched.name && formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name ? String(formik.errors.name) : undefined}
                    disabled={auth.otpSent}
                    size="small"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            backgroundColor: auth.otpSent ? "#F1F5F9" : "white",
                        }
                    }}
                />

                <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.touched.email && formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email ? String(formik.errors.email) : undefined}
                    disabled={auth.otpSent}
                    size="small"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            backgroundColor: auth.otpSent ? "#F1F5F9" : "white",
                        }
                    }}
                />

                {auth.otpSent && (
                    <div className="space-y-3 pt-2">
                        <p className="font-medium text-xs text-slate-600 text-center">
                            Enter the 6-digit verification code sent to your email:
                        </p>


                        <div className="flex justify-center py-2">
                            <OTPInput
                                length={6}
                                onChange={handleOtpChange}
                                error={false}
                            />
                        </div>

                        <div className="text-xs text-center text-slate-500">
                            {isTimerActive ? (
                                <span>Resend code in {timer}s</span>
                            ) : (
                                <span>
                                    Didn’t receive code?{" "}
                                    <span
                                        onClick={handleResendOTP}
                                        className="text-blue-700 cursor-pointer hover:underline font-semibold"
                                    >
                                        Resend Code
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {auth.otpSent ? (
                    <Button
                        disabled={auth.loading || !otp || otp.length < 6}
                        onClick={handleSignup}
                        fullWidth
                        variant='contained'
                        sx={{
                            py: "11px",
                            mt: 2,
                            backgroundColor: "#0F172A",
                            "&:hover": { backgroundColor: "#1E293B" },
                            fontWeight: 700,
                            borderRadius: "10px",
                            textTransform: "none",
                        }}
                    >
                        {auth.loading ? <CircularProgress size={22} color="inherit" /> : "Create Account"}
                    </Button>
                ) : (
                    <Button
                        disabled={auth.loading || !formik.values.email || !formik.values.name}
                        fullWidth
                        variant='contained'
                        onClick={handleSentOtp}
                        sx={{
                            py: "11px",
                            backgroundColor: "#0F172A",
                            "&:hover": { backgroundColor: "#1E293B" },
                            fontWeight: 700,
                            borderRadius: "10px",
                            textTransform: "none",
                        }}
                    >
                        {auth.loading ? <CircularProgress size={22} color="inherit" /> : "Send Verification Code"}
                    </Button>
                )}
            </form>
        </div>
    );
};

export default SignupForm;
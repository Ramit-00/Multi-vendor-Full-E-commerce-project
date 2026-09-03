import { useEffect, useState } from 'react';
import LoginForm from './LoginForm';
import { Alert, Button, Snackbar } from '@mui/material';
import SignupForm from './SignupForm';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { resetAuthState } from '../../../Redux Toolkit/Customer/AuthSlice';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Auth = () => {
    const dispatch = useAppDispatch();
    const [isLoginPage, setIsLoginPage] = useState(true);
    const handleCloseSnackbar = () => setSnackbarOpen(false);
    const { auth } = useAppSelector(store => store);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    useEffect(() => {
        if (auth.otpSent || auth.error) {
            setSnackbarOpen(true);
        }
    }, [auth.otpSent, auth.error]);

    return (
        <div className="min-h-[85vh] flex justify-center items-center px-4 py-12 bg-[#FAFAFA]">
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.06)] overflow-hidden">
                {/* Header Banner - Sophisticated Minimalist */}
                <div className="pt-9 pb-6 px-8 text-center border-b border-slate-100">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3">
                        <LockOutlinedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">E-COM</h2>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                        {isLoginPage
                            ? "Sign in to access your orders, wishlist, and recommendations"
                            : "Create your verified customer account for seamless ordering"}
                    </p>
                </div>

                {/* Form Body */}
                <div className="p-8">
                    {isLoginPage ? <LoginForm /> : <SignupForm />}

                    <div className="flex items-center gap-1.5 justify-center mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
                        <p>{isLoginPage ? "New to E-COM Marketplace?" : "Already have an account?"}</p>
                        <Button
                            onClick={() => {
                                dispatch(resetAuthState());
                                setIsLoginPage(!isLoginPage);
                            }}
                            size="small"
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "12px",
                                color: "#0F172A",
                                "&:hover": { backgroundColor: "#F8FAFC" },
                            }}
                        >
                            {isLoginPage ? "Create an account" : "Sign in here"}
                        </Button>
                    </div>
                </div>
            </div>

            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={auth.error ? "error" : "success"}
                    variant="filled"
                    sx={{ width: "100%", borderRadius: "10px" }}
                >
                    {auth.error ? auth.error : auth.otpSent ? "Verification code sent to your email!" : ""}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Auth;
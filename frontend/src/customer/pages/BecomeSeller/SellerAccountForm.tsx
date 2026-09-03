import { Button, CircularProgress, Step, StepLabel, Stepper } from "@mui/material";
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { createSeller } from "../../../Redux Toolkit/Seller/sellerAuthenticationSlice";
import { fetchSellerProfile } from "../../../Redux Toolkit/Seller/sellerSlice";
import BecomeSellerFormStep1 from "./BecomeSellerFormStep1";
import BecomeSellerFormStep2 from "./BecomeSellerFormStep2";
import BecomeSellerFormStep3 from "./BecomeSellerFormStep3";
import BecomeSellerFormStep4 from "./BecomeSellerFormStep4";

const steps = [
  "Tax & Mobile",
  "Pickup Address",
  "Bank Details",
  "Supplier Details",
];

interface SellerAccountFormProps {
  initialEmail?: string;
  initialMobile?: string;
}

const SellerAccountForm: React.FC<SellerAccountFormProps> = ({
  initialEmail = "",
  initialMobile = "",
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sellerAuth } = useAppSelector((store) => store);

  const handleStep = (value: number) => {
    setActiveStep(activeStep + value);
  };

  const formik = useFormik({
    initialValues: {
      mobile: initialMobile,
      otp: "",
      GSTIN: "",
      pickupAddress: {
        name: "",
        mobile: initialMobile,
        pinCode: "",
        address: "",
        locality: "",
        city: "",
        state: "",
      },
      bankDetails: {
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      },
      sellerName: "",
      email: initialEmail,
      businessDetails: {
        businessName: "",
        businessEmail: initialEmail,
        businessMobile: initialMobile,
        logo: "",
        banner: "",
        businessAddress: "",
      },
      password: "",
      confirmPassword: "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!values.password || values.password.length < 6) {
        formik.setFieldError("password", "Password must be at least 6 characters");
        return;
      }
      if (values.password !== values.confirmPassword) {
        formik.setFieldError("confirmPassword", "Passwords do not match");
        return;
      }

      console.log("Seller registration values submitted:", values);
      const res = await dispatch(createSeller({ seller: values, navigate }));
      if (createSeller.fulfilled.match(res)) {
        if (res.payload?.jwt) {
          localStorage.setItem("jwt", res.payload.jwt);
          localStorage.setItem("seller_jwt", res.payload.jwt);
          localStorage.setItem("role", "ROLE_SELLER");
          dispatch(fetchSellerProfile(res.payload.jwt));
        }
        navigate("/seller");
      }
    },
  });

  // Sync mobile number into pickup address if pickup address mobile is empty
  useEffect(() => {
    if (formik.values.mobile && !formik.values.pickupAddress.mobile) {
      formik.setFieldValue("pickupAddress.mobile", formik.values.mobile);
    }
  }, [formik.values.mobile]);

  const handleSubmit = () => {
    formik.handleSubmit();
  };

  return (
    <div>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="mt-10 space-y-10">
        <div>
          {activeStep === 0 ? (
            <BecomeSellerFormStep1 formik={formik} />
          ) : activeStep === 1 ? (
            <BecomeSellerFormStep2 formik={formik} />
          ) : activeStep === 2 ? (
            <BecomeSellerFormStep3 formik={formik} />
          ) : (
            <BecomeSellerFormStep4 formik={formik} />
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            disabled={activeStep === 0}
            onClick={() => handleStep(-1)}
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Back
          </Button>

          <Button
            disabled={sellerAuth.loading}
            onClick={
              activeStep === steps.length - 1 ? handleSubmit : () => handleStep(1)
            }
            variant="contained"
            sx={{
              backgroundColor: "#1E40AF",
              "&:hover": { backgroundColor: "#1E3A8A" },
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1,
            }}
          >
            {activeStep === steps.length - 1 ? (
              sellerAuth.loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Create Seller Account"
              )
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerAccountForm;
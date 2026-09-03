import { Box, TextField, Alert } from "@mui/material";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface BecomeSellerFormStep1Props {
  formik: any;
  handleOtpChange?: (otp: string) => void;
}

const BecomeSellerFormStep1 = ({ formik }: BecomeSellerFormStep1Props) => {
  return (
    <Box className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Tax & Identification</h2>
        <p className="text-xs text-slate-500">
          Enter your business contact number and GSTIN identification.
        </p>
      </div>

      {formik.values.email && (
        <Alert
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          severity="success"
          sx={{ fontSize: "12px", py: 0.5, borderRadius: "8px" }}
        >
          Verified Email: <strong>{formik.values.email}</strong>
        </Alert>
      )}

      <div className="space-y-5">
        <TextField
          fullWidth
          required
          name="mobile"
          label="Business Mobile Number"
          placeholder="e.g. 9876543210"
          value={formik.values.mobile}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.mobile && Boolean(formik.errors.mobile)}
          helperText={
            (formik.touched.mobile && formik.errors.mobile) ||
            "Contact number for order updates and customer service"
          }
          InputProps={{
            startAdornment: (
              <SmartphoneOutlinedIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 20 }} />
            ),
          }}
        />

        <TextField
          fullWidth
          required
          name="GSTIN"
          label="GSTIN Number"
          placeholder="e.g. 22AAAAA0000A1Z5"
          value={formik.values.GSTIN}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.GSTIN && Boolean(formik.errors.GSTIN)}
          helperText={
            (formik.touched.GSTIN && formik.errors.GSTIN) ||
            "15-digit GSTIN (provisional / standard format accepted)"
          }
        />
      </div>
    </Box>
  );
};

export default BecomeSellerFormStep1;

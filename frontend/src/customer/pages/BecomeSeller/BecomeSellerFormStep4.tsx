import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface BecomeSellerFormStep4Props {
  formik: any;
}

const BecomeSellerFormStep4 = ({ formik }: BecomeSellerFormStep4Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-5">
      <TextField
        fullWidth
        required
        name="businessDetails.businessName"
        label="Store / Business Name"
        placeholder="e.g. Acme Retailers"
        value={formik.values.businessDetails.businessName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={
          formik.touched?.businessDetails?.businessName &&
          Boolean(formik.errors?.businessDetails?.businessName)
        }
        helperText={
          formik.touched?.businessDetails?.businessName &&
          formik.errors?.businessDetails?.businessName
        }
      />

      <TextField
        fullWidth
        required
        name="sellerName"
        label="Authorized Representative Name"
        placeholder="e.g. John Doe"
        value={formik.values.sellerName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.sellerName && Boolean(formik.errors.sellerName)}
        helperText={formik.touched.sellerName && formik.errors.sellerName}
      />

      <div className="space-y-1">
        <TextField
          fullWidth
          required
          name="email"
          label="Account Email (Verified)"
          value={formik.values.email}
          InputProps={{
            readOnly: true,
          }}
          helperText="This email was verified via OTP and will be used to access your seller account."
        />
        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold px-1">
          <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
          <span>OTP Verified</span>
        </div>
      </div>

      <TextField
        fullWidth
        required
        type={showPassword ? 'text' : 'password'}
        name="password"
        label="Account Password"
        placeholder="Create a strong password (min 6 characters)"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched?.password && Boolean(formik.errors?.password)}
        helperText={
          (formik.touched?.password && formik.errors?.password) ||
          'Password will be hashed with bcrypt before storing in database'
        }
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
      />

      <TextField
        fullWidth
        required
        type={showConfirmPassword ? 'text' : 'password'}
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-type your password"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched?.confirmPassword && Boolean(formik.errors?.confirmPassword)}
        helperText={formik.touched?.confirmPassword && formik.errors?.confirmPassword}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
                size="small"
              >
                {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
};

export default BecomeSellerFormStep4;
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { useAppDispatch } from '../../../Redux Toolkit/Store';
import { saveUserAddress } from '../../../Redux Toolkit/Customer/UserSlice';
import type { Address } from '../../../types/userTypes';

const ContactSchema = Yup.object().shape({
  name: Yup.string().required('Full name is required'),
  mobile: Yup.string().required('Contact mobile number is required'),
  pinCode: Yup.string().required('Pincode is required'),
  address: Yup.string().required('Street address is required'),
  locality: Yup.string().required('Locality/Town is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
});

interface AddressFormProp {
  handleClose: () => void;
  paymentGateway?: string;
  onAddressSaved?: (address: Address) => void;
}

const AddressForm: React.FC<AddressFormProp> = ({ handleClose, onAddressSaved }) => {
  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      pinCode: '',
      address: '',
      locality: '',
      city: '',
      state: '',
    },
    validationSchema: ContactSchema,
    onSubmit: async (values) => {
      const newAddress: Address = {
        ...values,
        _id: `addr_${Date.now()}` as any,
      };

      await dispatch(saveUserAddress({
        address: newAddress,
        jwt: localStorage.getItem('jwt') || ""
      }));

      if (onAddressSaved) {
        onAddressSaved(newAddress);
      }
      handleClose();
    },
  });

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <div className='pb-4 border-b mb-4'>
        <p className='text-xl font-bold text-slate-900'>Add Delivery Address</p>
        <p className='text-xs text-slate-500'>Enter your shipping details for order delivery</p>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              name="name"
              label="Full Name"
              placeholder="e.g. John Doe"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.name && formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name ? String(formik.errors.name) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              size="small"
              name="mobile"
              label="Contact Mobile"
              placeholder="e.g. 9876543210"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.mobile && formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile ? String(formik.errors.mobile) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              size="small"
              name="pinCode"
              label="Pin Code"
              placeholder="e.g. 110001"
              value={formik.values.pinCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.pinCode && formik.errors.pinCode)}
              helperText={formik.touched.pinCode && formik.errors.pinCode ? String(formik.errors.pinCode) : undefined}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              name="address"
              label="House No, Building, Street"
              placeholder="e.g. Flat 402, Sunshine Heights, MG Road"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.address && formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address ? String(formik.errors.address) : undefined}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              name="locality"
              label="Locality / Landmark"
              placeholder="e.g. Near City Center Mall"
              value={formik.values.locality}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.locality && formik.errors.locality)}
              helperText={formik.touched.locality && formik.errors.locality ? String(formik.errors.locality) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              size="small"
              name="city"
              label="City"
              placeholder="e.g. New Delhi"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.city && formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city ? String(formik.errors.city) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              size="small"
              name="state"
              label="State"
              placeholder="e.g. Delhi"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.state && formik.errors.state)}
              helperText={formik.touched.state && formik.errors.state ? String(formik.errors.state) : undefined}
            />
          </Grid>
          <Grid size={12} sx={{ mt: 1 }}>
            <Button
              sx={{
                py: "12px",
                backgroundColor: "#1E40AF",
                "&:hover": { backgroundColor: "#1E3A8A" },
                fontWeight: 700,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "15px"
              }}
              type="submit"
              variant="contained"
              fullWidth
            >
              Save Address & Deliver Here
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AddressForm;

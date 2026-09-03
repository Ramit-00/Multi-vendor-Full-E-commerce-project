import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import {type UpdateDetailsFormProps } from "./BussinessDetailsForm";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";


const PickupAddressForm = ({ onClose }: UpdateDetailsFormProps) => {
  const { sellers } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
      address: "",
      city: "",
      state: "",
      mobile: "",
    },
    validationSchema: Yup.object({
      address: Yup.string().required("Address is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
      mobile: Yup.string().required("Mobile number is required"),
    }),
    onSubmit: (values) => {
      console.log(values);
      dispatch(
        updateSeller({
          pickupAddress: values,
         
        })
      );
      onClose();
    },
  });

  useEffect(() => {
    if (sellers.profile) {
      formik.setValues({
        address: sellers.profile.pickupAddress.address,
        city: sellers.profile.pickupAddress.city,
        state: sellers.profile.pickupAddress.state,
        mobile: sellers.profile.pickupAddress.mobile,
      });
    }
  }, [sellers.profile]);

  return (
    <>
      <div className="text-center pb-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Update Pickup Address
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Specify your official merchant dispatch & returns location
        </p>
      </div>
      <form className="space-y-4" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="address"
          name="address"
          label="Street Address / Building"
          value={formik.values.address}
          onChange={formik.handleChange}
          error={formik.touched.address && Boolean(formik.errors.address)}
          helperText={formik.touched.address && formik.errors.address}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          id="city"
          name="city"
          label="City / Town"
          value={formik.values.city}
          onChange={formik.handleChange}
          error={formik.touched.city && Boolean(formik.errors.city)}
          helperText={formik.touched.city && formik.errors.city}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          id="state"
          name="state"
          label="State / Province"
          value={formik.values.state}
          onChange={formik.handleChange}
          error={formik.touched.state && Boolean(formik.errors.state)}
          helperText={formik.touched.state && formik.errors.state}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          id="mobile"
          name="mobile"
          label="Dispatch Contact Mobile"
          value={formik.values.mobile}
          onChange={formik.handleChange}
          error={formik.touched.mobile && Boolean(formik.errors.mobile)}
          helperText={formik.touched.mobile && formik.errors.mobile}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Button
          sx={{
            py: '12px',
            backgroundColor: '#0F172A',
            '&:hover': { backgroundColor: '#1E293B' },
            fontWeight: 700,
            borderRadius: '10px',
            textTransform: 'none',
          }}
          variant="contained"
          fullWidth
          type="submit"
        >
          Save Changes
        </Button>
      </form>
    </>
  );
};

export default PickupAddressForm;

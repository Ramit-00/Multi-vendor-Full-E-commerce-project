import  { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";

export interface UpdateDetailsFormProps {
  onClose: () => void;
}
const BusinessDetailsForm = ({ onClose }: UpdateDetailsFormProps) => {
  const dispatch = useAppDispatch();
  const { sellers } = useAppSelector((store) => store);
  const formik = useFormik({
    initialValues: {
      businessName: "",
      GSTIN: "",
      accountStatus: "",
    },
    validationSchema: Yup.object({
      businessName: Yup.string().required("Business Name is required"),
      GSTIN: Yup.string().required("GSTIN is required"),
      accountStatus: Yup.string().required("Account Status is required"),
    }),
    onSubmit: (values) => {
      console.log(values);
      dispatch(
        updateSeller({
          ...values,
          businessDetails: { businessName: values.businessName },
        })
      );
      onClose();
    },
  });

  useEffect(() => {
    if (sellers.profile) {
      formik.setValues({
        businessName: sellers.profile?.businessDetails?.businessName,
        GSTIN: sellers.profile?.GSTIN,
        accountStatus: sellers.profile?.accountStatus ?? "",
      });
    }
  }, [sellers.profile]);

  return (
    <>
      <div className="text-center pb-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Update Business Details
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Edit your commercial store and tax credentials
        </p>
      </div>
      <form className="space-y-4" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="businessName"
          name="businessName"
          label="Business / Store Name"
          value={formik.values.businessName}
          onChange={formik.handleChange}
          error={
            formik.touched.businessName && Boolean(formik.errors.businessName)
          }
          helperText={formik.touched.businessName && formik.errors.businessName}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          id="gstin"
          name="GSTIN"
          label="GSTIN Number"
          value={formik.values.GSTIN}
          onChange={formik.handleChange}
          error={formik.touched.GSTIN && Boolean(formik.errors.GSTIN)}
          helperText={formik.touched.GSTIN && formik.errors.GSTIN}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          id="accountStatus"
          name="accountStatus"
          label="Account Status"
          value={formik.values.accountStatus}
          onChange={formik.handleChange}
          error={
            formik.touched.accountStatus && Boolean(formik.errors.accountStatus)
          }
          helperText={
            formik.touched.accountStatus && formik.errors.accountStatus
          }
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

export default BusinessDetailsForm;

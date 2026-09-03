import  { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, Button } from "@mui/material";
import { type UpdateDetailsFormProps } from "./BussinessDetailsForm";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";

const PersonalDetailsForm = ({ onClose }: UpdateDetailsFormProps) => {
    const { sellers } = useAppSelector(store => store)
    const dispatch=useAppDispatch();

    const formik = useFormik({
        initialValues: {
            sellerName: '',
            email: '',
            mobile: '',
        },
        validationSchema: Yup.object({
            sellerName: Yup.string().required("Seller Name is required"),
            email: Yup.string().email("Invalid email address").required("Email is required"),
            mobile: Yup.string().required("Mobile number is required"),
        }),
        onSubmit: (values) => {
            
            console.log("data ----- ",values);
            dispatch(updateSeller(values))
            onClose()
        },
    });

    useEffect(() => {

        if (sellers.profile) {
            formik.setValues({
                sellerName: sellers.profile?.sellerName,
                email: sellers.profile?.email,
                mobile: sellers.profile?.mobile,

            })
        }

    }, [sellers.profile])

    return (
        <>
            <div className="text-center pb-4">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Update Personal Credentials
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Edit your official merchant identity details
                </p>
            </div>
            <form className="space-y-4" onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth
                    id="sellerName"
                    name="sellerName"
                    label="Seller Full Name"
                    value={formik.values.sellerName}
                    onChange={formik.handleChange}
                    error={formik.touched.sellerName && Boolean(formik.errors.sellerName)}
                    helperText={formik.touched.sellerName && formik.errors.sellerName}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Seller Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <TextField
                    fullWidth
                    id="mobile"
                    name="mobile"
                    label="Contact Mobile"
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

export default PersonalDetailsForm;

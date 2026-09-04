import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { deleteUserAddress } from '../../../Redux Toolkit/Customer/UserSlice';
import UserAddressCard from './UserAddressCard';
import AddressForm from '../Checkout/AddresssForm';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

const Addresses = () => {
  const { user } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDelete = async (addressId: any) => {
    if (addressId) {
      await dispatch(
        deleteUserAddress({
          addressId: String(addressId),
          jwt: localStorage.getItem('jwt') || localStorage.getItem('customer_jwt') || '',
        })
      );
      setSnackbar({
        open: true,
        message: 'Delivery address removed successfully.',
        severity: 'info',
      });
    }
  };

  const handleAddressSaved = () => {
    setSnackbar({
      open: true,
      message: 'New delivery address added successfully!',
      severity: 'success',
    });
    handleClose();
  };

  const addresses = user.user?.addresses || [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Addresses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal delivery locations ({addresses.length} saved)
          </p>
        </div>

        <Button
          onClick={handleOpen}
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          sx={{
            backgroundColor: '#0F172A',
            '&:hover': { backgroundColor: '#1E293B' },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
          }}
        >
          Add New Address
        </Button>
      </div>

      {/* Address Cards List or Empty State */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((item: any) => (
            <UserAddressCard
              key={item._id}
              item={item}
              onDelete={() => handleDelete(item._id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center">
            <LocationOnOutlinedIcon sx={{ fontSize: 26 }} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-800">No saved addresses yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Add your delivery addresses here so they are ready for instant 1-click checkout.
            </p>
          </div>
          <Button
            onClick={handleOpen}
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            sx={{
              mt: 1,
              borderColor: '#0F172A',
              color: '#0F172A',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              px: 2.5,
              '&:hover': {
                borderColor: '#1E293B',
                backgroundColor: 'rgba(15, 23, 42, 0.04)',
              },
            }}
          >
            Add Your First Address
          </Button>
        </div>
      )}

      {/* Add Address Dialog Modal */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1.5,
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="font-extrabold text-slate-900 text-lg">Add New Delivery Address</span>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: '#94A3B8',
              '&:hover': { color: '#0F172A' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#F1F5F9', pt: 3 }}>
          <AddressForm handleClose={handleClose} onAddressSaved={handleAddressSaved} />
        </DialogContent>
      </Dialog>

      {/* Notification Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Addresses;
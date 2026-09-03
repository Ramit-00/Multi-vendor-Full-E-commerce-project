import React, { useState, useEffect } from 'react';
import PricingCard from '../Cart/PricingCard';
import {
  Box,
  Button,
  FormControlLabel,
  Modal,
  Radio,
  RadioGroup,
  CircularProgress,
} from '@mui/material';
import AddressForm from './AddresssForm';
import AddressCard from './AddressCard';
import AddIcon from '@mui/icons-material/Add';
import { createOrder } from '../../../Redux Toolkit/Customer/OrderSlice';
import { deleteUserAddress } from '../../../Redux Toolkit/Customer/UserSlice';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import type { Address } from '../../../types/userTypes';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 520 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '16px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const paymentGatewayList = [
  {
    value: 'RAZORPAY',
    image: 'https://razorpay.com/newsroom-content/uploads/2020/12/output-onlinepngtools-1-1.png',
    label: 'Razorpay',
  },
  {
    value: 'STRIPE',
    image: '/stripe_logo.png',
    label: 'Stripe',
  },
];

const AddressPage = () => {
  const [selectedValue, setSelectedValue] = useState(0);
  const dispatch = useAppDispatch();
  const { user, orders } = useAppSelector((store) => store);
  const [paymentGateway, setPaymentGateway] = useState(paymentGatewayList[0].value);
  const [open, setOpen] = useState(false);

  const [localAddresses, setLocalAddresses] = useState<Address[]>(() => {
    try {
      const saved = localStorage.getItem('user_addresses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (user.user?.addresses && user.user.addresses.length > 0) {
      setLocalAddresses(user.user.addresses);
    }
  }, [user.user?.addresses]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAddressChange = (event: any) => {
    setSelectedValue(Number(event.target.value));
  };

  const handleAddressSaved = (newAddress: Address) => {
    setLocalAddresses((prev) => {
      const updated = [...prev, newAddress];
      setSelectedValue(updated.length - 1);
      return updated;
    });
  };

  const handleDeleteAddress = (addressId: any, index: number) => {
    if (addressId) {
      dispatch(
        deleteUserAddress({
          addressId: String(addressId),
          jwt: localStorage.getItem('jwt') || '',
        })
      );
    }

    setLocalAddresses((prev) => {
      const updated = prev.filter((a, i) =>
        addressId ? String(a._id) !== String(addressId) : i !== index
      );
      try {
        localStorage.setItem('user_addresses', JSON.stringify(updated));
      } catch (e) {}

      if (selectedValue >= updated.length) {
        setSelectedValue(Math.max(0, updated.length - 1));
      }

      return updated;
    });
  };

  const handlePaymentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentGateway((event.target as HTMLInputElement).value);
  };

  const handleCreateOrder = () => {
    const currentAddresses = localAddresses.length > 0
      ? localAddresses
      : (user.user?.addresses || []);

    if (currentAddresses.length === 0) {
      handleOpen();
      return;
    }

    const selectedAddress = currentAddresses[selectedValue] || currentAddresses[0];

    dispatch(
      createOrder({
        paymentGateway,
        address: selectedAddress,
        jwt: localStorage.getItem('jwt') || '',
      })
    );
  };

  const allAddresses = localAddresses.length > 0 ? localAddresses : (user.user?.addresses || []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-[#FAFAFA]">
      <div className="space-y-6 lg:space-y-0 lg:grid grid-cols-3 lg:gap-8">
        {/* Left Column: Delivery Address Selection */}
        <div className="col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Delivery Address</h2>
              <p className="text-xs text-slate-500">Select where you want your order delivered</p>
            </div>
            <Button
              onClick={handleOpen}
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: '#0F172A',
                '&:hover': { backgroundColor: '#1E293B' },
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2,
              }}
            >
              Add New Address
            </Button>
          </div>

          <div className="space-y-3">
            {allAddresses.length > 0 ? (
              allAddresses.map((item: any, index: number) => (
                <AddressCard
                  key={item._id || index}
                  item={item}
                  selectedValue={selectedValue}
                  value={index}
                  handleChange={handleAddressChange}
                  handleDelete={() => handleDeleteAddress(item._id || item.id, index)}
                />
              ))
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3 shadow-sm">
                <p className="text-sm font-bold text-slate-800">No saved delivery address found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Please add your shipping address so we can calculate shipping and deliver your package.
                </p>
                <Button
                  onClick={handleOpen}
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{
                    borderColor: '#0F172A',
                    color: '#0F172A',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '10px',
                    '&:hover': { borderColor: '#0F172A', backgroundColor: '#F8FAFC' },
                  }}
                >
                  Add Address Now
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment Gateway & Order Summary */}
        <div className="col-span-1 space-y-4">
          <section className="space-y-3 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
              Choose Payment Method
            </h3>

            <RadioGroup
              row
              name="payment-method-group"
              className="flex justify-between"
              onChange={handlePaymentChange}
              value={paymentGateway}
            >
              {paymentGatewayList.map((item) => (
                <FormControlLabel
                  key={item.value}
                  className={`border w-[48%] flex justify-center rounded-xl p-2.5 cursor-pointer transition-all ${
                    paymentGateway === item.value
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  value={item.value}
                  control={<Radio size="small" sx={{ color: '#0F172A', '&.Mui-checked': { color: '#0F172A' } }} />}
                  label={
                    <div className="flex items-center gap-1.5">
                      <img
                        className="h-6 object-contain"
                        src={item.image}
                        alt={item.label}
                      />
                    </div>
                  }
                />
              ))}
            </RadioGroup>
          </section>

          <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <PricingCard />
            <div className="p-4">
              <Button
                disabled={orders.loading}
                onClick={handleCreateOrder}
                sx={{
                  py: '12px',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                  fontWeight: 700,
                  fontSize: '14px',
                  textTransform: 'none',
                  borderRadius: '10px',
                }}
                variant="contained"
                fullWidth
              >
                {orders.loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Pay via ${paymentGateway === 'STRIPE' ? 'Stripe' : 'Razorpay'}`
                )}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Add New Address Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="address-modal-title"
      >
        <Box sx={modalStyle}>
          <AddressForm
            paymentGateway={paymentGateway}
            handleClose={handleClose}
            onAddressSaved={handleAddressSaved}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default AddressPage;
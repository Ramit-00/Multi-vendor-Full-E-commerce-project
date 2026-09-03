import React, { useState } from 'react';
import {
  Alert,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
} from '@mui/material';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    topic: 'Order & Delivery',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }
    // Client-side confirmation (as requested, no backend needed for now)
    setSubmitted(true);
    setSnackbarOpen(true);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'Order & Delivery',
      message: '',
    });
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-extrabold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full border border-blue-400/30">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Contact E-COM Support
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Have questions about an order, seller registration, or platform services? We're here to help you every step of the way.
          </p>
        </div>
      </section>

      <Container maxWidth="lg" className="mt-12 space-y-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <PhoneInTalkOutlinedIcon />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Call Us Directly</h2>
            <p className="text-xs text-slate-500">Toll-Free Helpline:</p>
            <p className="text-sm font-bold text-slate-800">1800-123-ECOM (3266)</p>
            <p className="text-xs text-slate-600">+91 98765 43210</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <EmailOutlinedIcon />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Email Support</h2>
            <p className="text-xs text-slate-500">Customer Assistance:</p>
            <p className="text-sm font-bold text-slate-800">support@ecom.com</p>
            <p className="text-xs text-slate-600">sellers@ecom.com</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AccessTimeOutlinedIcon />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Working Hours</h2>
            <p className="text-xs text-slate-500">Customer Desk:</p>
            <p className="text-sm font-bold text-slate-800">Mon &ndash; Sat: 9am &ndash; 8pm</p>
            <p className="text-xs text-slate-600">Sunday: Closed (Emails logged)</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <LocationOnOutlinedIcon />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Marketplace HQ</h2>
            <p className="text-xs text-slate-500">Registered Office:</p>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              E-COM Marketplace Pvt. Ltd., Level 4, Tech Innovation Hub, Outer Ring Road, Bengaluru - 560103
            </p>
          </div>
        </div>

        {/* Main Grid: About Us Summary + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: About Us Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                About E-COM
              </span>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                India's Trusted Multi-Vendor E-Commerce Platform
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                E-COM bridges the gap between verified independent manufacturers, brand sellers, and discerning consumers. We provide a secure, automated marketplace where quality meets affordability.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.2 }} />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Direct Merchant Accountability</h3>
                    <p className="text-[11px] text-slate-500">Orders dispatched directly by verified store owners.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.2 }} />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Buyer Protection Guarantee</h3>
                    <p className="text-[11px] text-slate-500">Secure payments with live progress tracking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.2 }} />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Prompt Support Resolution</h3>
                    <p className="text-[11px] text-slate-500">Dedicated desk responding within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Send Us a Message</h2>
                <p className="text-xs text-slate-500">
                  Fill out the form below and our team will get back to you promptly.
                </p>
              </div>

              {submitted && (
                <Alert
                  severity="success"
                  variant="outlined"
                  onClose={() => setSubmitted(false)}
                  sx={{ borderRadius: '12px' }}
                >
                  Thank you! Your message has been logged. Our customer support team will contact you shortly.
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Your Name"
                    name="fullName"
                    required
                    fullWidth
                    size="small"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    fullWidth
                    size="small"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Mobile Number (Optional)"
                    name="phone"
                    fullWidth
                    size="small"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel id="topic-select-label">Inquiry Topic</InputLabel>
                    <Select
                      labelId="topic-select-label"
                      label="Inquiry Topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                    >
                      <MenuItem value="Order & Delivery">Order &amp; Delivery Tracking</MenuItem>
                      <MenuItem value="Seller Onboarding">Seller Onboarding &amp; Registration</MenuItem>
                      <MenuItem value="Payment & Billing">Payment &amp; Billing Queries</MenuItem>
                      <MenuItem value="Product Feedback">Product Feedback &amp; Reviews</MenuItem>
                      <MenuItem value="General Inquiry">General Marketplace Inquiry</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <TextField
                  label="Your Message"
                  name="message"
                  required
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Please describe your question or issue in detail..."
                  value={formData.message}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  sx={{
                    backgroundColor: '#1E40AF',
                    '&:hover': { backgroundColor: '#1E3A8A' },
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px',
                    px: 4,
                    py: 1.2,
                  }}
                >
                  Submit Inquiry
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          Your inquiry has been successfully sent to E-COM Support!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Contact;

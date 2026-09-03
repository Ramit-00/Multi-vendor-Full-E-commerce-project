import React from 'react';
import { Button, Container } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

const Services: React.FC = () => {
  const navigate = useNavigate();

  const servicesList = [
    {
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 32, color: '#2563EB' }} />,
      title: 'Product Catalog & Smart Discovery',
      description:
        'Explore thousands of authentic products across fashion, electronics, and lifestyle with smart category filtering, instant search, and real-time inventory tracking.',
      badge: 'Core Service',
    },
    {
      icon: <StorefrontOutlinedIcon sx={{ fontSize: 32, color: '#10B981' }} />,
      title: 'Vendor Onboarding & Store Management',
      description:
        'Empower sellers with verified onboarding (email OTP validation), dedicated dashboard analytics, bulk product image uploads, and inventory controls.',
      badge: 'For Sellers',
    },
    {
      icon: <PaymentOutlinedIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />,
      title: 'Dual Payment Gateways & Cash on Delivery',
      description:
        'Safe digital checkouts with industry leaders Razorpay and Stripe (UPI, Credit/Debit cards, Net Banking) plus flexible Pay on Delivery on eligible orders.',
      badge: 'Secure Checkout',
    },
    {
      icon: <LocalShippingOutlinedIcon sx={{ fontSize: 32, color: '#F59E0B' }} />,
      title: 'Order Dispatch & Live Progress Stepper',
      description:
        'Visual step-by-step tracking from order confirmation through dispatch and delivery, backed by multi-address management and real-time status updates.',
      badge: 'Logistics',
    },
    {
      icon: <StarBorderOutlinedIcon sx={{ fontSize: 32, color: '#EC4899' }} />,
      title: 'Verified Customer Ratings & Reviews',
      description:
        'Genuine feedback loops allowing shoppers to rate products and post verified reviews, helping buyers make confident purchase decisions.',
      badge: 'Community',
    },
    {
      icon: <SecurityOutlinedIcon sx={{ fontSize: 32, color: '#06B6D4' }} />,
      title: 'Buyer Protection & Order Safeguards',
      description:
        'Transparent order cancellation policies, merchant accountability, and dedicated customer support to protect every rupee you spend.',
      badge: 'Trust & Safety',
    },
    {
      icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 32, color: '#6366F1' }} />,
      title: 'Customer Account & Wishlist Sync',
      description:
        'Curate your favorite items in personal wishlists, reorder in one click, manage multiple delivery locations, and view complete transaction histories.',
      badge: 'Account Management',
    },
    {
      icon: <SupportAgentOutlinedIcon sx={{ fontSize: 32, color: '#14B8A6' }} />,
      title: 'Dedicated Customer & Seller Assistance',
      description:
        'Direct inquiry channels, quick issue resolution for deliveries, seller inquiries, and platform assistance available 6 days a week.',
      badge: 'Support',
    },
  ];

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Services Header Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-extrabold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full border border-blue-400/30">
            E-COM Marketplace Services
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            End-to-End E-Commerce Solutions
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            From seamless multi-vendor checkout to merchant onboarding, discover the comprehensive capabilities powering E-COM.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <Container maxWidth="lg" className="mt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {service.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {service.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {service.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-blue-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black">
              Ready to sell your products on E-COM?
            </h3>
            <p className="text-xs sm:text-sm text-blue-200">
              Join our growing network of verified independent merchants and reach customers across the country.
            </p>
          </div>
          <Button
            onClick={() => navigate('/become-seller')}
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              backgroundColor: '#FFFFFF',
              color: '#1E40AF',
              '&:hover': { backgroundColor: '#F1F5F9' },
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              px: 3,
              py: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Start Selling Today
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default Services;

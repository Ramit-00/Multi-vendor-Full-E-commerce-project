import React from 'react';
import { Button, Container } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-20 px-6 sm:px-12 text-center">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-block text-xs font-extrabold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full border border-blue-400/30">
            About E-COM Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Empowering Independent Merchants &amp; Discerning Shoppers
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            E-COM is an all-in-one multi-vendor e-commerce destination where verified regional sellers, artisans, and brand manufacturers connect directly with buyers across the nation.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button
              onClick={() => navigate('/')}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: '#2563EB',
                '&:hover': { backgroundColor: '#1D4ED8' },
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1.2,
              }}
            >
              Explore Products
            </Button>
            <Button
              onClick={() => navigate('/become-seller')}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#FFFFFF',
                '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.05)' },
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1.2,
              }}
            >
              Become a Seller
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <Container maxWidth="lg" className="mt-14 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black">
              <StorefrontIcon sx={{ fontSize: 28 }} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              To democratize digital commerce by providing small and medium enterprise sellers, independent fashion designers, and local artisans with enterprise-grade storefronts, automated logistics, and transparent payment infrastructures.
            </p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center font-black">
              <VerifiedUserOutlinedIcon sx={{ fontSize: 28 }} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              To be India's most trusted and vibrant multi-vendor marketplace, where customer choice is celebrated through verified merchant credibility, genuine product guarantees, and prompt customer resolution.
            </p>
          </div>
        </div>

        {/* What Sets E-COM Apart */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Why Customers &amp; Sellers Choose E-COM
            </h2>
            <p className="text-sm text-slate-500">
              Built from the ground up to solve modern multi-vendor commerce challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <VerifiedUserOutlinedIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Merchants Only</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every merchant on E-COM must complete mandatory identity and email OTP authentication, GSTIN validation, and address verification before listing products.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <PaymentsOutlinedIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Flexible, Secure Payments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless digital transactions with Razorpay, Stripe cards, and UPI, backed by zero-risk Pay On Delivery options across supported pincodes.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <LocalShippingOutlinedIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Direct Vendor Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Orders are fulfilled directly by the original vendor from their verified pickup address, minimizing transit times and unnecessary distributor markups.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <PeopleAltOutlinedIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Vendor Cart Split</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add products from multiple different sellers into a single checkout cart. Our platform automatically dispatches sub-orders to the respective merchants.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <SupportAgentOutlinedIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Customer Buyer Protection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live order tracking with step-by-step dispatch updates, verified customer product reviews, and dedicated dispute resolution support.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <StorefrontIcon />
              </div>
              <h3 className="text-base font-bold text-slate-900">Full Seller Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Merchants enjoy an intuitive analytics dashboard, real-time product listing tools, image upload support, and revenue tracking.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">Have questions or want to partner with us?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Our team is ready to assist customers and prospective merchants 6 days a week.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/contact-us')}
              variant="contained"
              sx={{
                backgroundColor: '#2563EB',
                '&:hover': { backgroundColor: '#1D4ED8' },
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                px: 3,
              }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default About;

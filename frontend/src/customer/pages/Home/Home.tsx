import { useState } from 'react';
import HomeCategory from './HomeCategory/HomeCategory';
import TopBrand from './TopBrands/Grid';
import ElectronicCategory from './Electronic Category/ElectronicCategory';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { Backdrop, Button, CircularProgress } from '@mui/material';
import ChatBot from '../ChatBot/ChatBot';
import { useNavigate } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useAppSelector } from '../../../Redux Toolkit/Store';
import DealSlider from './Deals/DealSlider';

const Home = () => {
  const [showChatBot, setShowChatBot] = useState(false);
  const { homePage, sellers } = useAppSelector((store) => store);
  const navigate = useNavigate();

  const isSeller = Boolean(
    localStorage.getItem('seller_jwt') &&
    localStorage.getItem('role') === 'ROLE_SELLER' &&
    sellers?.profile?._id &&
    sellers?.profile?.accountStatus !== 'CLOSED'
  );

  const handleShowChatBot = () => setShowChatBot(!showChatBot);
  const handleCloseChatBot = () => setShowChatBot(false);

  const becomeSellerClick = () => {
    if (isSeller) {
      navigate('/seller');
    } else {
      navigate('/become-seller');
    }
  };

  return (
    <>
      {!homePage.loading ? (
        <div className="space-y-12 lg:space-y-16 pb-16">
          {/* 1. Hero Editorial Showcase */}
          <section className="px-4 lg:px-12 pt-6">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white min-h-[420px] lg:min-h-[500px] flex items-center shadow-xl">
              {/* Background gradient art & imagery */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/40 z-10" />
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop"
                alt="E-COM Marketplace"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
              />

              {/* Hero Content */}
              <div className="relative z-20 max-w-2xl px-6 lg:px-16 py-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>The Premier Multi-Vendor Platform</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  Curated Collections from Verified Merchants.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
                  Explore verified multi-vendor storefronts offering the finest electronics, apparel, lifestyle, and home goods with direct-from-artisan pricing.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={() => navigate('/search-products')}
                    variant="contained"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 700,
                      px: 3,
                      py: '10px',
                      borderRadius: '10px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#F1F5F9',
                      },
                    }}
                  >
                    Explore Marketplace
                  </Button>

                  <Button
                    onClick={becomeSellerClick}
                    variant="outlined"
                    startIcon={isSeller ? <DashboardOutlinedIcon sx={{ fontSize: 16 }} /> : <StorefrontIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      px: 3,
                      py: '10px',
                      borderRadius: '10px',
                      textTransform: 'none',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    {isSeller ? 'Manage Dashboard' : 'Become a Seller'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                  <VerifiedIcon sx={{ fontSize: 20 }} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">100% Verified Merchants</h4>
                  <p className="text-[11px] text-slate-500">Every seller is vetted with tax & identity verification</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <SecurityIcon sx={{ fontSize: 20 }} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Safe Buyer Escrow</h4>
                  <p className="text-[11px] text-slate-500">Funds released only upon verified product delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
                  <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Express Tracked Shipping</h4>
                  <p className="text-[11px] text-slate-500">Real-time status updates across all orders</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Quick Browse Electronics Category Bar */}
          {homePage.homePageData?.electricCategories && <ElectronicCategory />}

          {/* 3. Today's Deals Section */}
          {homePage.homePageData?.deals && (
            <section className="px-4 lg:px-12">
              <div className="flex flex-col sm:flex-row items-baseline justify-between mb-6 pb-2 border-b border-slate-200/80">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    Flash Offers
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-2">
                    Today&apos;s Exclusive Deals
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 sm:mt-0 font-medium">
                  Direct merchant markdowns refreshed every 24 hours
                </p>
              </div>
              <DealSlider />
            </section>
          )}

          {/* 4. Top Brands Editorial Mosaic */}
          {homePage.homePageData?.grid && (
            <section>
              <TopBrand />
            </section>
          )}

          {/* 5. Shop by Category */}
          {homePage.homePageData?.shopByCategories && (
            <section className="px-4 lg:px-12">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Departments
                </span>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-2">
                  Shop by Category
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Discover carefully organized collections designed for everyday lifestyle
                </p>
              </div>
              <HomeCategory />
            </section>
          )}

          {/* 6. Professional Merchant Recruitment Banner */}
          <section className="px-4 lg:px-12">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 lg:p-14 shadow-lg">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
              <div className="relative z-10 max-w-xl space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/60">
                  Partner with Us
                </span>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Grow Your Storefront on E-COM
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join thousands of successful verified merchants and independent brands. Get instant buyer reach, dedicated merchant analytics, and automated payouts.
                </p>

                <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>0% Onboarding Fee</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Weekly Automated Payouts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Dedicated Merchant Hub</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={becomeSellerClick}
                    startIcon={isSeller ? <DashboardOutlinedIcon sx={{ fontSize: 16 }} /> : <StorefrontIcon sx={{ fontSize: 16 }} />}
                    variant="contained"
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 700,
                      px: 3.5,
                      py: '10px',
                      borderRadius: '10px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#F1F5F9',
                      },
                    }}
                  >
                    {isSeller ? 'Open Seller Dashboard' : 'Start Selling Today'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Floating AI Assistant Trigger */}
          <section className="fixed bottom-8 right-8 z-50">
            {showChatBot ? (
              <ChatBot handleClose={handleCloseChatBot} />
            ) : (
              <button
                type="button"
                onClick={handleShowChatBot}
                className="w-13 h-13 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 p-3 cursor-pointer border border-slate-700"
                aria-label="Ask Shopping Assistant"
              >
                <ChatBubbleIcon sx={{ fontSize: 22 }} />
              </button>
            )}
          </section>
        </div>
      ) : (
        <Backdrop open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </>
  );
};

export default Home;
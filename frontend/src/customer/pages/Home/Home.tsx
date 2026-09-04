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
        <div className="space-y-8 lg:space-y-12 relative pb-16">
          {/* 1. Top Product Category Buttons with Images */}
          {homePage.homePageData?.electricCategories && <ElectronicCategory />}

          {/* 2. Top Brands Editorial Mosaic */}
          {homePage.homePageData?.grid && (
            <section>
              <TopBrand />
            </section>
          )}

          {/* 3. Today's Exclusive Deals - Auto-scrolling Images Carousel */}
          {homePage.homePageData?.deals && (
            <section className="px-4 lg:px-12">
              <div className="flex flex-col sm:flex-row items-baseline justify-between mb-4 pb-2 border-b border-slate-200/80">
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

          {/* 4. Shop by Category - Circular Product Image Buttons */}
          {homePage.homePageData?.shopByCategories && (
            <section className="flex flex-col justify-center items-center py-6 px-4 lg:px-12">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Departments
                </span>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-2 uppercase">
                  Shop by Category
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Discover carefully organized collections designed for everyday lifestyle
                </p>
              </div>
              <HomeCategory />
            </section>
          )}

          {/* 5. Seller Banner Showcase with Image */}
          <section className="px-4 lg:px-12">
            <div className="relative rounded-3xl overflow-hidden min-h-[220px] lg:h-[450px] shadow-lg">
              <img
                className="w-full h-full object-cover"
                src="/seller_banner_image.jpg"
                alt="Seller banner"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent flex items-center">
                <div className="px-8 lg:px-16 text-white space-y-3">
                  <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight">
                    Sell Your Product
                  </h2>
                  <p className="text-base lg:text-2xl font-light text-slate-200">
                    With{' '}
                    <strong className="text-white font-black text-2xl lg:text-4xl pl-1">
                      E-COM
                    </strong>
                  </p>
                  <div className="pt-3">
                    <Button
                      onClick={becomeSellerClick}
                      startIcon={
                        isSeller ? (
                          <DashboardOutlinedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <StorefrontIcon sx={{ fontSize: 16 }} />
                        )
                      }
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
                      {isSeller ? 'Open Seller Dashboard' : 'Become Seller'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Floating AI Assistant Trigger */}
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
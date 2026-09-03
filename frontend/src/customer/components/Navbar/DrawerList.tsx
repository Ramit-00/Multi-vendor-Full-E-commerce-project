import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../Redux Toolkit/Store';

import { menLevelTwo } from '../../../data/category/level two/menLevelTwo';
import { menLevelThree } from '../../../data/category/level three/menLevelThree';
import { womenLevelTwo } from '../../../data/category/level two/womenLevelTwo';
import { womenLevelThree } from '../../../data/category/level three/womenLevelThree';
import { electronicsLevelTwo } from '../../../data/category/level two/electronicsLavelTwo';
import { electronicsLevelThree } from '../../../data/category/level three/electronicsLevelThree';
import { furnitureLevelTwo } from '../../../data/category/level two/furnitureLevleTwo';
import { furnitureLevelThree } from '../../../data/category/level three/furnitureLevelThree';

const categoryTwoMap: { [key: string]: any[] } = {
  men: menLevelTwo,
  women: womenLevelTwo,
  electronics: electronicsLevelTwo,
  home_furniture: furnitureLevelTwo,
};

const categoryThreeMap: { [key: string]: any[] } = {
  men: menLevelThree,
  women: womenLevelThree,
  electronics: electronicsLevelThree,
  home_furniture: furnitureLevelThree,
};

const departmentMeta: { [key: string]: { title: string; subtitle: string; icon: React.ReactNode; color: string } } = {
  men: {
    title: "Men's Collection",
    subtitle: "T-Shirts, Shirts, Trousers, Shoes & more",
    icon: <ManIcon sx={{ fontSize: 26, color: '#2563EB' }} />,
    color: '#2563EB',
  },
  women: {
    title: "Women's Collection",
    subtitle: "Ethnic Wear, Western, Footwear & Beauty",
    icon: <WomanIcon sx={{ fontSize: 26, color: '#EC4899' }} />,
    color: '#EC4899',
  },
  electronics: {
    title: "Electronics & Gadgets",
    subtitle: "Audio, Wearables, Accessories & Devices",
    icon: <DevicesOutlinedIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
    color: '#8B5CF6',
  },
  home_furniture: {
    title: "Home & Furniture",
    subtitle: "Living, Bedroom, Decor & Furnishing",
    icon: <WeekendOutlinedIcon sx={{ fontSize: 24, color: '#F59E0B' }} />,
    color: '#F59E0B',
  },
};

interface DrawerListProps {
  toggleDrawer: (open: boolean) => () => void;
}

const DrawerList: React.FC<DrawerListProps> = ({ toggleDrawer }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | false>('0');
  const navigate = useNavigate();
  const { sellers } = useAppSelector((store) => store);

  const isSeller = Boolean(
    localStorage.getItem('seller_jwt') &&
    localStorage.getItem('role') === 'ROLE_SELLER' &&
    sellers?.profile?._id &&
    sellers?.profile?.accountStatus !== 'CLOSED'
  );

  const handleSellerClick = () => {
    toggleDrawer(false)();
    if (isSeller) {
      navigate('/seller');
    } else {
      navigate('/become-seller');
    }
  };

  const handleItemClick = (categoryId: string) => {
    toggleDrawer(false)();
    navigate(`/products/${categoryId}`);
  };

  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? panel : false);
    };

  const getSubcategories = (parentCategoryId: string) => {
    const list = categoryThreeMap[selectedCategory] || [];
    return list.filter((child: any) => child.parentCategoryId === parentCategoryId);
  };

  const selectedMeta = departmentMeta[selectedCategory];

  return (
    <Box
      sx={{
        width: { xs: 320, sm: 380 },
        maxWidth: '92vw',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
      }}
      role="presentation"
    >
      {/* View 1: Top-Level Departments */}
      {!selectedCategory ? (
        <>
          {/* Drawer Header */}
          <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div
              onClick={() => {
                toggleDrawer(false)();
                navigate('/');
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                E
              </span>
              <div>
                <h1 className="text-xl font-black text-blue-900 tracking-tight leading-none">
                  E-COM
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                  Marketplace Directory
                </p>
              </div>
            </div>

            <IconButton
              size="small"
              onClick={toggleDrawer(false)}
              sx={{ color: '#64748B' }}
              aria-label="Close menu"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </div>

          {/* Department List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shop By Department
              </h2>
            </div>

            <div className="space-y-2.5">
              {/* Men */}
              <div
                onClick={() => {
                  setSelectedCategory('men');
                  setExpandedSection('0');
                }}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <ManIcon sx={{ fontSize: 26 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-900 transition-colors">
                      Men's Fashion
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      T-Shirts, Shirts, Trousers &amp; Footwear
                    </p>
                  </div>
                </div>
                <ChevronRightIcon sx={{ color: '#94A3B8' }} className="group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Women */}
              <div
                onClick={() => {
                  setSelectedCategory('women');
                  setExpandedSection('0');
                }}
                className="p-3.5 bg-slate-50 hover:bg-pink-50/70 border border-slate-200/80 hover:border-pink-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                    <WomanIcon sx={{ fontSize: 26 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-pink-900 transition-colors">
                      Women's Fashion
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ethnic, Western, Footwear &amp; Beauty
                    </p>
                  </div>
                </div>
                <ChevronRightIcon sx={{ color: '#94A3B8' }} className="group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Electronics */}
              <div
                onClick={() => {
                  setSelectedCategory('electronics');
                  setExpandedSection('0');
                }}
                className="p-3.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <DevicesOutlinedIcon sx={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-900 transition-colors">
                      Electronics &amp; Gadgets
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Audio, Wearables, Smart Accessories
                    </p>
                  </div>
                </div>
                <ChevronRightIcon sx={{ color: '#94A3B8' }} className="group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Home & Furniture */}
              <div
                onClick={() => {
                  setSelectedCategory('home_furniture');
                  setExpandedSection('0');
                }}
                className="p-3.5 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <WeekendOutlinedIcon sx={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition-colors">
                      Home &amp; Furniture
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Living Room, Decor &amp; Furnishings
                    </p>
                  </div>
                </div>
                <ChevronRightIcon sx={{ color: '#94A3B8' }} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Quick Customer Links */}
            <div className="pt-4 border-t border-slate-100 space-y-1">
              <div className="px-1 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick Access
                </h2>
              </div>
              <ListItemButton
                onClick={() => {
                  toggleDrawer(false)();
                  navigate('/account/orders');
                }}
                sx={{ borderRadius: '12px', py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#1E40AF' }}>
                  <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Track My Orders"
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#334155' }}
                />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  toggleDrawer(false)();
                  navigate('/wishlist');
                }}
                sx={{ borderRadius: '12px', py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#E11D48' }}>
                  <FavoriteBorderOutlinedIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Saved Wishlist"
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#334155' }}
                />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  toggleDrawer(false)();
                  navigate('/contact-us');
                }}
                sx={{ borderRadius: '12px', py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#059669' }}>
                  <SupportAgentOutlinedIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Help &amp; Support"
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#334155' }}
                />
              </ListItemButton>
            </div>
          </div>

          {/* Bottom Action: Seller Button */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Button
              fullWidth
              onClick={handleSellerClick}
              startIcon={isSeller ? <DashboardOutlinedIcon /> : <StorefrontIcon />}
              variant={isSeller ? 'contained' : 'outlined'}
              sx={{
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: isSeller ? '#1E40AF' : undefined,
                '&:hover': isSeller ? { backgroundColor: '#1E3A8A' } : undefined,
              }}
            >
              {isSeller ? 'Manage Dashboard' : 'Become Seller'}
            </Button>
          </div>
        </>
      ) : (
        /* View 2: Subcategories Drill-down */
        <>
          {/* Drill-down Header with Back Button */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <Button
              onClick={() => setSelectedCategory('')}
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{
                textTransform: 'none',
                color: '#1E40AF',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '8px',
              }}
            >
              All Categories
            </Button>

            <IconButton
              size="small"
              onClick={toggleDrawer(false)}
              sx={{ color: '#64748B' }}
              aria-label="Close menu"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </div>

          {/* Department Banner & "View All" */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                {selectedMeta?.icon}
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">
                  {selectedMeta?.title}
                </h2>
                <p className="text-[10px] text-slate-300">
                  Select a category to browse products
                </p>
              </div>
            </div>

            <Chip
              label="View All"
              size="small"
              onClick={() => handleItemClick(selectedCategory)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              }}
            />
          </div>

          {/* Subcategories Accordion List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(categoryTwoMap[selectedCategory] || []).map((levelTwoItem: any, idx: number) => {
              const children = getSubcategories(levelTwoItem.categoryId);
              const panelKey = String(idx);
              const isExpanded = expandedSection === panelKey;

              return (
                <Accordion
                  key={levelTwoItem.categoryId || idx}
                  expanded={isExpanded}
                  onChange={handleAccordionChange(panelKey)}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px !important',
                    mb: '8px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    bgcolor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#64748B' }} />}
                    sx={{
                      px: 2,
                      py: 0.5,
                      minHeight: 48,
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mr: 1,
                      },
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                        {levelTwoItem.name}
                      </Typography>
                    </div>
                    {children.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {children.length}
                      </span>
                    )}
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2, pt: 0, pb: 2, bgcolor: '#FFFFFF' }}>
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      {children.length > 0 ? (
                        children.map((child: any) => (
                          <div
                            key={child.categoryId || child.name}
                            onClick={() => handleItemClick(child.categoryId)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-800 hover:bg-blue-50/80 transition-all cursor-pointer group"
                          >
                            <span>{child.name}</span>
                            <ArrowForwardIosIcon
                              sx={{ fontSize: 10, color: '#CBD5E1' }}
                              className="group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={() => handleItemClick(levelTwoItem.categoryId)}
                          className="px-3 py-2 text-xs text-blue-700 font-semibold hover:bg-blue-50 rounded-xl cursor-pointer"
                        >
                          Browse {levelTwoItem.name} &rarr;
                        </div>
                      )}
                    </div>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </div>

          {/* Subcategory bottom footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <Button
              onClick={() => setSelectedCategory('')}
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: '#475569', fontWeight: 600 }}
            >
              Back to Departments
            </Button>
            <span className="text-[11px] text-slate-400">E-COM Store</span>
          </div>
        </>
      )}
    </Box>
  );
};

export default DrawerList;
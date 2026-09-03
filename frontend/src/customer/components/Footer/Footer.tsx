import React from 'react';
import { Link } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base">
                E
              </span>
              <h5 className="text-xl font-black tracking-tight text-white">E-COM</h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier multi-vendor marketplace connecting verified independent merchants, artisans, and brand sellers directly with customers nationwide.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <VerifiedUserOutlinedIcon sx={{ fontSize: 14 }} />
              <span>100% Verified Marketplace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h6 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Quick Navigation
            </h6>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Marketplace & Categories */}
          <div className="space-y-3">
            <h6 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Marketplace
            </h6>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/become-seller" className="hover:text-white transition-colors flex items-center gap-1">
                  <StorefrontIcon sx={{ fontSize: 14, color: '#60A5FA' }} />
                  <span>Become a Seller</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-white transition-colors">
                  Track My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h6 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Customer Support
            </h6>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <PhoneInTalkOutlinedIcon sx={{ fontSize: 16, color: '#60A5FA' }} />
                <span>1800-123-ECOM (3266)</span>
              </div>
              <div className="flex items-center gap-2">
                <EmailOutlinedIcon sx={{ fontSize: 16, color: '#60A5FA' }} />
                <span>support@ecom.com</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Operating Hours: Mon &ndash; Sat: 9:00 AM &ndash; 8:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} E-COM Marketplace. All rights reserved.</p>
          <ul className="flex items-center gap-6">
            <li>
              <Link to="/about" className="hover:text-slate-300 transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-slate-300 transition-colors">
                Services
              </Link>
            </li>
            <li>
              <Link to="/contact-us" className="hover:text-slate-300 transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
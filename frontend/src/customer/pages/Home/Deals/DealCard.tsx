import { useNavigate } from 'react-router-dom';
import type { Deal } from '../../../../types/dealTypes';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const DealCard = ({ deal }: { deal: Deal }) => {
  const navigate = useNavigate();
  const categoryLabel = deal.category?.categoryId
    ? deal.category.categoryId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Special Collection';

  return (
    <div
      onClick={() => navigate(`/products/${deal.category.categoryId}`)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Image Area with Zoom & Pill */}
      <div className="relative w-full h-[18rem] bg-slate-100 overflow-hidden">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
          src={deal.category.image}
          alt={categoryLabel}
          loading="lazy"
        />

        {/* Gradient Scrim for subtle contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Discount Badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-tight bg-slate-900 text-white shadow-md">
            {deal.discount}% OFF
          </span>
        </div>
      </div>

      {/* Card Information Footer */}
      <div className="p-4 bg-white flex items-center justify-between border-t border-slate-100">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Limited Time Offer
          </p>
          <h3 className="font-bold text-slate-900 text-base tracking-tight group-hover:text-blue-700 transition-colors">
            {categoryLabel}
          </h3>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors text-slate-700">
          <ArrowForwardIcon sx={{ fontSize: 16 }} className="transform group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default DealCard;
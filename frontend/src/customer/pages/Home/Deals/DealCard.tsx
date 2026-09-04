import { useNavigate } from 'react-router-dom';
import type { Deal } from '../../../../types/dealTypes';

const DealCard = ({ deal }: { deal: Deal }) => {
  const navigate = useNavigate();
  const categoryLabel = deal.category?.name || (deal.category?.categoryId
    ? deal.category.categoryId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Featured Deal');

  return (
    <div
      onClick={() => navigate(`/products/${deal.category?.categoryId || ''}`)}
      className="w-[12rem] sm:w-[13.5rem] mx-auto cursor-pointer group rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white border border-slate-200"
    >
      <div className="relative w-full h-[12rem] sm:h-[13rem] bg-slate-100 overflow-hidden">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          src={deal.category?.image}
          alt={categoryLabel}
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-blue-700 text-white font-black text-xs px-2.5 py-1 rounded-full shadow">
          {deal.discount}% OFF
        </div>
      </div>
      <div className="p-3 bg-slate-900 text-white text-center group-hover:bg-blue-900 transition-colors">
        <p className="font-bold text-sm tracking-tight truncate">{categoryLabel}</p>
        <p className="text-xs uppercase tracking-wider font-semibold text-blue-200 mt-0.5">Shop Now &rarr;</p>
      </div>
    </div>
  );
};

export default DealCard;
import { useNavigate } from 'react-router-dom';

const ElectronicCategoryCard = ({ item }: any) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="flex flex-col items-center gap-2 cursor-pointer group px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center p-2 border border-slate-200/70 group-hover:border-slate-400 group-hover:shadow-sm transition-all duration-200">
        <img
          className="object-contain max-h-9 max-w-9 group-hover:scale-110 transition-transform duration-200"
          src={item.image}
          alt={item.name}
          loading="lazy"
        />
      </div>
      <span className="font-semibold text-xs text-slate-700 group-hover:text-slate-900 whitespace-nowrap tracking-tight">
        {item.name}
      </span>
    </div>
  );
};

export default ElectronicCategoryCard;
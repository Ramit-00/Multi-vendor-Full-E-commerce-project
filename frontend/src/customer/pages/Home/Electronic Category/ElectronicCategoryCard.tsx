import { useNavigate } from 'react-router-dom';

const ElectronicCategoryCard = ({ item }: any) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="flex flex-col items-center gap-2 cursor-pointer group p-2 rounded-xl transition-all duration-300"
    >
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center p-3 border-2 border-slate-200/90 group-hover:border-blue-700 group-hover:bg-blue-50/40 group-hover:shadow-md transition-all duration-300">
        <img
          className="object-contain max-h-10 max-w-10 group-hover:scale-110 transition-transform duration-300"
          src={item.image}
          alt={item.name}
          loading="lazy"
        />
      </div>
      <h2 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-blue-900 transition-colors text-center whitespace-nowrap tracking-tight">
        {item.name}
      </h2>
    </div>
  );
};

export default ElectronicCategoryCard;
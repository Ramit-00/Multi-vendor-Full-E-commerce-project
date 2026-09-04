import './HomeCategoryCard.css';
import { useNavigate } from 'react-router-dom';

const HomeCategoryCard = ({ item }: any) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="flex flex-col items-center gap-3 group cursor-pointer p-2"
    >
      <div className="custom-border w-[140px] sm:w-[170px] lg:w-[210px] h-[140px] sm:h-[170px] lg:h-[210px] rounded-full bg-slate-100 overflow-hidden shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500 ease-out"
          src={item.image}
          alt={item.name}
          loading="lazy"
        />
      </div>
      <span className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-900 transition-colors tracking-tight text-center">
        {item.name}
      </span>
    </div>
  );
};

export default HomeCategoryCard;
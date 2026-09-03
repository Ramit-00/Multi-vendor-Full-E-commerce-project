import ElectronicCategoryCard from "./ElectronicCategoryCard";
import { useMediaQuery } from "@mui/material";
import { useAppSelector } from "../../../../Redux Toolkit/Store";

const ElectronicCategory = () => {
  const { homePage } = useAppSelector((store) => store);
  const isSmallScreen = useMediaQuery("(max-width:640px)");
  const categories = homePage.homePageData?.electricCategories || [];

  if (categories.length === 0) return null;

  return (
    <div className="px-4 lg:px-12 py-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-4 sm:gap-6">
          {categories
            .slice(0, isSmallScreen ? 5 : categories.length)
            .map((item, index) => (
              <ElectronicCategoryCard key={index} item={item} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ElectronicCategory;

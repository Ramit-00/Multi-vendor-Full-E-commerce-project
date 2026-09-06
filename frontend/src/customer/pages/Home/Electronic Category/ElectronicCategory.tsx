import ElectronicCategoryCard from "./ElectronicCategoryCard";
import { useMediaQuery } from "@mui/material";
import { useAppSelector } from "../../../../Redux Toolkit/Store";

const ElectronicCategory = () => {
  const { homePage } = useAppSelector((store) => store);
  const isSmallScreen = useMediaQuery("(max-width:640px)");
  const rawCategories = homePage.homePageData?.electricCategories || [];
  // Ensure strict uniqueness so categories like Headphones or Smartwatch never duplicate
  const seen = new Set<string>();
  const categories = rawCategories.filter((item: any) => {
    const key = String(item.categoryId || item.name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (categories.length === 0) return null;

  return (
    <div className="px-4 lg:px-12 pt-4 pb-2">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center justify-around flex-wrap gap-3 sm:gap-6">
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

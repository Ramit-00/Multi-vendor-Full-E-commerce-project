import { menLevelThree } from "../../../data/category/level three/menLevelThree";
import { menLevelTwo } from "../../../data/category/level two/menLevelTwo";
import { womenLevelThree } from "../../../data/category/level three/womenLevelThree";
import { womenLevelTwo } from "../../../data/category/level two/womenLevelTwo";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { electronicsLevelTwo } from "../../../data/category/level two/electronicsLavelTwo";
import { furnitureLevelTwo } from "../../../data/category/level two/furnitureLevleTwo";
import { furnitureLevelThree } from "../../../data/category/level three/furnitureLevelThree";
import { electronicsLevelThree } from "../../../data/category/level three/electronicsLevelThree";

const categoryTwo: { [key: string]: any[] } = {
  men: menLevelTwo,
  women: womenLevelTwo,
  electronics: electronicsLevelTwo,
  home_furniture: furnitureLevelTwo,
};

const categoryThree: { [key: string]: any[] } = {
  men: menLevelThree,
  women: womenLevelThree,
  electronics: electronicsLevelThree,
  home_furniture: furnitureLevelThree,
};

const CategorySheet = ({
  selectedCategory,
  toggleDrawer,
  setShowSheet,
}: any) => {
  const navigate = useNavigate();

  const childCategory = (category: any, parentCategoryId: any) => {
    return (category || []).filter((child: any) => {
      return child.parentCategoryId === parentCategoryId;
    });
  };

  const handleCategoryClick = (category: string) => {
    if (toggleDrawer) {
      toggleDrawer(false)();
    }
    if (setShowSheet) {
      setShowSheet(false);
    }
    navigate("/products/" + category);
  };

  return (
    <Box className="bg-white shadow-lg max-h-[500px] overflow-y-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categoryTwo[selectedCategory]?.map((item: any) => (
          <div
            key={item.name}
            className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3"
          >
            <p className="text-blue-900 font-extrabold tracking-wider uppercase text-xs border-b border-slate-200 pb-1.5">
              {item.name}
            </p>

            <ul className="space-y-2">
              {childCategory(
                categoryThree[selectedCategory],
                item.categoryId
              )?.map((subItem: any) => (
                <li
                  key={subItem.categoryId || subItem.name}
                  onClick={() => handleCategoryClick(subItem.categoryId)}
                  className="text-xs font-medium text-slate-700 hover:text-blue-700 hover:translate-x-1 transition-all cursor-pointer py-0.5"
                >
                  {subItem.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Box>
  );
};

export default CategorySheet;

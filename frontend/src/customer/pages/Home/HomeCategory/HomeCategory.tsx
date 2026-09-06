
import HomeCategoryCard from './HomeCategoryCard'
import { useAppSelector } from '../../../../Redux Toolkit/Store';


const HomeCategory = () => {
  const { homePage } = useAppSelector((store) => store);
  const rawCategories = homePage.homePageData?.shopByCategories || [];
  const seen = new Set<string>();
  const categories = rawCategories.filter((item: any) => {
    const key = String(item.categoryId || item.name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className='flex justify-center gap-7 flex-wrap '>
        {categories.map((item, index) => (
          <HomeCategoryCard key={index} item={item} />
        ))}
    </div>
  );
};

export default HomeCategory
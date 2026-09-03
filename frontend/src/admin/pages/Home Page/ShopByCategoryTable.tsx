import HomeCategoryTable from './HomeCategoryTable'
import { useAppSelector } from '../../../Redux Toolkit/Store';

const ShopByCategoryTable = () => {
    const { homePage } = useAppSelector((store) => store);
  return (
    <HomeCategoryTable categories={homePage.homePageData?.shopByCategories}/>
  )
}

export default ShopByCategoryTable
// types.ts
// export interface HomeData {
//     id: string;
//     title: string;
//     description: string;
//     imageUrl: string;
//   }

interface Deal{
  category:HomeCategory;
  discount:number;
}

export interface HomeData {
  _id: number; 
  grid: HomeCategory[]; 
  shopByCategories: HomeCategory[]; 
  electricCategories: HomeCategory[]; 
  deals: Deal[]; 
  dealCategories:HomeCategory[];
}
  
  export interface HomeCategory {
    _id?:number;
    categoryId: string;
    section?: string;
    name?: string;
    image: string;
    parentCategoryId?: string;
  }
  
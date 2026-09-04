// homeSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createHomeCategories, fetchHomePageData } from './AsyncThunk';
import { type HomeCategory, type HomeData } from '../../../types/homeDataTypes';

import { homeCategories } from '../../../data/homeCategories';

const defaultHomePageData: HomeData = {
  _id: 1,
  electricCategories: homeCategories.filter((c) => c.section === 'ELECTRIC_CATEGORIES') as any,
  grid: homeCategories.filter((c) => c.section === 'GRID') as any,
  shopByCategories: homeCategories.filter((c) => c.section === 'SHOP_BY_CATEGORIES') as any,
  deals: homeCategories.filter((c) => c.section === 'DEALS').map((cat, idx) => ({
    _id: `default_deal_${idx}`,
    discount: [20, 30, 40, 50, 15, 25][idx % 6],
    category: cat as any,
  })),
  dealCategories: homeCategories.filter((c) => c.section === 'DEALS') as any,
};

interface HomeState {
  homePageData: HomeData | null;
  homeCategories: HomeCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: HomeState = {
  homePageData: defaultHomePageData,
  homeCategories: [],
  loading: false,
  error: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handle fetchHomePageData lifecycle
    builder.addCase(fetchHomePageData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchHomePageData.fulfilled, (state, action: PayloadAction<HomeData>) => {
      state.loading = false;
      state.homePageData = action.payload;
    });
    builder.addCase(fetchHomePageData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load home page data';
    });

    // Handle createHomeCategories lifecycle
    builder.addCase(createHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.homePageData = action.payload;
    });
    builder.addCase(createHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create home categories';
    });
  },
});

export default homeSlice.reducer;

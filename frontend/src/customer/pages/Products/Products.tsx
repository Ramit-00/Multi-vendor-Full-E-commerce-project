import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard/ProductCard";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { getAllProducts } from "../../../Redux Toolkit/Customer/ProductSlice";
import FilterSection from "./FilterSection";

const Products = () => {
  const [sort, setSort] = React.useState("");
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((store) => store);
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSortProduct = (event: SelectChangeEvent) => {
    setSort(event.target.value as string);
  };

  const handlePageChange = (value: any) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const [minPrice, maxPrice] = searchParams.get("price")?.split("-") || [];
    const newFilters = {
      brand: searchParams.get("brand") || "",
      color: searchParams.get("color") || "",
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      pageNumber: page - 1,
      minDiscount: searchParams.get("discount")
        ? Number(searchParams.get("discount"))
        : undefined,
    };

    dispatch(getAllProducts({ category: categoryId, sort, ...newFilters }));
  }, [searchParams, categoryId, sort, page, dispatch]);

  const displayCategoryName = categoryId
    ? categoryId.replace(/_/g, " ").toUpperCase()
    : "ALL PRODUCTS";

  return (
    <div className="min-h-screen px-4 lg:px-12 py-8 bg-[#FAFAFA]">
      {/* Breadcrumb and Header Banner */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
          <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate("/")}>Home</span>
          <span>/</span>
          <span className="text-slate-600">Products</span>
          <span>/</span>
          <span className="text-slate-900">{displayCategoryName}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {displayCategoryName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing <span className="font-semibold text-slate-700">{products.products?.length || 0}</span> products
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <Button
              onClick={() => setMobileDrawerOpen(true)}
              variant="outlined"
              startIcon={<FilterListIcon />}
              className="lg:hidden"
              sx={{ textTransform: "none", borderColor: "#CBD5E1", color: "#334155" }}
            >
              Filters
            </Button>

            {/* Sort selector */}
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                id="sort-select"
                value={sort}
                label="Sort by"
                onChange={handleSortProduct}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <MenuItem value="">Featured</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </div>

      {/* Main Layout: Desktop Sidebar + Product Grid */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-6 sticky top-24">
          {/* Category Navigation Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
              <CategoryIcon sx={{ fontSize: 18, color: "#0F172A" }} />
              <span>Categories</span>
            </div>
            <Divider sx={{ mb: 2 }} />
            <div className="space-y-1">
              <div
                onClick={() => navigate('/products/all')}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                  !categoryId || categoryId === 'all'
                    ? "bg-slate-100 text-slate-900 font-bold border-l-4 border-slate-900 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                }`}
              >
                <span>All Products</span>
                {(!categoryId || categoryId === 'all') && <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>}
              </div>

              {/* Men Category */}
              <div className="pt-2">
                <div
                  onClick={() => navigate('/products/men')}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                    categoryId === 'men'
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span>Men's Fashion</span>
                  {categoryId === 'men' && <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>}
                </div>
                <div className="pl-4 space-y-0.5 mt-0.5">
                  <div
                    onClick={() => navigate('/products/men_t_shirts')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'men_t_shirts'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• T-Shirts</span>
                  </div>
                  <div
                    onClick={() => navigate('/products/men_casual_shirts')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'men_casual_shirts' || categoryId === 'men_formal_shirts'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Formal & Casual Shirts</span>
                  </div>
                </div>
              </div>

              {/* Women Category */}
              <div className="pt-2">
                <div
                  onClick={() => navigate('/products/women')}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                    categoryId === 'women'
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span>Women's Fashion</span>
                  {categoryId === 'women' && <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>}
                </div>
                <div className="pl-4 space-y-0.5 mt-0.5">
                  <div
                    onClick={() => navigate('/products/sarees')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'sarees'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Sarees Collection</span>
                  </div>
                  <div
                    onClick={() => navigate('/products/women_indian_and_fusion_wear')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'women_indian_and_fusion_wear'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Indian & Fusion Wear</span>
                  </div>
                </div>
              </div>

              {/* Electronics Category */}
              <div className="pt-2">
                <div
                  onClick={() => navigate('/products/electronics')}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                    categoryId === 'electronics'
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span>Electronics & Gadgets</span>
                  {categoryId === 'electronics' && <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>}
                </div>
                <div className="pl-4 space-y-0.5 mt-0.5">
                  <div
                    onClick={() => navigate('/products/mobiles')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'mobiles'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Mobile Phones</span>
                  </div>
                  <div
                    onClick={() => navigate('/products/smart_watches')}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      categoryId === 'smart_watches'
                        ? "text-blue-700 font-bold bg-blue-50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Smart Watches</span>
                  </div>
                </div>
              </div>

              {/* Home & Furniture */}
              <div className="pt-2">
                <div
                  onClick={() => navigate('/products/home_furniture')}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                    categoryId === 'home_furniture' || categoryId === 'furniture'
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span>Home & Furniture</span>
                  {(categoryId === 'home_furniture' || categoryId === 'furniture') && <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>}
                </div>
              </div>

              {/* Wedding Special */}
              <div className="pt-2">
                <div
                  onClick={() => navigate('/products/shop_for_wedding')}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${
                    categoryId === 'shop_for_wedding'
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span>Wedding & Festive</span>
                  {categoryId === 'shop_for_wedding' && <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
            <FilterSection />
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        >
          <Box sx={{ width: 300, p: 3 }} role="presentation">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h2 className="text-lg font-bold text-blue-900">Filters & Categories</h2>
              <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </div>
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</h3>
              <div className="space-y-1">
                {[
                  { name: "All Products", id: "all" },
                  { name: "Men: T-Shirts", id: "men_t_shirts" },
                  { name: "Men: Shirts", id: "men_casual_shirts" },
                  { name: "Women: Sarees", id: "sarees" },
                  { name: "Women: Fusion Wear", id: "women_indian_and_fusion_wear" },
                  { name: "Electronics: Mobiles", id: "mobiles" },
                  { name: "Electronics: Smart Watches", id: "smart_watches" },
                  { name: "Home: Furniture & Runners", id: "home_furniture" },
                  { name: "Wedding & Festive", id: "shop_for_wedding" }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      navigate(`/products/${item.id}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      categoryId === item.id || (!categoryId && item.id === 'all')
                        ? "bg-blue-50 text-blue-900 border-l-4 border-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
            <Divider sx={{ mb: 4 }} />
            <FilterSection />
          </Box>
        </Drawer>

        {/* Products Grid / Results Area */}
        <main className="flex-1 min-w-0">
          {products.loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
            </div>
          ) : products.products && products.products.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {products.products.map((item: any) => (
                  <ProductCard key={item._id} item={item} categoryId={categoryId} />
                ))}
              </div>

              {/* Pagination */}
              {products.totalPages && products.totalPages > 1 && (
                <div className="flex justify-center pt-12 pb-6">
                  <Pagination
                    page={page}
                    onChange={(_, value) => handlePageChange(value)}
                    color="primary"
                    count={products.totalPages}
                    shape="rounded"
                    size="large"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Modern Empty State */
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto mt-6 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
                <Inventory2OutlinedIcon sx={{ fontSize: 38 }} />
              </div>

              <div className="inline-block px-3 py-1 mb-3 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Inventory Stock Notice
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2.5">
                No Products Available
              </h2>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
                There are currently no products available in <span className="font-bold text-slate-800">{displayCategoryName}</span> right now. We are actively restocking and expanding inventory for this category.
              </p>

              {/* Quick links to categories with products in stock */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 mb-6 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center sm:text-left">
                  Explore Active Collections In Stock:
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {[
                    { label: "👔 Men's Shirts", path: "/products/men_casual_shirts" },
                    { label: "👕 Men's T-Shirts", path: "/products/men_t_shirts" },
                    { label: "📱 Mobile Phones", path: "/products/mobiles" },
                    { label: "⌚ Smart Watches", path: "/products/smart_watches" },
                    { label: "🥻 Sarees & Ethnic", path: "/products/sarees" },
                    { label: "🛋️ Home & Furniture", path: "/products/home_furniture" },
                  ].map((cat) => (
                    <button
                      key={cat.path}
                      onClick={() => navigate(cat.path)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700 hover:shadow-xs transition-all cursor-pointer"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="contained"
                  onClick={() => navigate("/products/all")}
                  sx={{
                    backgroundColor: "#0F172A",
                    "&:hover": { backgroundColor: "#1E293B" },
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: "10px",
                    borderRadius: "10px"
                  }}
                >
                  Browse All Products
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{
                    borderColor: "#CBD5E1",
                    color: "#0F172A",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: "10px",
                    borderRadius: "10px",
                    "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" }
                  }}
                >
                  Return to Home
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;

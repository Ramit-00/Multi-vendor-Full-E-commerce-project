import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { searchProduct } from "../../../Redux Toolkit/Customer/ProductSlice";
import ProductCard from "../Products/ProductCard/ProductCard";
import SearchIcon from "@mui/icons-material/Search";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import WatchOutlinedIcon from "@mui/icons-material/WatchOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import ChairOutlinedIcon from "@mui/icons-material/ChairOutlined";
import { CircularProgress, Button } from "@mui/material";

const POPULAR_SEARCHES = [
  "Men's Shirts",
  "Smart Watches",
  "Sarees",
  "Mobiles",
  "T-Shirts",
  "Titan",
  "Louis Philippe",
  "Home Runners",
];

const FEATURED_CATEGORIES = [
  {
    title: "Men's Collection",
    subtitle: "Tailored shirts, casual tees & formal wear",
    path: "/products/men",
    icon: <CheckroomOutlinedIcon sx={{ fontSize: 24 }} />,
    tag: "Trending",
  },
  {
    title: "Women's Sarees & Ethnic",
    subtitle: "Banarasi, Pure Chiffon & Silk ensembles",
    path: "/products/women",
    icon: <ShoppingBagOutlinedIcon sx={{ fontSize: 24 }} />,
    tag: "Artisan",
  },
  {
    title: "Smartwatches & Gadgets",
    subtitle: "Titan, BoAt & AMOLED fitness devices",
    path: "/products/electronics",
    icon: <WatchOutlinedIcon sx={{ fontSize: 24 }} />,
    tag: "High Tech",
  },
  {
    title: "Smartphones & 5G",
    subtitle: "Flagship AMOLED screens & fast gaming",
    path: "/products/electronics",
    icon: <SmartphoneOutlinedIcon sx={{ fontSize: 24 }} />,
    tag: "Flagship",
  },
  {
    title: "Home & Furniture",
    subtitle: "Handwoven runners, artisan textiles & decor",
    path: "/products/home_furniture",
    icon: <ChairOutlinedIcon sx={{ fontSize: 24 }} />,
    tag: "Living",
  },
];

const SearchProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((store) => store);

  const urlQuery = (searchParams.get("query") || searchParams.get("q") || "").trim();

  // Dispatch search whenever the URL query changes
  useEffect(() => {
    if (urlQuery) {
      dispatch(searchProduct(urlQuery));
    }
  }, [urlQuery, dispatch]);

  // Quick-search via popular pills (updates URL → triggers useEffect above)
  const handlePillClick = (term: string) => {
    setSearchParams({ query: term });
  };

  const handleClear = () => {
    setSearchParams({});
  };

  const searchResults = products.searchProduct || [];
  const isLoading = products.loading;
  const hasSearched = Boolean(urlQuery);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">

      {/* ── Slim top bar: breadcrumb + popular pills ── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Left: breadcrumb / query label */}
          <div className="shrink-0">
            {hasSearched ? (
              <p className="text-sm text-slate-500 font-medium">
                Results for{" "}
                <span className="font-bold text-slate-900">"{urlQuery}"</span>
                <button
                  onClick={handleClear}
                  className="ml-2 text-xs text-slate-400 hover:text-red-500 underline transition-colors"
                >
                  Clear
                </button>
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-700">Search Results</p>
            )}
          </div>

          {/* Right: popular pill filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-4">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              <LocalOfferOutlinedIcon sx={{ fontSize: 12 }} />
              Popular:
            </span>
            {POPULAR_SEARCHES.map((term) => {
              const isActive = urlQuery.toLowerCase() === term.toLowerCase();
              return (
                <button
                  key={term}
                  type="button"
                  onClick={() => handlePillClick(term)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  {term}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">

        {/* State 1: Loading */}
        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <CircularProgress size={36} sx={{ color: "#0F172A" }} />
            <p className="text-sm font-semibold text-slate-500">Searching catalog…</p>
          </div>

        ) : hasSearched && searchResults.length > 0 ? (
          /* State 2: Products found */
          <div className="space-y-5">
            {/* Result count header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                <span className="text-blue-700">{searchResults.length}</span>{" "}
                {searchResults.length === 1 ? "product" : "products"} found
              </h2>
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all"
              >
                Clear results
              </button>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {searchResults.map((item: any, idx: number) => (
                <div key={item._id || item.id || idx}>
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          </div>

        ) : hasSearched && searchResults.length === 0 ? (
          /* State 3: No results */
          <div className="max-w-xl mx-auto py-16 space-y-8">
            {/* Empty state card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                <SearchIcon sx={{ fontSize: 28, color: "#94A3B8" }} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  No results for "{urlQuery}"
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Try a different keyword — e.g. <em>"shirt"</em>, <em>"watch"</em>, or a brand name like <em>"Titan"</em>.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Button
                  onClick={handleClear}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: "#CBD5E1", color: "#334155", textTransform: "none",
                    fontWeight: 700, borderRadius: "8px",
                    "&:hover": { borderColor: "#94A3B8", backgroundColor: "#F8FAFC" },
                  }}
                >
                  Clear Search
                </Button>
                <Button
                  onClick={() => navigate("/products/all")}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "#0F172A", "&:hover": { backgroundColor: "#1E293B" },
                    textTransform: "none", fontWeight: 700, borderRadius: "8px",
                    boxShadow: "none",
                  }}
                >
                  Browse All Products
                </Button>
              </div>
            </div>

            {/* Category suggestions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Explore Collections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURED_CATEGORIES.map((cat) => (
                  <div
                    key={cat.title}
                    onClick={() => navigate(cat.path)}
                    className="p-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:[&>*]:text-white transition-colors">
                        {cat.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors leading-tight">
                          {cat.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{cat.subtitle}</p>
                      </div>
                    </div>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: "#CBD5E1" }} className="group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* State 4: Initial landing — no query yet */
          <div className="max-w-4xl mx-auto space-y-6 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Featured Departments</h2>
              <p className="text-xs text-slate-500 mt-0.5">Discover top categories available right now</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURED_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  onClick={() => navigate(cat.path)}
                  className="p-5 bg-white border border-slate-200/80 rounded-xl hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:[&>*]:text-white transition-colors">
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                          {cat.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {cat.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>
                    </div>
                  </div>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: "#CBD5E1" }} className="group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchProducts;
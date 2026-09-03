import { ArrowBack } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import FilterSection from "./FilterSection";

const ProductFilter = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/products/${categoryId}`)}
        >
          Back to products
        </Button>
        <h1 className="text-xl font-bold text-gray-700">Filter Products</h1>
      </div>
      <FilterSection />
      <Button
        fullWidth
        variant="contained"
        onClick={() => navigate(`/products/${categoryId}`)}
        sx={{ mt: 3, backgroundColor: "#90CAF9", color: "#0D47A1", "&:hover": { backgroundColor: "#64B5F6" } }}
      >
        Apply Filters
      </Button>
    </main>
  );
};

export default ProductFilter;

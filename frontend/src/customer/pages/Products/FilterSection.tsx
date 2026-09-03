import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { colors } from "../../../data/Filter/color";
import { price } from "../../../data/Filter/price";
import { discount } from "../../../data/Filter/discount";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";

const FilterSection = () => {
  const [expendColor, setExpendColor] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleExpendColor = () => {
    setExpendColor(!expendColor);
  };

  const updateFilterParams = (e: any) => {
    const { value, name } = e.target;
    if (value) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    searchParams.forEach((_value: string, key: string) => {
      searchParams.delete(key);
    });
    setSearchParams(searchParams);
  };

  const currentColor = searchParams.get("color") || "";
  const currentPrice = searchParams.get("price") || "";
  const currentDiscount = searchParams.get("discount") || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-base font-bold text-slate-800">Filters</h3>
        {(currentColor || currentPrice || currentDiscount) && (
          <Button
            onClick={clearAllFilters}
            size="small"
            sx={{ textTransform: "none", fontSize: "12px", color: "#1E40AF" }}
          >
            Clear all
          </Button>
        )}
      </div>
      <Divider />

      <div className="space-y-5">
        {/* Color Section */}
        <section>
          <FormControl fullWidth>
            <FormLabel
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1E293B",
                mb: 1,
                "&.Mui-focused": { color: "#1E40AF" },
              }}
              id="color-label"
            >
              Color
            </FormLabel>
            <RadioGroup
              onChange={updateFilterParams}
              aria-labelledby="color-label"
              value={currentColor}
              name="color"
            >
              {colors
                .slice(0, expendColor ? colors.length : 5)
                .map((item) => (
                  <FormControlLabel
                    sx={{ fontSize: "13px", my: 0.2 }}
                    key={item.name}
                    value={item.name}
                    control={<Radio size="small" color="primary" />}
                    label={
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: item.hex }}
                          className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-inner"
                        />
                        <span className="text-sm text-slate-700">{item.name}</span>
                      </div>
                    }
                  />
                ))}
            </RadioGroup>
          </FormControl>
          <div>
            <button
              type="button"
              onClick={handleExpendColor}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 mt-1 cursor-pointer"
            >
              {expendColor ? "Show less" : `+ ${colors.length - 5} more`}
            </button>
          </div>
        </section>

        <Divider />

        {/* Price Section */}
        <section>
          <FormControl fullWidth>
            <FormLabel
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1E293B",
                mb: 1,
                "&.Mui-focused": { color: "#1E40AF" },
              }}
              id="price-label"
            >
              Price Range
            </FormLabel>
            <RadioGroup
              name="price"
              onChange={updateFilterParams}
              aria-labelledby="price-label"
              value={currentPrice}
            >
              {price.map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.value}
                  control={<Radio size="small" color="primary" />}
                  label={<span className="text-sm text-slate-700">{item.name}</span>}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>

        <Divider />

        {/* Discount Section */}
        <section>
          <FormControl fullWidth>
            <FormLabel
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1E293B",
                mb: 1,
                "&.Mui-focused": { color: "#1E40AF" },
              }}
              id="discount-label"
            >
              Discount
            </FormLabel>
            <RadioGroup
              name="discount"
              onChange={updateFilterParams}
              aria-labelledby="discount-label"
              value={currentDiscount}
            >
              {discount.map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.value}
                  control={<Radio size="small" color="primary" />}
                  label={<span className="text-sm text-slate-700">{item.name}</span>}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>
      </div>
    </div>
  );
};

export default FilterSection;

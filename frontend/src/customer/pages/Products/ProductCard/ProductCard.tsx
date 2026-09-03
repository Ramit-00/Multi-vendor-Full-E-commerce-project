import "./ProductCard.css";
import React, { useState, useEffect } from "react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { Box, IconButton, Modal, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../../../types/productTypes";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { addProductToWishlist } from "../../../../Redux Toolkit/Customer/WishlistSlice";
import { isWishlisted } from "../../../../util/isWishlisted";
import ChatBot from "../../ChatBot/ChatBot";
import { normalizeImageUrl } from "../../../../util/imageUtil";

interface ProductCardProps {
  item: Product;
  categoryId?: string;
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "auto",
  borderRadius: ".75rem",
  boxShadow: 24,
  outline: "none",
};

const ProductCard: React.FC<ProductCardProps> = ({ item, categoryId = "all" }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { wishlist } = useAppSelector((store) => store);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showChatBot, setShowChatBot] = useState(false);

  const handleAddWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (item._id) dispatch(addProductToWishlist({ productId: item._id, product: item }));
  };

  const images = item.images && item.images.length > 0 ? item.images : [""];

  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage + 1) % images.length);
      }, 1200);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleShowChatBot = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowChatBot(true);
  };

  const handleCloseChatBot = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setShowChatBot(false);
  };

  const isItemWishlisted = wishlist.wishlist ? isWishlisted(wishlist.wishlist, item) : false;

  return (
    <>
      <div
        onClick={() =>
          navigate(`/product-details/${categoryId}/${encodeURIComponent(item.title || "product")}/${item._id}`)
        }
        className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImage(0);
        }}
      >
        {/* Card Image Area */}
        <div className="relative w-full h-[280px] bg-slate-50 overflow-hidden">
          {images.map((img: string, index: number) => (
            <img
              key={index}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-in-out"
              src={normalizeImageUrl(img)}
              alt={item.title || `Product ${index + 1}`}
              style={{
                transform: `translateX(${(index - currentImage) * 100}%)`,
              }}
              onError={(e: any) => {
                // Prevent infinite loop if fallback fails
                if (!e.currentTarget.src.includes('data:image')) {
                  e.currentTarget.src = normalizeImageUrl(null);
                }
              }}
            />
          ))}

          {/* Top Quick Actions (Wishlist & AI Chat) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            <Tooltip title={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}>
              <IconButton
                size="small"
                onClick={handleAddWishlist}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  "&:hover": { backgroundColor: "#FFFFFF" },
                }}
              >
                {isItemWishlisted ? (
                  <FavoriteIcon sx={{ color: "#EF4444", fontSize: 19 }} />
                ) : (
                  <FavoriteBorderIcon sx={{ color: "#64748B", fontSize: 19 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Ask AI about this item">
              <IconButton
                size="small"
                onClick={handleShowChatBot}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  "&:hover": { backgroundColor: "#FFFFFF" },
                }}
              >
                <ChatBubbleOutlineIcon sx={{ color: "#1E40AF", fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </div>

          {/* Carousel Dot Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-slate-900/30 backdrop-blur-sm px-2 py-1 rounded-full">
              {images.map((_, index: number) => (
                <span
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImage ? "bg-white w-3" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Content / Details */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {item.seller?.businessDetails?.businessName || "Verified Seller"}
            </p>
            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors">
              {item.title}
            </h3>
          </div>

          <div className="pt-3 flex items-baseline justify-between gap-2 border-t border-slate-100 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 text-base">
                ₹{item.sellingPrice}
              </span>
              {item.mrpPrice > item.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{item.mrpPrice}
                </span>
              )}
            </div>

            {item.discountPercent && item.discountPercent > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {item.discountPercent}% OFF
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {showChatBot && (
        <section className="absolute left-16 top-0">
          <Modal
            open={true}
            onClose={handleCloseChatBot}
            aria-labelledby="chatbot-modal-title"
            aria-describedby="chatbot-modal-description"
          >
            <Box sx={modalStyle}>
              <ChatBot handleClose={handleCloseChatBot} productId={item._id} />
            </Box>
          </Modal>
        </section>
      )}
    </>
  );
};

export default ProductCard;

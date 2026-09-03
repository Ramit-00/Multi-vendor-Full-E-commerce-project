import { Button, Divider, IconButton } from '@mui/material';
import React from 'react';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { CartItem } from '../../../types/cartTypes';
import { useAppDispatch } from '../../../Redux Toolkit/Store';
import { deleteCartItem, updateCartItem } from '../../../Redux Toolkit/Customer/CartSlice';
import { normalizeImageUrl } from '../../../util/imageUtil';

interface CartItemProps {
    item: CartItem;
}

const CartItemCard: React.FC<CartItemProps> = ({ item }) => {
    const dispatch = useAppDispatch();
    
    const handleUpdateQuantity = (value: number) => {
        dispatch(updateCartItem({
            jwt: localStorage.getItem("jwt"),
            cartItemId: item._id,
            cartItem: { quantity: item.quantity + value }
        }));
    };

    const handleRemoveCartItem = () => {
        dispatch(deleteCartItem({
            jwt: localStorage.getItem("jwt") || "", 
            cartItemId: item._id
        }));
    };

    const imageSrc = item.product?.images && item.product.images.length > 0
        ? item.product.images[0]
        : "";

    return (
        <div className='bg-white border border-slate-200/90 rounded-2xl relative shadow-sm hover:shadow transition-shadow'>
            <div className='p-5 flex gap-4'>
                <div className="w-24 h-28 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200/60">
                    <img
                        className='w-full h-full object-cover object-top' 
                        src={normalizeImageUrl(imageSrc)}
                        alt={item.product?.title || "Cart item"}
                        onError={(e: any) => {
                            if (!e.currentTarget.src.includes("data:image")) {
                                e.currentTarget.src = normalizeImageUrl(null);
                            }
                        }}
                    />
                </div>
                <div className='space-y-1.5 flex-1 pr-8'>
                    <h3 className='font-bold text-slate-800 text-base line-clamp-1'>
                        {item.product?.title}
                    </h3>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                        {item.product?.seller?.businessDetails?.businessName || "Verified Seller"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Size: {item.size || "FREE"}</span>
                        <span>7 days replacement available</span>
                    </div>
                </div>
            </div>
            <Divider />
            <div className='px-5 py-3 flex justify-between items-center bg-slate-50/50 rounded-b-2xl'>
                <div className='flex items-center gap-2 border border-slate-200 rounded-lg bg-white p-0.5'>
                    <Button
                        size='small'
                        disabled={item.quantity <= 1}
                        onClick={() => handleUpdateQuantity(-1)}
                        sx={{ minWidth: 32, p: 0.5, color: "#475569" }}
                    >
                        <RemoveIcon fontSize="small" />
                    </Button>
                    <span className='px-2 font-bold text-slate-800 text-sm'>
                        {item.quantity}
                    </span>
                    <Button
                        size='small'
                        onClick={() => handleUpdateQuantity(1)}
                        sx={{ minWidth: 32, p: 0.5, color: "#475569" }}
                    >
                        <AddIcon fontSize="small" />
                    </Button>
                </div>
                <div>
                    <span className='text-lg font-bold text-slate-900'>₹{item.sellingPrice}</span>
                    {item.mrpPrice > item.sellingPrice && (
                        <span className='text-xs text-slate-400 line-through ml-2'>₹{item.mrpPrice}</span>
                    )}
                </div>
            </div>
            <div className='absolute top-3 right-3'>
                <IconButton onClick={handleRemoveCartItem} size="small" sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
        </div>
    );
};

export default CartItemCard;
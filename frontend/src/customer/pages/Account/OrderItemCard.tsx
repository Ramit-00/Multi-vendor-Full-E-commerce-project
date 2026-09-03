import React from 'react';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Avatar, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderItem } from '../../../types/orderTypes';
import { formatDate } from '../../util/fomateDate';
import { normalizeImageUrl } from '../../../util/imageUtil';

interface OrderItemCardProps {
    item: OrderItem;
    order: Order;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, order }) => {
    const navigate = useNavigate();

    const handleOpenProduct = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.product) return;
        const categoryId = item.product.category?.categoryId || item.product.category || 'all';
        const title = encodeURIComponent(item.product.title || 'product');
        const prodId = item.product._id || item.product.id || item.product;
        navigate(`/product-details/${categoryId}/${title}/${prodId}`);
    };

    return (
        <div
            onClick={() => navigate(`/account/orders/${order._id}/item/${item._id}`)}
            className='text-sm bg-white p-5 space-y-4 border border-slate-200/80 rounded-2xl cursor-pointer hover:shadow-md transition-shadow'
        >
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <Avatar sizes='small' sx={{ bgcolor: "#0F172A", width: 36, height: 36 }}>
                        <LocalShippingIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <div>
                        <h3 className='font-bold text-slate-900'>
                            {order.orderStatus}
                        </h3>
                        <p className='text-xs text-slate-500'>Arriving by {formatDate(order.deliverDate)}</p>
                    </div>
                </div>

                <Button
                    onClick={handleOpenProduct}
                    size="small"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    sx={{
                        textTransform: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0F172A',
                        borderRadius: '6px',
                        '&:hover': { backgroundColor: '#F1F5F9' },
                    }}
                >
                    View Product
                </Button>
            </div>

            <div className='p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex gap-4 items-center'>
                <div
                    onClick={handleOpenProduct}
                    className='w-16 h-20 shrink-0 bg-white rounded-lg overflow-hidden border border-slate-200/80 cursor-pointer hover:opacity-90'
                >
                    <img
                        className='w-full h-full object-cover object-top'
                        src={normalizeImageUrl(item.product?.images?.[0])}
                        alt=""
                        onError={(e: any) => {
                            if (!e.currentTarget.src.includes("data:image")) {
                                e.currentTarget.src = normalizeImageUrl(null);
                            }
                        }}
                    />
                </div>
                <div className='w-full space-y-1'>
                    <h4 className='font-bold text-slate-800 text-sm'>
                        {item.product?.seller?.businessDetails?.businessName || item.product?.seller?.sellerName || "Verified Seller"}
                    </h4>
                    <p
                        onClick={handleOpenProduct}
                        className='text-xs text-slate-700 font-medium line-clamp-1 hover:text-blue-700 transition-colors'
                    >
                        {item.product?.title || "Product Item"}
                    </p>
                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                        <span><strong>Size: </strong>{item.size || "FREE"}</span>
                        <span><strong>Price: </strong>₹{Number(item.sellingPrice || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemCard;
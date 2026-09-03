import { Box, Button, CircularProgress, Divider } from '@mui/material';
import { useEffect } from 'react';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import OrderStepper from './OrderStepper';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  cancelOrder,
  fetchOrderById,
  fetchOrderItemById,
} from '../../../Redux Toolkit/Customer/OrderSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { normalizeImageUrl } from '../../../util/imageUtil';
import { formatDate } from '../../util/fomateDate';

const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const { auth, orders } = useAppSelector((store) => store);
  const { orderItemId, orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const jwt = localStorage.getItem('jwt') || '';
    if (orderItemId) {
      dispatch(fetchOrderItemById({ orderItemId, jwt }));
    }
    if (orderId) {
      dispatch(fetchOrderById({ orderId, jwt }));
    }
  }, [auth.jwt, orderId, orderItemId, dispatch]);

  // Resilient lookup: currentOrder, then history cache, then active order
  const activeOrder: any =
    orders.currentOrder && String(orders.currentOrder._id) === String(orderId)
      ? orders.currentOrder
      : orders.orders?.find((o: any) => String(o._id) === String(orderId)) || orders.currentOrder;

  const activeItem: any =
    orders.orderItem && String(orders.orderItem._id) === String(orderItemId)
      ? orders.orderItem
      : activeOrder?.orderItems?.find((it: any) => String(it._id) === String(orderItemId)) || orders.orderItem;

  // Collect all items in this order
  const rawItemsList: any[] =
    Array.isArray(activeOrder?.orderItems) && activeOrder.orderItems.length > 0
      ? activeOrder.orderItems
      : activeItem ? [activeItem] : [];

  // Deduplicate and ensure valid items
  const displayItems = rawItemsList.map((item: any) => {
    if (activeItem && String(item._id) === String(activeItem._id)) {
      return { ...item, ...activeItem };
    }
    return item;
  });

  if (orders.loading && displayItems.length === 0 && !activeOrder) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center gap-3">
        <CircularProgress size={36} sx={{ color: '#1E40AF' }} />
        <p className="text-sm font-semibold text-slate-600">Loading order details...</p>
      </div>
    );
  }

  if (!activeOrder && displayItems.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <PaymentsIcon sx={{ fontSize: 32 }} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No order details found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          We could not locate this order. It may have been removed or you may need to refresh.
        </p>
        <Button
          onClick={() => navigate('/account/orders')}
          startIcon={<ArrowBackIcon />}
          variant="contained"
          sx={{
            backgroundColor: '#1E40AF',
            '&:hover': { backgroundColor: '#1E3A8A' },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '8px',
          }}
        >
          Back to My Orders
        </Button>
      </div>
    );
  }

  const handleCancelOrder = () => {
    if (orderId) {
      dispatch(cancelOrder(orderId));
    }
  };

  const handleOpenProduct = (product: any) => {
    if (!product) return;
    const categoryId = product.category?.categoryId || product.category || 'all';
    const title = encodeURIComponent(product.title || 'product');
    const prodId = product._id || product.id || product;
    navigate(`/product-details/${categoryId}/${title}/${prodId}`);
  };

  const totalSelling = Number(
    activeOrder?.totalSellingPrice ||
    displayItems.reduce((acc, it) => acc + Number(it.sellingPrice || 0), 0)
  );
  const totalMrp = Number(
    activeOrder?.totalMrpPrice ||
    displayItems.reduce((acc, it) => acc + Number(it.mrpPrice || it.sellingPrice || 0), 0)
  );
  const totalSavings = totalMrp > totalSelling ? totalMrp - totalSelling : 0;

  return (
    <Box className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/account/orders')}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ textTransform: 'none', color: '#1E40AF', fontWeight: 700 }}
          >
            Back to Orders
          </Button>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Order Ref: </span>
          <span className="text-xs font-mono font-bold text-slate-800">
            #{String(activeOrder?._id || orderId).slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order Status & Stepper Banner */}
      <section className="border border-slate-200/90 rounded-2xl p-6 bg-white shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <LocalMallOutlinedIcon sx={{ color: '#1E40AF', fontSize: 20 }} />
              <span>Order Status: {activeOrder?.orderStatus || 'PENDING'}</span>
            </h2>
            {activeOrder?.orderDate && (
              <p className="text-xs text-slate-500">
                Placed on {formatDate(activeOrder.orderDate)}
              </p>
            )}
          </div>
          {activeOrder?.deliverDate && (
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              Estimated Delivery: {formatDate(activeOrder.deliverDate)}
            </span>
          )}
        </div>
        <div className="pt-2">
          <OrderStepper orderStatus={activeOrder?.orderStatus || 'PENDING'} />
        </div>
      </section>

      {/* Products In This Order */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-base">
            Items in this Order ({displayItems.length})
          </h2>
          <span className="text-xs text-slate-500">Click any product to view its store page</span>
        </div>

        <div className="space-y-3">
          {displayItems.map((item: any, idx: number) => {
            const product = item.product || {};
            const itemSellerName =
              product?.seller?.businessDetails?.businessName ||
              product?.seller?.sellerName ||
              activeOrder?.seller?.businessDetails?.businessName ||
              activeOrder?.seller?.sellerName ||
              'E-COM Verified Merchant';

            const itemMrp = Number(item.mrpPrice || item.sellingPrice || 0);
            const itemSelling = Number(item.sellingPrice || 0);
            const itemSavings = itemMrp > itemSelling ? itemMrp - itemSelling : 0;
            const itemImageUrl = normalizeImageUrl(product.images?.[0] || product.image);

            return (
              <div
                key={item._id || idx}
                className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 transition-colors flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                {/* Image + Information clickable */}
                <div
                  onClick={() => handleOpenProduct(product)}
                  className="flex gap-4 items-start sm:items-center flex-grow cursor-pointer group"
                >
                  <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:opacity-90 transition-opacity">
                    <img
                      className="w-full h-full object-cover object-top"
                      src={itemImageUrl}
                      alt={product.title || 'Product'}
                      onError={(e: any) => {
                        if (!e.currentTarget.src.includes('data:image')) {
                          e.currentTarget.src = normalizeImageUrl(null);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {itemSellerName}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors line-clamp-2">
                      {product.title || 'Product Item'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span><strong>Size: </strong>{item.size || 'FREE'}</span>
                      <span>&bull;</span>
                      <span><strong>Qty: </strong>{item.quantity || 1}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{itemSelling.toFixed(2)}
                      </span>
                      {itemSavings > 0 && (
                        <>
                          <span className="text-xs text-slate-400 line-through">
                            ₹{itemMrp.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            Save ₹{itemSavings.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions for this item */}
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Button
                    onClick={() => handleOpenProduct(product)}
                    variant="contained"
                    size="small"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      backgroundColor: '#1E40AF',
                      '&:hover': { backgroundColor: '#1E3A8A' },
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '8px',
                      fontSize: '12px',
                      py: 0.7,
                      flexGrow: 1,
                    }}
                  >
                    View Product
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RateReviewOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() =>
                      navigate(`/reviews/${product._id || product.id || product}/create`)
                    }
                    sx={{
                      textTransform: 'none',
                      borderColor: '#CBD5E1',
                      color: '#475569',
                      fontWeight: 600,
                      borderRadius: '8px',
                      fontSize: '12px',
                      py: 0.7,
                      flexGrow: 1,
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delivery Address & Contact */}
      <div className="border border-slate-200/90 rounded-2xl p-6 bg-white shadow-xs">
        <h2 className="font-bold text-slate-800 pb-3 text-sm uppercase tracking-wider">
          Delivery Address
        </h2>
        <div className="text-sm space-y-2 text-slate-600">
          <div className="flex gap-4 items-center font-semibold text-slate-800">
            <p>{activeOrder?.shippingAddress?.name || 'Valued Customer'}</p>
            {activeOrder?.shippingAddress?.mobile && (
              <>
                <Divider flexItem orientation="vertical" />
                <p>{activeOrder.shippingAddress.mobile}</p>
              </>
            )}
          </div>

          <p>
            {activeOrder?.shippingAddress?.address || 'Standard Delivery Address'}
            {activeOrder?.shippingAddress?.city ? `, ${activeOrder.shippingAddress.city}` : ''}
            {activeOrder?.shippingAddress?.state ? `, ${activeOrder.shippingAddress.state}` : ''}
            {activeOrder?.shippingAddress?.pinCode ? ` - ${activeOrder.shippingAddress.pinCode}` : ''}
          </p>
        </div>
      </div>

      {/* Order Price & Payment Breakdown */}
      <div className="border border-slate-200/90 rounded-2xl space-y-4 bg-white shadow-xs overflow-hidden">
        <div className="p-6 pb-2 space-y-2 text-sm">
          <h2 className="font-bold text-slate-800 uppercase tracking-wider pb-1 text-xs">
            Payment & Price Summary
          </h2>

          <div className="flex justify-between text-slate-600">
            <span>Total MRP ({displayItems.length} items)</span>
            <span>₹{totalMrp.toFixed(2)}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Catalog Discount</span>
              <span>-₹{totalSavings.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Shipping & Handling</span>
            <span className="text-emerald-700 font-bold uppercase">Free</span>
          </div>

          <Divider sx={{ my: 1.5 }} />

          <div className="flex justify-between items-center text-slate-900 font-extrabold text-base">
            <span>Total Order Amount</span>
            <span className="text-blue-900 text-lg">₹{totalSelling.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-6">
          <div className="bg-blue-50/70 text-blue-900 border border-blue-100 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-3">
            <PaymentsIcon sx={{ color: '#1E40AF' }} />
            <p>
              Payment Status:{' '}
              <strong className="uppercase">
                {activeOrder?.paymentDetails?.status || 'PENDING'}
              </strong>
            </p>
          </div>
        </div>

        <div className="p-6 pt-3">
          <Button
            disabled={activeOrder?.orderStatus === 'CANCELLED'}
            onClick={handleCancelOrder}
            color="error"
            sx={{
              py: '0.75rem',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
            }}
            variant="outlined"
            fullWidth
          >
            {activeOrder?.orderStatus === 'CANCELLED' ? 'Order Cancelled' : 'Cancel Order'}
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default OrderDetails;
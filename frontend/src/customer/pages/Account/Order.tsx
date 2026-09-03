import { useEffect } from 'react';
import OrderItemCard from './OrderItemCard';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchUserOrderHistory } from '../../../Redux Toolkit/Customer/OrderSlice';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Order = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { auth, orders } = useAppSelector((store) => store);

  useEffect(() => {
    dispatch(fetchUserOrderHistory(localStorage.getItem('jwt') || ''));
  }, [auth.jwt, dispatch]);

  const allItems =
    orders?.orders?.flatMap((order: any) =>
      order?.orderItems?.map((item: any) => ({ item, order }))
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Order History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track deliveries, view past purchases, and download receipts
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {allItems.length > 0 ? (
        <div className="space-y-4">
          {allItems.map(({ item, order }: any) => (
            <OrderItemCard key={item._id} item={item} order={order} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingBagOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Discover our latest collections and find something you love.
            </p>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate('/products/all')}
            sx={{
              backgroundColor: '#0F172A',
              '&:hover': { backgroundColor: '#1E293B' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
            }}
          >
            Start Shopping
          </Button>
        </div>
      )}
    </div>
  );
};

export default Order;
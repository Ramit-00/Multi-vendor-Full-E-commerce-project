import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { deleteUserAddress } from '../../../Redux Toolkit/Customer/UserSlice';
import UserAddressCard from './UserAddressCard';

const Addresses = () => {
  const { user } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();

  const handleDelete = (addressId: any) => {
    if (addressId) {
      dispatch(
        deleteUserAddress({
          addressId: String(addressId),
          jwt: localStorage.getItem('jwt') || '',
        })
      );
    }
  };

  const addresses = user.user?.addresses || [];

  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
        <p className="text-xs text-slate-500">
          Manage your saved delivery locations ({addresses.length})
        </p>
      </div>

      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((item: any) => (
            <UserAddressCard
              key={item._id}
              item={item}
              onDelete={() => handleDelete(item._id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">No saved addresses yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Addresses you add during checkout will appear here for easy reuse.
          </p>
        </div>
      )}
    </div>
  );
};

export default Addresses;
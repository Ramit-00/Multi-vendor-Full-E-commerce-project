import type { Address } from '../../../types/userTypes';
import { IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

interface UserAddressCardProps {
  item: Address;
  onDelete?: () => void;
}

const UserAddressCard = ({ item, onDelete }: UserAddressCardProps) => {
  return (
    <div className="p-5 border border-slate-200/90 rounded-xl bg-white shadow-xs flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
          <LocationOnOutlinedIcon sx={{ fontSize: 20 }} />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md">
            {item.address}, {item.locality}, {item.city}, {item.state} -{' '}
            <span className="font-semibold text-slate-700">{item.pinCode}</span>
          </p>
          {item.mobile && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Mobile:</span> {item.mobile}
            </p>
          )}
        </div>
      </div>

      {onDelete && (
        <Tooltip title="Remove address" arrow>
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              color: '#94A3B8',
              '&:hover': {
                color: '#E11D48',
                backgroundColor: '#FFE4E6',
              },
              borderRadius: '8px',
              p: 1,
            }}
            aria-label="Delete address"
          >
            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

export default UserAddressCard;
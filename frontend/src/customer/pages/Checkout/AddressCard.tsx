import { Radio, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import React from 'react';
import type { Address } from '../../../types/userTypes';

interface AddressCardProps {
  value: number;
  selectedValue: number;
  handleChange: (e: any) => void;
  handleDelete?: () => void;
  item: Address;
}

const AddressCard: React.FC<AddressCardProps> = ({
  value,
  selectedValue,
  handleChange,
  handleDelete,
  item,
}) => {
  const isSelected = value === selectedValue;

  return (
    <div
      onClick={() => handleChange({ target: { value } })}
      className={`p-4 sm:p-5 border rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
        isSelected
          ? 'border-blue-600 bg-blue-50/30 shadow-xs'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Radio
            checked={isSelected}
            onChange={handleChange}
            value={value}
            name="delivery-address-radio"
            size="small"
            sx={{
              color: '#94A3B8',
              '&.Mui-checked': { color: '#1E40AF' },
              p: 0.5,
            }}
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
            {isSelected && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Selected
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md">
            {item.address}, {item.locality}, {item.city}, {item.state} -{' '}
            <span className="font-semibold text-slate-700">{item.pinCode}</span>
          </p>

          {item.mobile && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Contact:</span>{' '}
              {item.mobile}
            </p>
          )}
        </div>
      </div>

      {handleDelete && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Remove address" arrow>
            <IconButton
              size="small"
              onClick={handleDelete}
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
        </div>
      )}
    </div>
  );
};

export default AddressCard;
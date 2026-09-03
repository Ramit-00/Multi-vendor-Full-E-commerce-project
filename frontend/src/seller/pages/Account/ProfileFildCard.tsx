import React from 'react';

interface ProfileFildCardProps {
  keys: string;
  value?: string | number | null;
}

const ProfileFildCard: React.FC<ProfileFildCardProps> = ({ value, keys }) => {
  return (
    <div className='py-3.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-50/80 transition-colors'>
      <span className='text-xs uppercase font-bold tracking-wider text-slate-400 w-36 lg:w-44 shrink-0'>
        {keys}
      </span>
      <span className='font-bold text-slate-900 text-sm text-right flex-1 break-all'>
        {value || "Not provided"}
      </span>
    </div>
  );
};

export default ProfileFildCard;
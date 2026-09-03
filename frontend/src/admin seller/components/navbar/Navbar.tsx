import React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Button, Drawer, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ DrawerList }: any) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: any) => () => {
    setOpen(newOpen);
  };

  return (
    <div className='h-[68px] bg-white flex items-center justify-between px-6 border-b border-slate-200'>
      <div className='flex items-center gap-3'>
        <IconButton onClick={toggleDrawer(true)} sx={{ color: "#1E40AF" }}>
          <MenuIcon />
        </IconButton>

        <div onClick={() => navigate("/")} className='flex items-center gap-2 cursor-pointer select-none'>
          <h1 className='text-xl font-extrabold tracking-tight text-blue-900'>E-COM</h1>
          <span className='text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded'>
            Dashboard
          </span>
        </div>
      </div>

      <Button
        onClick={() => navigate("/")}
        startIcon={<StorefrontIcon fontSize="small" />}
        size="small"
        sx={{
          textTransform: "none",
          fontWeight: 600,
          color: "#475569",
          "&:hover": { color: "#1E40AF", backgroundColor: "#F1F5F9" },
        }}
      >
        Storefront
      </Button>

      <Drawer open={open} onClose={toggleDrawer(false)}>
        <DrawerList toggleDrawer={toggleDrawer} />
      </Drawer>
    </div>
  );
};

export default Navbar;
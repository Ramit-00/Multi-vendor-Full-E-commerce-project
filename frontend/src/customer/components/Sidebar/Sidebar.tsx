import { Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip } from '@mui/material'
import { useState } from 'react'
import { mainCategory } from '../../../data/category/mainCategory'
import CategorySheet from '../Navbar/CategorySheet';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

const Sidebar = () => {
  const [selectedCategory, setSelectedCategory] = useState("men");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setOpen(false);
    navigate(`/products/${categoryId}`);
  };

  return (
    <Box className="sticky top-[70px] self-start z-10 p-3">
      <Tooltip title="Open categories">
        <IconButton
        onClick={() => setOpen(true)}
        aria-label="Open categories"
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Drawer open={open} onClose={() => setOpen(false)} anchor="left">
        <Box sx={{ width: 280 }} role="presentation">
          <List>
            <ListItem>
              <h2 className="text-lg font-bold text-blue-900">Categories</h2>
            </ListItem>
            <Divider />
            {mainCategory.map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  onClick={() => handleCategoryClick(item.categoryId)}
                  sx={{
                    backgroundColor: selectedCategory === item.categoryId ? '#EFF6FF' : 'transparent',
                    borderLeft: selectedCategory === item.categoryId ? '4px solid #1E40AF' : '4px solid transparent',
                    color: selectedCategory === item.categoryId ? '#1E40AF' : '#334155',
                    fontWeight: selectedCategory === item.categoryId ? 600 : 400,
                    '&:hover': { backgroundColor: '#F1F5F9' }
                  }}
                >
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {selectedCategory && (
            <div className="border-t mt-2">
              <CategorySheet selectedCategory={selectedCategory} />
            </div>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}

export default Sidebar

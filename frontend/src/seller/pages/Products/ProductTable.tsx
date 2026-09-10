import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { IconButton, styled, Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchSellerProducts, updateProduct, deleteProduct } from '../../../Redux Toolkit/Seller/sellerProductSlice';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import AddProductForm from './AddProductForm';
import { type Product } from '../../../types/productTypes';



const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function ProductTable() {

  const { sellerProduct } = useAppSelector(store => store);
  const dispatch = useAppDispatch();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);


  React.useEffect(() => {
    dispatch(fetchSellerProducts(localStorage.getItem("seller_jwt") || localStorage.getItem("jwt")))
  }, [])

  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    setEditDialogOpen(true);
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditProduct(null);
  };
  const handleEditSubmit = (values: any) => {
    if (editProduct && editProduct._id) {
      dispatch(updateProduct({ productId: editProduct._id, product: values }));
      setEditDialogOpen(false);
      setEditProduct(null);
    }
  };
  const handleDeleteClick = (productId: number | string) => {
    if (typeof productId === 'string') {
      const numId = Number(productId);
      if (!isNaN(numId)) {
        dispatch(deleteProduct(numId));
      }
    } else {
      dispatch(deleteProduct(productId));
    }
  };

  return (
    <>
      <h1 className='pb-5 font-bold text-xl'>Products</h1>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Images</StyledTableCell>
              <StyledTableCell align="right">Title</StyledTableCell>
              <StyledTableCell align="right">MRP</StyledTableCell>
              <StyledTableCell align="right">Selling Price</StyledTableCell>
              <StyledTableCell align="right">Color</StyledTableCell>
              <StyledTableCell align="right">Update Stock</StyledTableCell>
              <StyledTableCell align="right">Update</StyledTableCell>
              <StyledTableCell align="right">Delete</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sellerProduct.products.map((item) => (
              <StyledTableRow key={item._id}>
                <StyledTableCell component="th" scope="row">
                  <div className='flex gap-1 flex-wrap'>
                                      {item.images.map((image) => <img className='w-20 rounded-md' src={image} alt=""/>) }

                  </div>
                </StyledTableCell>
                 <StyledTableCell align="right">{item.title}</StyledTableCell>
                <StyledTableCell align="right"> ₹{item.mrpPrice}.0</StyledTableCell>
            <StyledTableCell align="right"> ₹{item.sellingPrice}.0</StyledTableCell>
                   <StyledTableCell align="right">
                    {(() => {
                      const stock = item.quantity ?? (item as any).stockQuantity ?? 10;
                      if (stock <= 0) {
                        return <Chip label="Out of Stock" color="error" size="small" />;
                      } else if (stock < 5) {
                        return <Chip label={`Low Stock (${stock})`} color="warning" size="small" sx={{ fontWeight: 700 }} />;
                      }
                      return <Chip label={`In Stock (${stock})`} color="success" size="small" variant="outlined" />;
                    })()}
                   </StyledTableCell>
                   <StyledTableCell align="right">
                    <IconButton color='primary' className='bg-primary-color' onClick={() => handleEditClick(item)}>
                      <EditIcon/>
                    </IconButton>
                   </StyledTableCell>
                   <StyledTableCell align="right">
                    <IconButton color='error' onClick={() => item._id && handleDeleteClick(item._id)}>
                      <DeleteIcon/>
                    </IconButton>
                   </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        {editProduct && (
          <AddProductForm
            initialValues={{ ...editProduct, images: editProduct.images || [] }}
            mode="edit"
            onSubmit={handleEditSubmit}
            onClose={handleEditDialogClose}
          />
        )}
      </Dialog>
    </>

  );
}

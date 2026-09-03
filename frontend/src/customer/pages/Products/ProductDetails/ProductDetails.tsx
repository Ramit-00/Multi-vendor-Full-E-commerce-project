import StarIcon from '@mui/icons-material/Star';
import { Box, Button, Divider, Modal, Snackbar, Alert } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Wallet } from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SmilarProduct from '../SimilarProduct/SmilarProduct';
import ZoomableImage from './ZoomableImage';
import { useAppDispatch, useAppSelector } from '../../../../Redux Toolkit/Store';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, getAllProducts } from '../../../../Redux Toolkit/Customer/ProductSlice';
import { addItemToCart } from '../../../../Redux Toolkit/Customer/CartSlice';
import { addProductToWishlist } from '../../../../Redux Toolkit/Customer/WishlistSlice';
import ProductReviewCard from '../../Review/ProductReviewCard';
import RatingCard from '../../Review/RatingCard';
import { fetchReviewsByProductId } from '../../../../Redux Toolkit/Customer/ReviewSlice';
import { useState, useEffect } from 'react';
import { normalizeImageUrl } from '../../../../util/imageUtil';
import { isWishlisted } from '../../../../util/isWishlisted';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "auto",
    height: "90vh",
    boxShadow: 24,
    outline: "none",
    borderRadius: "12px",
    overflow: "hidden",
    bgcolor: "#FFFFFF",
};

const ProductDetails = () => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const dispatch = useAppDispatch();
    const { products, review, wishlist } = useAppSelector(store => store);
    const navigate = useNavigate();
    const { productId, categoryId } = useParams();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (productId) {
            dispatch(fetchProductById(productId));
            dispatch(fetchReviewsByProductId({ productId }));
        }
        dispatch(getAllProducts({ category: categoryId }));
    }, [productId, categoryId, dispatch]);

    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        actionText: string;
        actionPath: string;
    }>({
        open: false,
        message: "",
        actionText: "",
        actionPath: ""
    });

    const handleAddCart = () => {
        dispatch(addItemToCart({
            jwt: localStorage.getItem('jwt'),
            request: {
                productId,
                size: "FREE",
                quantity,
                product: products.product
            }
        }));
        setNotification({
            open: true,
            message: "Item successfully added to your shopping bag!",
            actionText: "View Bag",
            actionPath: "/cart"
        });
    };

    const handleWishlistClick = () => {
        if (productId) {
            dispatch(addProductToWishlist({
                productId: productId as any,
                product: products.product
            }));
            setNotification({
                open: true,
                message: isItemWishlisted ? "Item removed from your wishlist" : "Item added to your wishlist!",
                actionText: "View Wishlist",
                actionPath: "/wishlist"
            });
        }
    };

    const productImages = products.product?.images && products.product.images.length > 0
        ? products.product.images
        : [];

    const isItemWishlisted = products.product && wishlist.wishlist
        ? isWishlisted(wishlist.wishlist, products.product)
        : false;

    return (
        <div className='px-4 lg:px-20 py-10 bg-[#FAFAFA] min-h-screen'>
            {/* Breadcrumbs */}
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
                <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate("/")}>Home</span>
                <span>/</span>
                <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate(`/products/${categoryId || 'all'}`)}>
                    {categoryId?.replace(/_/g, ' ') || 'Products'}
                </span>
                <span>/</span>
                <span className="text-slate-900 line-clamp-1">{products.product?.title || 'Details'}</span>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 lg:p-10 rounded-3xl border border-slate-200/80 shadow-sm'>
                {/* Image Gallery Column */}
                <section className='flex flex-col-reverse lg:flex-row gap-5'>
                    <div className='w-full lg:w-[18%] flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[520px]'>
                        {productImages.map((item, index) => (
                            <img
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`w-[70px] lg:w-full h-[80px] lg:h-[90px] object-cover cursor-pointer rounded-xl border-2 transition-all ${
                                    selectedImage === index
                                        ? 'border-slate-900 shadow-sm'
                                        : 'border-slate-200 opacity-70 hover:opacity-100'
                                }`}
                                src={normalizeImageUrl(item)}
                                alt=""
                            />
                        ))}
                    </div>

                    <div className='w-full lg:w-[82%] relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center max-h-[520px]'>
                        <img
                            onClick={handleOpen}
                            className='w-full h-full max-h-[520px] object-contain rounded-2xl cursor-zoom-in'
                            src={normalizeImageUrl(productImages[selectedImage])}
                            alt=""
                        />
                    </div>

                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box sx={style}>
                            <ZoomableImage src={normalizeImageUrl(productImages[selectedImage])} alt="" />
                        </Box>
                    </Modal>
                </section>

                {/* Product Info Column */}
                <section className="flex flex-col justify-between">
                    <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {products.product?.seller?.businessDetails?.businessName || "Verified Partner"}
                        </span>
                        <h1 className='text-2xl lg:text-3xl font-extrabold text-slate-900 mt-3 leading-snug tracking-tight'>
                            {products.product?.title}
                        </h1>

                        <div className='flex items-center gap-3 mt-4'>
                            <div className='flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-sm font-semibold'>
                                <span>4.2</span>
                                <StarIcon sx={{ color: "#F59E0B", fontSize: "16px" }} />
                            </div>
                            <span className='text-xs text-slate-500 font-medium'>
                                {review.reviews.length || 358} Customer Ratings
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className='mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80'>
                            <div className='flex items-baseline gap-3'>
                                <span className='text-3xl font-black text-slate-900 tracking-tight'>
                                    ₹{products.product?.sellingPrice}
                                </span>
                                {products.product?.mrpPrice && products.product?.mrpPrice > products.product?.sellingPrice && (
                                    <span className='text-base text-slate-400 line-through'>
                                        ₹{products.product?.mrpPrice}
                                    </span>
                                )}
                                {products.product?.discountPercent && products.product.discountPercent > 0 ? (
                                    <span className='text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white'>
                                        {products.product?.discountPercent}% OFF
                                    </span>
                                ) : null}
                            </div>
                            <p className='text-xs text-slate-500 mt-1.5'>
                                Inclusive of all taxes. Free delivery on orders over ₹1500.
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className='mt-6 grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium'>
                            <div className='flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60'>
                                <ShieldIcon sx={{ color: "#0F172A", fontSize: 20 }} />
                                <span>100% Authentic Quality</span>
                            </div>
                            <div className='flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60'>
                                <WorkspacePremiumIcon sx={{ color: "#0F172A", fontSize: 20 }} />
                                <span>Money Back Guarantee</span>
                            </div>
                            <div className='flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60'>
                                <LocalShippingIcon sx={{ color: "#0F172A", fontSize: 20 }} />
                                <span>Fast Track Delivery</span>
                            </div>
                            <div className='flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60'>
                                <Wallet sx={{ color: "#0F172A", fontSize: 20 }} />
                                <span>Secure Digital Payments</span>
                            </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className='mt-6 flex items-center gap-4'>
                            <span className='text-xs font-bold uppercase tracking-wider text-slate-600'>Quantity:</span>
                            <div className='flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50'>
                                <button
                                    type="button"
                                    disabled={quantity <= 1}
                                    onClick={() => setQuantity(quantity - 1)}
                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-100"
                                >
                                    <RemoveIcon fontSize="small" />
                                </button>
                                <span className='px-3 font-bold text-slate-800 text-sm'>
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                                >
                                    <AddIcon fontSize="small" />
                                </button>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                            <Button
                                onClick={handleAddCart}
                                sx={{
                                    py: "12px",
                                    backgroundColor: "#0F172A",
                                    "&:hover": { backgroundColor: "#1E293B" },
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                }}
                                variant='contained'
                                fullWidth
                                startIcon={<AddShoppingCartIcon />}
                            >
                                Add To Bag
                            </Button>
                            <Button
                                onClick={handleWishlistClick}
                                sx={{
                                    py: "12px",
                                    borderColor: "#CBD5E1",
                                    color: isItemWishlisted ? "#EF4444" : "#0F172A",
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" }
                                }}
                                variant='outlined'
                                fullWidth
                                startIcon={isItemWishlisted ? <FavoriteIcon sx={{ color: "#EF4444" }} /> : <FavoriteBorderIcon />}
                            >
                                {isItemWishlisted ? "In Wishlist" : "Save to Wishlist"}
                            </Button>
                        </div>

                        {/* Description */}
                        {products.product?.description && (
                            <div className='mt-8 pt-6 border-t border-slate-200'>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Description</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {products.product?.description}
                                </p>
                            </div>
                        )}

                        {/* Seller Information & Merchant Reviews */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <span>Sold & Fulfilled by:</span>
                                    <span className="text-blue-700 font-semibold">
                                        {products.product?.seller?.sellerName ||
                                         products.product?.seller?.businessDetails?.businessName ||
                                         "E-COM Flagship Seller"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Verified Merchant
                                    </span>
                                </h3>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">
                                            {products.product?.seller?.businessDetails?.businessName ||
                                             products.product?.seller?.sellerName ||
                                             "Authorized Brand Retailer"}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {products.product?.seller?.businessDetails?.businessEmail ||
                                             products.product?.seller?.email ||
                                             "Verified Multi-Vendor Partner"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                            <StarIcon sx={{ fontSize: 16 }} />
                                            <span>4.8 / 5.0</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500">Merchant Rating (420+ Reviews)</p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {products.product?.seller?.businessDetails?.businessName
                                        ? `Official ${products.product.seller.businessDetails.businessName} merchant. All products are 100% authentic, tamper-evident packaged, and backed by comprehensive buyer protection.`
                                        : "Trusted marketplace partner offering verified quality, tracked expedited delivery, and 7-day hassle-free replacement warranty."}
                                </p>

                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                                        <p className="text-xs font-bold text-slate-900">98%</p>
                                        <p className="text-[10px] text-slate-500">Positive Feedback</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                                        <p className="text-xs font-bold text-slate-900">99.2%</p>
                                        <p className="text-[10px] text-slate-500">On-Time Dispatch</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                                        <p className="text-xs font-bold text-slate-900">100%</p>
                                        <p className="text-[10px] text-slate-500">Genuine Stock</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Ratings & Reviews */}
            <div className="mt-12 bg-white p-6 lg:p-10 rounded-2xl border border-slate-200/90 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Customer Reviews & Ratings
                </h2>
                <RatingCard totalReview={review.reviews.length} />
                <div className='mt-8 space-y-6'>
                    {review.reviews.map((item) => (
                        <div key={item._id} className='space-y-4'>
                            <ProductReviewCard item={item} />
                            <Divider />
                        </div>
                    ))}
                    <Button
                        onClick={() => navigate(`/reviews/${productId}`)}
                        variant="outlined"
                        sx={{ borderColor: "#CBD5E1", color: "#1E40AF" }}
                    >
                        View All {review.reviews.length} Reviews
                    </Button>
                </div>
            </div>

            {/* Similar Products */}
            <section className='mt-12'>
                <h2 className='text-xl font-bold text-slate-900 mb-6'>Similar Products</h2>
                <SmilarProduct />
            </section>

            {/* Action Feedback Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: "100%",
                        backgroundColor: "#1E40AF",
                        color: "white",
                        fontWeight: 600,
                        alignItems: "center"
                    }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setNotification({ ...notification, open: false });
                                navigate(notification.actionPath);
                            }}
                            sx={{ fontWeight: 800, textDecoration: "underline", ml: 1 }}
                        >
                            {notification.actionText}
                        </Button>
                    }
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ProductDetails;
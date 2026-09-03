import { useNavigate } from 'react-router-dom';
import { normalizeImageUrl } from '../../../../util/imageUtil';

const SimilarProductCard = ({ product }: any) => {
    const navigate = useNavigate();
    const imageSrc = product?.images && product.images.length > 0 ? product.images[0] : "";

    return (
        <div
            onClick={() => navigate(
                `/product-details/${product.category?.categoryId || 'all'}/${encodeURIComponent(product.title || 'product')}/${product._id || product.id}`
            )} 
            className='group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer'
        >
            <div className="relative h-[250px] bg-slate-50 overflow-hidden">
                <img
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    src={normalizeImageUrl(imageSrc)}
                    alt={product.title}
                    onError={(e: any) => {
                        if (!e.currentTarget.src.includes("data:image")) {
                            e.currentTarget.src = normalizeImageUrl(null);
                        }
                    }}
                />
            </div>
            <div className='p-4 space-y-1.5'>
                <p className='text-[11px] font-bold uppercase tracking-wider text-slate-400'>
                    {product.seller?.businessDetails?.businessName || "Verified Seller"}
                </p>
                <h4 className='font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-900'>
                    {product.title}
                </h4>
                <div className='flex items-baseline justify-between pt-2 border-t border-slate-100 mt-2'>
                    <div className='flex items-baseline gap-2'>
                        <span className='font-bold text-slate-900 text-sm'>₹{product.sellingPrice}</span>
                        {product.mrpPrice > product.sellingPrice && (
                            <span className='text-xs text-slate-400 line-through'>₹{product.mrpPrice}</span>
                        )}
                    </div>
                    {product.discountPercent && product.discountPercent > 0 ? (
                        <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700'>
                            {product.discountPercent}% OFF
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SimilarProductCard;

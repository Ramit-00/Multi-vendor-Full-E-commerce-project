import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../../../Redux Toolkit/Customer/ProductSlice';

import ReviewForm from './ReviewForm';
import { normalizeImageUrl } from '../../../util/imageUtil';

const WriteReviews = () => {
    const dispatch = useAppDispatch();
    const { products } = useAppSelector(store => store)

    const { productId } = useParams()

    useEffect(() => {

        if (productId) {
            dispatch(fetchProductById(productId))
        }

    }, [productId])

    return (
        <div className='p-5 lg:p-20 flex flex-col lg:flex-row gap-10'>
            <div className='w-full md:w-1/2 lg:w-[30%] space-y-2'>
                <img className='w-full rounded-xl object-cover' src={
                    normalizeImageUrl(products.product?.images?.[0])
                } alt="" />
                <div>
                    <div>
                        <p className='font-bold text-xl text-slate-800'> {products.product?.seller?.businessDetails?.businessName}
                        </p>
                        <p className='text-base text-slate-600'>{products.product?.title}</p>
                    </div>

                    <div className='price flex items-center gap-3 mt-4 text-lg'>
                        <span className='font-bold text-slate-900' > ₹{products.product?.sellingPrice}</span>
                        <span className='text thin-line-through text-slate-400 text-sm'>₹{products.product?.mrpPrice}</span>
                        <span className='text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs'>{products.product?.discountPercent}% off</span>
                    </div>

                </div>
            </div>
            <section className="w-full md:w-1/2 lg:w-[70%]">
                <h1 className="font-semibold text-2xl pb-4 text-gray-700">
                    Write Your Review & Give Ratings
                </h1>
                <ReviewForm />

            </section>
        </div>
    )
}

export default WriteReviews
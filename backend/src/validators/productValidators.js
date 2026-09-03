// validators/productValidator.js
const Yup = require('yup');

const createProductSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().max(5000, 'Description is too long'),
  mrpPrice: Yup.number().required('MRP Price is required').positive('MRP Price must be a positive number'),
  sellingPrice: Yup.number().required('Selling Price is required').positive('Selling Price must be a positive number'),
  color: Yup.string().nullable().notRequired(),
  images: Yup.array().of(Yup.string()).min(1, 'At least one image is required'),
  category: Yup.string().required('Category is required'),
  category2: Yup.string().nullable().notRequired(),
  category3: Yup.string().nullable().notRequired(),
  sizes: Yup.string().nullable().notRequired(),
});

module.exports = {
  createProductSchema,
};

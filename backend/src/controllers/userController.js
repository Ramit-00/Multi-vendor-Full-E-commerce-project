const UserService = require('../services/UserService');
const UserError = require('../exceptions/UserError');

const getUserProfileByJwt = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const user = await UserService.findUserProfileByJwt(token);
        return res.status(200).json(user);
      }
    }
    const user = await req.user;
    return res.status(200).json(user);
  } catch (err) {
    handleErrors(err, res);
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.query; 
  try {
    const user = await UserService.findUserByEmail(email);
    return res.status(200).json(user);
  } catch (err) {
    handleErrors(err, res);
  }
};

const addAddress = async (req, res) => {
  try {
    const user = await req.user;
    const addressData = req.body;
    const createdAddress = await UserService.addAddress(user, addressData);
    return res.status(201).json(createdAddress);
  } catch (err) {
    console.error("Error adding address:", err.message);
    return res.status(500).json({ message: "Failed to add address", error: err.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const user = await req.user;
    const { addressId } = req.params;
    const result = await UserService.deleteAddress(user, addressId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error deleting address:", err.message);
    return res.status(500).json({ message: "Failed to delete address", error: err.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await req.user;
    const updatedUser = await UserService.updateUserProfile(user, req.body);
    return res.status(200).json(updatedUser);
  } catch (err) {
    handleErrors(err, res);
  }
};

const handleErrors = (err, res) => {
  if (err instanceof UserError) {
    return res.status(404).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal Server Error' });
};

module.exports = {
  getUserProfileByJwt,
  getUserByEmail,
  updateUserProfile,
  addAddress,
  deleteAddress,
};

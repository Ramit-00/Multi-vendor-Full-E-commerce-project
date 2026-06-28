
const getUserProfileByJwt = async(req,res) => {
  try{
    const userData = await req.user;
    return res.status(200).json({user: userData});
  } catch (error) {
    handleErrors(error,res);
  }
};

const getUserByEmail = async(req,res) =>{
  const {email} = req.query;
  try{
    const userData = await userService.findUserByEmail(email);
    return res.status(200).json({user: userData});
  } catch (error) {
    handleErrors(error,res);
  }

  const handleErrors = (error,res) => {
    if(error instanceof UserError){
      return res.status(404).json({error:error.message});
    }
    return res.status(500).json({error:"Internal server error"});
  }
}

export default {
  getUserProfileByJwt,
  getUserByEmail
};
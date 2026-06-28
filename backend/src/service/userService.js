import { User } from '../model/User.js';
import jwtProvider from '../util/jwtProvider.js';

class UserService{

  async findUserProfileByJwt(jwt){

    const email = jwtProvider.getEmailFromJwt(jwt);
    
    const userData = await User.findOne({email});
    if(!userData){
      throw new Error("User not found");
    }
    return userData;
  }  

  async findUserByEmail(email){
    const userData = await User.findOne({email});
    if(!userData){
      throw new Error("User not found");
    }
    return userData;
  }
}

export default new UserService();
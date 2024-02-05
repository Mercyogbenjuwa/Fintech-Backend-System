import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User  from '../../database/models/User';
import Wallet  from '../../database/models/Wallet';
import EmailVerificationService from '../../utils/EmailVerification';
import { FintechResponse } from '../../utils/FintechResponse';
import { generateVerificationCode, validatePassword }  from '../../utils/Reusables';

class UserController {
/**===================================== User Registration  ===================================== **/
static async registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().VALIDATIONERROR,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().WRONGEMAILFORMAT,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    if (!validatePassword(password)) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().WRONGPASSFORMAT,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    const existingUser = await User.findOne({ where: { username } });
    const existingEmail = await User.findOne({ where: { email } });
    if (existingUser || existingEmail) {
      return res.status(FintechResponse.HTTP_CONFLICT).json({
        responseMessage: FintechResponse.getMessages().EMAILEXISTS,
        responseCode: FintechResponse.HTTP_CONFLICT,
        responseData: null,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationCode();
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });
    const { currency } = req.body;
    if (!['USD', 'EUR'].includes(currency)) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().INVALIDCURRENCY,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    await Wallet.create({
      balance: 0.00,
      currency,
      userID: newUser.userID,
    });
    await EmailVerificationService.sendVerificationEmail(email, verificationToken);
    return res.status(FintechResponse.HTTP_CREATED).json({
      responseMessage: FintechResponse.getMessages().SUCCESS,
      responseCode: FintechResponse.HTTP_CREATED,
      responseData: newUser,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
      responseMessage: FintechResponse.getMessages().ERROR,
      responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
      responseData: null,
    });
  }
}


/**===================================== User Verification  ===================================== **/
static async verifyToken(req: Request, res: Response) {
  try {
    const { email, verificationToken } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(FintechResponse.HTTP_NOT_FOUND).json({
        message: FintechResponse.getMessages().NORECORD,
        code: FintechResponse.HTTP_NOT_FOUND,
        data: { message: FintechResponse.getMessages().NORECORD },
      });
    }
    if (verificationToken === user.verificationToken) {
      await user.update({ emailVerified: true });
      return res.json({
        message: FintechResponse.getMessages().SUCCESS,
        code: FintechResponse.HTTP_OK,
        data: {user},
      });
    } else {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        message: FintechResponse.getMessages().INVALIDTOKEN,
        code: FintechResponse.HTTP_BAD_REQUEST,
        data: { message: FintechResponse.getMessages().INVALIDTOKEN },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
      message: FintechResponse.getMessages().ERROR,
      code: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
      data: { message: FintechResponse.getMessages().ERROR },
    });
  }
}


}

export default UserController;

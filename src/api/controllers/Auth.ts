import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User  from '../../database/models/User';
import Wallet  from '../../database/models/Wallet';
import EmailVerificationService from '../../utils/EmailVerification';
import { FintechResponse } from '../../utils/FintechResponse';
import { generateVerificationCode, validatePassword, generateAccountNumber }  from '../../utils/Reusables';
import logger from '../../utils/Logger';
import jwt from 'jsonwebtoken';

class UserController {
/**===================================== User Registration  ===================================== **/
static async registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      const maskedRequestBody = { username, email, password: '********' }; //***** Mask The Password ****// 
      const errorMessage = FintechResponse.getMessages().VALIDATIONERROR;
      logger.error(`${errorMessage} - Request Body: ${JSON.stringify(maskedRequestBody)}`);
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().VALIDATIONERROR,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorMessage = FintechResponse.getMessages().WRONGEMAILFORMAT;
      logger.error(`${errorMessage} - Email: ${email}`);
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().WRONGEMAILFORMAT,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    if (!validatePassword(password)) {
      logger.error(FintechResponse.getMessages().WRONGPASSFORMAT);
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().WRONGPASSFORMAT,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    const existingUser = await User.findOne({ where: { username } });
    const existingEmail = await User.findOne({ where: { email } });
    if (existingUser || existingEmail) {
      const errorMessage = FintechResponse.getMessages().EMAILEXISTS;
      logger.error(`${errorMessage} - Content: ${JSON.stringify(username, email)}`);
      return res.status(FintechResponse.HTTP_CONFLICT).json({
        responseMessage: FintechResponse.getMessages().EMAILEXISTS,
        responseCode: FintechResponse.HTTP_CONFLICT,
        responseData: null,
      });
    }
    //******* Ensure EUR And USD Currency Exist ***********// 
    const validCurrencies = ['USD', 'EUR'];
    if (!validCurrencies.every(currency => Wallet.findOne({ where: { currency } }))) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().INVALIDCURRENCY,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: null,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationCode();
    const accountNumber = generateAccountNumber();
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      accountNumber,
      verificationToken,
      emailVerified: false,
    });
      //******* Create Wallet For Users ***********//
      await Wallet.create({
        balance: 0.00,
        currency: 'USD', 
        userID: newUser.userID,
        accountNumber
      });
      await Wallet.create({
        balance: 0.00,
        currency: 'EUR', 
        userID: newUser.userID,
        accountNumber
      });
    await EmailVerificationService.sendVerificationEmail(email, verificationToken);
    logger.info(`${FintechResponse.getMessages().SUCCESS} - Username: ${username}, Email: ${email}`);
    return res.status(FintechResponse.HTTP_CREATED).json({
      responseMessage: FintechResponse.getMessages().SUCCESS,
      responseCode: FintechResponse.HTTP_CREATED,
      responseData: newUser,
    });
  } catch (error) {
    const errorMessage = FintechResponse.getMessages().ERROR;
    logger.error(`${errorMessage} Content: ${JSON.stringify(error)}`);
    return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
      responseMessage: FintechResponse.getMessages().ERROR,
      responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
      responseData: null,
    });
  }
};

/**===================================== User Verification  ===================================== **/
static async verifyToken(req: Request, res: Response) {
  try {
    const { email, verificationToken } = req.body;
    logger.info(FintechResponse.getMessages().AFFIRMATION, { endpoint: 'Verification', email, verificationToken });
    const user = await User.findOne({ where: { email } });
    if (!user) {
    logger.warn(FintechResponse.getMessages().USERNOTFOUND, { email, verificationToken });
      return res.status(FintechResponse.HTTP_NOT_FOUND).json({
        responseMessage: FintechResponse.getMessages().NORECORD,
        responseCode: FintechResponse.HTTP_NOT_FOUND,
        responseData: { message: FintechResponse.getMessages().NORECORD },
      });
    }

    if (verificationToken === user.verificationToken) {
      logger.info(FintechResponse.getMessages().SUCCESS, { email });
      await user.update({ emailVerified: true });
      return res.json({
        responseMessage: FintechResponse.getMessages().SUCCESS,
        responseCode: FintechResponse.HTTP_OK,
        responseData: { user },
      });
    } else {
      logger.warn(FintechResponse.getMessages().EXPIREDTOKEN, { email, verificationToken });
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        responseMessage: FintechResponse.getMessages().INVALIDTOKEN,
        responseCode: FintechResponse.HTTP_BAD_REQUEST,
        responseData: { message: FintechResponse.getMessages().INVALIDTOKEN },
      });
    }
  } catch (error) {
    logger.error(FintechResponse.getMessages().ERROR, { endpoint: 'Verification', error });
    res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
      responseMessage: FintechResponse.getMessages().ERROR,
      responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
      responseData: { message: FintechResponse.getMessages().ERROR },
    });
  }
};

/**===================================== Token Generator ===================================== **/
private static tokenGenerator = (id: number) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(FintechResponse.getMessages().ENVVARIABLE);
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "2d" });
};


/**===================================== Admin Login ===================================== **/
static async loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        ResponseMessage: FintechResponse.getMessages().VALIDATIONERROR,
        ResponseCode: FintechResponse.HTTP_BAD_REQUEST,
        ResponseData: { message: FintechResponse.getMessages().WRONGPARAMETERS },
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
        ResponseMessage: FintechResponse.getMessages().WRONGEMAILFORMAT,
        ResponseCode: FintechResponse.HTTP_BAD_REQUEST,
        ResponseData: FintechResponse.getMessages().WRONGEMAILFORMAT,
      });
    }

    const admin = await User.findOne({ where: { email } });
    if (!admin) {
      return res.status(FintechResponse.HTTP_NOT_FOUND).json({
        ResponseMessage: FintechResponse.getMessages().NORECORD,
        ResponseCode: FintechResponse.HTTP_NOT_FOUND,
        ResponseData: { message: FintechResponse.getMessages().NORECORD },
      });
    }

    if (!admin.password) {
      return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
        ResponseMessage: FintechResponse.getMessages().ERROR,
        ResponseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
        ResponseData: { message: FintechResponse.getMessages().PASSWORDERROR },
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
        ResponseMessage: FintechResponse.getMessages().ACCESSDENIED,
        ResponseCode: FintechResponse.HTTP_UNAUTHORIZED,
        ResponseData: { status: false, message: FintechResponse.getMessages().WRONGPARAMETERS },
      });
    }

    if (admin.emailVerified === false) {
      return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
        ResponseMessage: FintechResponse.getMessages().ACCESSDENIED,
        ResponseCode: FintechResponse.HTTP_UNAUTHORIZED,
        ResponseData: { message: FintechResponse.getMessages().MAILVERIFICATION },
      });
    }

    const {  email: adminEmail, userID, username, accountNumber, emailVerified} = admin;
    const generatedToken = UserController.tokenGenerator(admin.userID);

    res.json({
      ResponseMessage: FintechResponse.getMessages().SUCCESS,
      ResponseCode: FintechResponse.HTTP_OK,
      ResponseData: {
        data: {
          token: generatedToken,
          userID,
          username,
          accountNumber,
          email: adminEmail,
          emailVerified
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
      ResponseMessage: FintechResponse.getMessages().ERROR,
      ResponseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
      ResponseData: { message: FintechResponse.getMessages().ERROR },
    });
  }
}


}

export default UserController;

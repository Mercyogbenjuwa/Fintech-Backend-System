import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../database/models/User";
import Wallet from "../../database/models/Wallet";
import EmailVerificationService from "../../utils/EmailVerification";
import { FintechResponse } from "../../utils/FintechResponse";
import {
  generateVerificationCode,
  validatePassword,
  generateAccountNumber,
} from "../../utils/Reusables";
import logger from "../../utils/Logger";
import jwt from "jsonwebtoken";


class AuthController {

  /**===================================== User Registration  ===================================== **/
  static async registerUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        const maskedRequestBody = { username, email, password: "********" }; //***** Mask The Password ****//
        const errorMessage = FintechResponse.getMessages().VALIDATIONERROR;
        logger.error(
          `${errorMessage} - Request Body: ${JSON.stringify(maskedRequestBody)}`
        );
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
        logger.error(
          `${errorMessage} - Content: ${JSON.stringify(username, email)}`
        );
        return res.status(FintechResponse.HTTP_CONFLICT).json({
          responseMessage: FintechResponse.getMessages().EMAILEXISTS,
          responseCode: FintechResponse.HTTP_CONFLICT,
          responseData: null,
        });
      }
      //******* Ensure EUR And USD Currency Exist ***********//
      const validCurrencies = ["USD", "EUR"];
      if (
        !validCurrencies.every((currency) =>
          Wallet.findOne({ where: { currency } })
        )
      ) {
        return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
          responseMessage: FintechResponse.getMessages().INVALIDCURRENCY,
          responseCode: FintechResponse.HTTP_BAD_REQUEST,
          responseData: null,
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = generateVerificationCode();
      const accountNumber = generateAccountNumber();
      const existingAccount = await User.findOne({ where: { accountNumber } });
      if (existingAccount) {
        const errorMessage = FintechResponse.getMessages().ACCOUNTNUMBEREXISTS;
        logger.error(
          `${errorMessage} - Content: ${JSON.stringify(existingAccount)}`
        );
        return res.status(FintechResponse.HTTP_CONFLICT).json({
          esponseMessage: FintechResponse.getMessages().ACCOUNTNUMBEREXISTS,
          responseCode: FintechResponse.HTTP_CONFLICT,
          responseData: null
        })
      }
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
        balance: 0.0,
        currency: "USD",
        userID: newUser.userID,
        accountNumber,
      });
      await Wallet.create({
        balance: 0.0,
        currency: "EUR",
        userID: newUser.userID,
        accountNumber,
      });
      await EmailVerificationService.sendVerificationEmail(
        email,
        verificationToken
      );
      logger.info(
        `${FintechResponse.getMessages().SUCCESS
        } - Username: ${JSON.stringify(username)}, Email: ${JSON.stringify(email)}`
      );
      return res.status(FintechResponse.HTTP_CREATED).json({
        responseMessage: FintechResponse.getMessages().SUCCESS,
        responseCode: FintechResponse.HTTP_CREATED,
        responseData: newUser,
      });
    } catch (error) {
      const errorMessage = FintechResponse.getMessages().ERROR;
      logger.error(`${errorMessage} Error: ${JSON.stringify(error)}`);
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
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn(FintechResponse.getMessages().USERNOTFOUND, {
          email,
          verificationToken,
        });
        return res.status(FintechResponse.HTTP_NOT_FOUND).json({
          responseMessage: FintechResponse.getMessages().NORECORD,
          responseCode: FintechResponse.HTTP_NOT_FOUND,
          responseData: null,
        });
      }
      if (verificationToken === user.verificationToken) {
        logger.info(FintechResponse.getMessages().SUCCESS, `${JSON.stringify(email)}`);
        await user.update({ emailVerified: true });
        return res.json({
          responseMessage: FintechResponse.getMessages().SUCCESS,
          responseCode: FintechResponse.HTTP_OK,
          responseData: { user },
        });
      } else {
        logger.warn(FintechResponse.getMessages().INVALIDTOKEN, {
          email,
          verificationToken,
        });
        return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
          responseMessage: FintechResponse.getMessages().INVALIDTOKEN,
          responseCode: FintechResponse.HTTP_BAD_REQUEST,
          responseData: null,
        });
      }
    } catch (error) {
      const errorMessage = FintechResponse.getMessages().ERROR;
      logger.error(`${errorMessage} Error: ${JSON.stringify(error)}`);
      res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
        responseMessage: FintechResponse.getMessages().ERROR,
        responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
        responseData: null,
      });
    }
  };

  /**===================================== Token Generator ===================================== **/
  private static tokenGenerator = (id: number): string => {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error(FintechResponse.getMessages().ENVVARIABLE);
      }
      return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    } catch (error) {
      throw new Error(FintechResponse.getMessages().EXPIREDTOKEN);
    }
  };

  /**===================================== User  Login ===================================== **/
  static async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        const maskedRequestBody = { email, password: "********" };
        const errorMessage = FintechResponse.getMessages().VALIDATIONERROR;
        logger.error(
          `${errorMessage} - Request Body: ${JSON.stringify(maskedRequestBody)}`
        );
        return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
          responseMessage: FintechResponse.getMessages().WRONGPARAMETERS,
          responseCode: FintechResponse.HTTP_BAD_REQUEST,
          responseData: null
        });
      }
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        const errorMessage = FintechResponse.getMessages().WRONGEMAILFORMAT;
        logger.error(`${errorMessage} - Email: ${email}`);
        return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
          responseMessage: FintechResponse.getMessages().WRONGEMAILFORMAT,
          responseCode: FintechResponse.HTTP_BAD_REQUEST,
          responseData: null,
        });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) {
        const errorMessage = FintechResponse.getMessages().NORECORD;
        logger.error(
          `${errorMessage} - Content: ${JSON.stringify(user)}`
        );
        return res.status(FintechResponse.HTTP_NOT_FOUND).json({
          responseMessage: FintechResponse.getMessages().NORECORD,
          responseCode: FintechResponse.HTTP_NOT_FOUND,
          responseData: null,
        });
      }
      if (!user.password) {
        logger.error(FintechResponse.getMessages().PASSWORDERROR);
        return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
          responseMessage: FintechResponse.getMessages().PASSWORDERROR,
          responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
          responseData: null,
        });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        logger.error(FintechResponse.getMessages().PASSWORDERROR);
        return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
          responseMessage: FintechResponse.getMessages().WRONGPARAMETERS,
          responseCode: FintechResponse.HTTP_UNAUTHORIZED,
          responseData: null,
        });
      }
      if (user.emailVerified === false) {
        logger.error(FintechResponse.getMessages().MAILVERIFICATION);
        return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
          responseMessage: FintechResponse.getMessages().MAILVERIFICATION,
          responseCode: FintechResponse.HTTP_UNAUTHORIZED,
          responseData: null,
        });
      }
      const {
        email: userEmail,
        userID,
        username,
        accountNumber,
        emailVerified,
      } = user;
      const generatedToken = AuthController.tokenGenerator(user.userID);
      res.json({
        responseMessage: FintechResponse.getMessages().SUCCESS,
        responseCode: FintechResponse.HTTP_OK,
        responseData: {
          data: {
            token: generatedToken,
            userID,
            username,
            accountNumber,
            email: userEmail,
            emailVerified,
          },
        },
      });
    } catch (error) {
      const errorMessage = FintechResponse.getMessages().ERROR;
      logger.error(`${errorMessage} Content: ${JSON.stringify(error)}`);
      res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
        responseMessage: FintechResponse.getMessages().ERROR,
        responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
        responseData: null,
      });
    }
  };

}

export default AuthController;

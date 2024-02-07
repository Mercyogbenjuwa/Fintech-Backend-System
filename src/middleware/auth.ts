import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { FintechResponse } from '../utils/FintechResponse';
import User from '../database/models/User';
import dotenv from 'dotenv';
dotenv.config();

/**===================================== Extend The Request Interface To Include The User Property  ===================================== **/
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

/**===================================== Middleware Function To Verify Jwt Token And Authenticate User  ===================================== **/
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //***************** Get The JWT Token From The Request Headers ***************//
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
                responseMessage: FintechResponse.getMessages().ACCESSDENIED,
                responseCode: FintechResponse.HTTP_UNAUTHORIZED,
                responseData: null,
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT SECRET IS NOT DEFINED IN THE ENVIRONMENT VARIABLES');
        }

        try {
            /******* Verify The Token *******/
            const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decodedToken.id);
            if (!user) {
                return res.status(FintechResponse.HTTP_NOT_FOUND).json({
                    responseMessage: FintechResponse.getMessages().USERNOTFOUND,
                    responseCode: FintechResponse.HTTP_NOT_FOUND,
                    responseData: null,
                });
            }
            //******Attach the user object to the request for further processing//
            req.user = user;
            next();
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
                    responseMessage: FintechResponse.getMessages().EXPIREDTOKEN,
                    responseCode: FintechResponse.HTTP_UNAUTHORIZED,
                    responseData: null,
                });
            } else {
                console.error('Error verifying token:', error);
                return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
                    responseMessage: FintechResponse.getMessages().ERROR,
                    responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
                    responseData: null,
                });
            }
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
            responseMessage: FintechResponse.getMessages().ERROR,
            responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
            responseData: null,
        });
    }

};

import { Request, Response } from "express";
import Wallet from "../../database/models/Wallet";
import { FintechResponse } from "../../utils/FintechResponse";
import logger from "../../utils/Logger";


class UserController {

    /**===================================== View Wallet Balance ===================================== **/
    static async viewWalletBalance(req: Request, res: Response) {
        try {
            //****** Extracting The Middleware From The User Object  ********//
            const userId = req.user?.userID;
            if (!userId) {
                const errorMessage = FintechResponse.getMessages().ACCESSDENIED;
                logger.error(
                    `${errorMessage} - Content: ${JSON.stringify(userId)}`
                );
                return res.status(FintechResponse.HTTP_UNAUTHORIZED).json({
                    responseMessage: FintechResponse.getMessages().ACCESSDENIED,
                    responseCode: FintechResponse.HTTP_UNAUTHORIZED,
                    responseData: null,
                });
            }
            const wallets = await Wallet.findAll({ where: { userID: userId } });
            //*************** Retrieving Wallet Balance Information *************//
            const walletBalances = wallets.map((wallet) => ({
                currency: wallet.currency,
                balance: wallet.balance,
            }));
            logger.info(
                `${FintechResponse.getMessages().SUCCESS
                } - WalletBalances: ${JSON.stringify(walletBalances)}`
            );
            return res.status(FintechResponse.HTTP_OK).json({
                responseMessage: FintechResponse.getMessages().SUCCESS,
                responseCode: FintechResponse.HTTP_OK,
                responseData: walletBalances,
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

}

export default UserController;

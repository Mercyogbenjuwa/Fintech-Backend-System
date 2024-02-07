import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { FintechResponse } from '../../utils/FintechResponse';
import Transaction from '../../database/models/Transaction';
import User from '../../database/models/User';
import Wallet from '../../database/models/Wallet';
import logger from "../../utils/Logger";

class TransactionController {

    /**===================================== Funds Transfer ===================================== **/
    public static async fundsTransfer(req: Request, res: Response) {
        try {
            const { originatorAccountNumber, amount, currency, beneficiaryAccountNumber } = req.body;
            if (!originatorAccountNumber || !amount || !currency || !beneficiaryAccountNumber) {
                const requestBody = { ...req.body };
                const errorMessage = FintechResponse.getMessages().VALIDATIONERROR;
                logger.error(
                    `${errorMessage} - Request Body: ${JSON.stringify(requestBody)}`
                );
                return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
                    responseMessage: FintechResponse.responseMessages().VALIDATIONERROR,
                    responseCode: FintechResponse.HTTP_BAD_REQUEST,
                    responseData: { message: FintechResponse.getMessages().VALIDATIONERROR },
                });
            }
            //************ Check If Originator And Beneficiary Account Numbers Are Different **************//
            if (originatorAccountNumber === beneficiaryAccountNumber) {
                const errorMessage = FintechResponse.getMessages().ACCOUNTSNOTDIFFERENT;
                logger.error(`${errorMessage} - Accounts: ${JSON.stringify(originatorAccountNumber, beneficiaryAccountNumber)}`);
                return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
                    responseMessage: FintechResponse.getMessages().ACCOUNTSNOTDIFFERENT,
                    responseCode: FintechResponse.HTTP_BAD_REQUEST,
                    responseData: null,
                });
            }
            const originatorUser = await User.findOne({ where: { accountNumber: originatorAccountNumber } });
            if (!originatorUser) {
                const errorMessage = FintechResponse.getMessages().USERNOTFOUND;
                logger.error(`${errorMessage} - User: ${JSON.stringify(originatorUser)}`);
                return res.status(FintechResponse.HTTP_NOT_FOUND).json({
                    responseMessage: FintechResponse.getMessages().USERNOTFOUND,
                    responseCode: FintechResponse.HTTP_NOT_FOUND,
                    responseData: null,
                });
            }
            const originatorWallet = await Wallet.findOne({ where: { userID: originatorUser.userID, currency: currency } });
            if (!originatorWallet) {
                const errorMessage = FintechResponse.getMessages().NORECORD;
                logger.error(`${errorMessage} - WalletHolder: ${JSON.stringify(originatorWallet)}`);
                return res.status(FintechResponse.HTTP_NOT_FOUND).json({
                    responseMessage: FintechResponse.getMessages().NORECORD,
                    responseCode: FintechResponse.HTTP_NOT_FOUND,
                    responseData: null,
                });
            }
            //*********** Checking For Sufficient Funds ***********// 
            if (originatorWallet.balance < amount) {
                const errorMessage = FintechResponse.getMessages().INSUFFICIENTFUNDS;
                logger.error(`${errorMessage} - Requests: ${JSON.stringify(originatorWallet.balance, amount)}`);
                return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
                    responseMessage: FintechResponse.getMessages().INSUFFICIENTFUNDS,
                    responseCode: FintechResponse.HTTP_BAD_REQUEST,
                    responseData: null,
                });
            }
            //******** Debit Originator Wallet And Update Balance. *******/ 
            originatorWallet.balance -= amount;
            originatorWallet.currency = currency;
            await originatorWallet.save();
            const receiverUser = await User.findOne({ where: { accountNumber: beneficiaryAccountNumber } });
            if (!receiverUser) {
                const errorMessage = FintechResponse.getMessages().USERNOTFOUND;
                logger.error(`${errorMessage} - User: ${JSON.stringify(receiverUser)}`);
                return res.status(FintechResponse.HTTP_NOT_FOUND).json({
                    responseMessage: FintechResponse.getMessages().USERNOTFOUND,
                    responseCode: FintechResponse.HTTP_NOT_FOUND,
                    responseData: null,
                });
            }
            const receiverWallet = await Wallet.findOne({ where: { userID: receiverUser.userID, currency: currency } });
            if (!receiverWallet) {
                const errorMessage = FintechResponse.getMessages().WALLETNOTFOUND;
                logger.error(`${errorMessage} - Wallet: ${JSON.stringify(receiverWallet)}`);
                return res.status(FintechResponse.HTTP_NOT_FOUND).json({
                    responseMessage: FintechResponse.getMessages().WALLETNOTFOUND,
                    responseCode: FintechResponse.HTTP_NOT_FOUND,
                    responseData: null,
                });
            }
            //************** Credit Beneficiary Wallet And Update Balance. *************// 
            receiverWallet.balance += amount;
            receiverWallet.currency = currency;
            await receiverWallet.save();
            //*************** Creating Transaction Record ***************//
            const transactionReference = uuidv4();
            const existingTranRef = await Transaction.findOne({ where: { transactionReference } });
            if (existingTranRef) {
                const errorMessage = FintechResponse.getMessages().EXISTINGREFNO;
                logger.error(`${errorMessage} - Wallet: ${JSON.stringify(existingTranRef)}`);
                return res.status(FintechResponse.HTTP_CONFLICT).json({
                    responseMessage: FintechResponse.getMessages().EXISTINGREFNO,
                    responseCode: FintechResponse.HTTP_CONFLICT,
                    responseData: null,
                });
            }
            const transaction = await Transaction.create({
                senderID: originatorUser.userID,
                recipientID: receiverUser.userID,
                accountNumber: originatorAccountNumber,
                amount,
                transactionReference,
                status: 'SUCCESSFUL',
            });
            res.json({
                responseMessage: FintechResponse.getMessages().SUCCESS,
                responseCode: FintechResponse.HTTP_OK,
                responseData: {
                    originator: {
                        ...originatorWallet.toJSON(),
                        accountNumber: originatorUser.accountNumber,
                    },
                    receiver: {
                        ...receiverWallet.toJSON(),
                        accountNumber: receiverUser.accountNumber,
                    },
                },
            });
        } catch (error) {
            const errorMessage = FintechResponse.getMessages().ERROR;
            logger.error(`${errorMessage} Error: ${JSON.stringify(error)}`);
            return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
                responseMessage: FintechResponse.responseMessages().ERROR,
                responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
                responseData: null,
            });
        }
    }


    /**===================================== Transaction History ===================================== **/
    static async getTransactionHistory(req: Request, res: Response) {
        try {
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
            //************** Retrieve Transaction History For The User **************// 
            const transactions = await Transaction.findAll({
                where: {
                    [Op.or]: [{ senderID: userId }, { recipientID: userId }],
                },
                include: [
                    { model: User, as: 'Sender', attributes: ['username', 'email', 'accountNumber'] },
                    { model: User, as: 'Recipient', attributes: ['username', 'email', 'accountNumber'] },
                ],
                order: [['timestamp', 'DESC']],
            });
            logger.info(
                `${FintechResponse.getMessages().SUCCESS} -  TransactionsList: ${JSON.stringify(transactions)}`
            );
            return res.status(FintechResponse.HTTP_OK).json({
                responseMessage: FintechResponse.getMessages().SUCCESS,
                responseCode: FintechResponse.HTTP_OK,
                responseData: { transactions },
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
    }


}

export default TransactionController;

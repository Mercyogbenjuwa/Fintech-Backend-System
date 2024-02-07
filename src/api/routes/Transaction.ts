import express, { Request, Response } from "express";
import TransactionController from "../controllers/Transaction";
import { validateContentType } from "../../utils/ContentType";
import limiter from "../../utils/RateLimiting";
import { authenticateUser } from "../../middleware/auth";

//*************************************** Transaction Routes *****************************************//

const transactionRouter = express.Router();

transactionRouter.post(
  "/funds-transfer",
  validateContentType(["application/json"]),
  limiter,
  async (req: Request, res: Response) => {
    await TransactionController.fundsTransfer(req, res);
  }
);

transactionRouter.get(
  "/transaction-history",
  authenticateUser,
  limiter,
  TransactionController.getTransactionHistory
);

export default transactionRouter;

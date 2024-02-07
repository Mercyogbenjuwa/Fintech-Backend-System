import express from "express";
import AuthController from "../controllers/User";
import limiter from "../../utils/RateLimiting";
import { authenticateUser } from "../../middleware/auth";

//************************************** User Routes *****************************************//

const userRouter = express.Router();

userRouter.get(
  "/wallet/balance",
  authenticateUser,
  limiter,
  AuthController.viewWalletBalance
);

export default userRouter;

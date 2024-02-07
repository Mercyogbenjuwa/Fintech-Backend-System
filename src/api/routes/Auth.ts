import express, { Request, Response } from "express";
import AuthController from "../controllers/Auth";
import { validateContentType } from "../../utils/ContentType";

//*************************************** Authentication Routes *****************************************//

const authRouter = express.Router();

authRouter.post(
  "/register",
  validateContentType(["application/json"]),
  async (req: Request, res: Response) => {
    await AuthController.registerUser(req, res);
  }
);

authRouter.post(
  "/verify-token",
  validateContentType(["application/json"]),
  async (req: Request, res: Response) => {
    await AuthController.verifyToken(req, res);
  }
);

authRouter.post(
  "/login",
  validateContentType(["application/json"]),
  async (req: Request, res: Response) => {
    await AuthController.loginUser(req, res);
  }
);

export default authRouter;

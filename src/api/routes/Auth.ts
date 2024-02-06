import express, { Request, Response } from 'express';
import AuthController from '../controllers/Auth';
import {validateContentType} from "../../utils/Content-Type";
import limiter  from "../../utils/Rate-Limiting";

const userRouter = express.Router();


userRouter.post('/register', validateContentType(['application/json']), async (req: Request, res: Response) => {
  await AuthController.registerUser(req, res);
});


userRouter.post('/verify-token', async (req: Request, res: Response) => {
  await AuthController.verifyToken(req, res);
});

export default userRouter;

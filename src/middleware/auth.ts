// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import asyncHandler from 'express-async-handler';
// import User from '../database/models/User';
// import dotenv from 'dotenv';
// dotenv.config();



// const userAuthMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   let token;
//   if (req?.headers?.authorization?.startsWith("Bearer")) {
//     token = req.headers.authorization.split(" ")[1];
//     try {
//       if (token) {
//         const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
//         const userId = decoded?.id;
//         const user = await User.findByPk(userId);
//         if (user) {
//           req.user = user;
//           next();
//         } else {
//           res.status(403).json({ message: "Not Authorized, Please Login Again!" });
//         }
//       }
//     } catch (error) {
//       res.status(403).json({ message: "Not Authorized, Please Login Again!" });
//     }
//   } else {
//     res.status(401).json({ message: "There is no token attached to the header..." });
//   }
// });

// export default userAuthMiddleware;

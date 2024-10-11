import express from "express";
import { loginUser, registerUser, verifyOTP } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/verify-otp", verifyOTP); // OTP verification route

export default userRouter;

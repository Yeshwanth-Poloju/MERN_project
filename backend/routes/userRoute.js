import express from "express";
import { loginUser, registerUser, verifyOTP, forgotPassword, verifyPasswordResetOTP, resetPassword } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/verify-otp", verifyOTP); // OTP verification route
// Forgot password (send OTP)
userRouter.post("/forgot-password", forgotPassword);

// Verify OTP for password reset
userRouter.post("/verify-otp-reset", verifyPasswordResetOTP);

// Reset password after OTP verification
userRouter.post("/reset-password", resetPassword);

export default userRouter;

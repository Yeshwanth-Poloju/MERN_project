import express from "express";
import {
    loginUser,
    registerUser,
    verifyEmailOTP, // Import email OTP verification controller
    verifyPhoneOTP, // Import phone OTP verification controller
    forgotPassword,
    verifyPasswordResetOTP,
    resetPassword,
    verifyEmailLink
} from "../controllers/userController.js";

const userRouter = express.Router();

// Register a new user
userRouter.post("/register", registerUser);

// Login user
userRouter.post("/login", loginUser);

// Verify OTP for email and phone
userRouter.post("/verify-otp", async (req, res) => {
    console.log("verification method started");
    const { verificationMethod, phoneNumber, otp, email } = req.body; // Extract email, phoneNumber, and otp from the payload
    console.log(phoneNumber);
    if (verificationMethod === "email-otp") {
        // Call the verifyEmailOTP function with email and OTP
        return verifyEmailOTP(email, otp, req, res);
    } else if (verificationMethod === "sms-otp") {
        console.log("SMS verification method");
        // Call the verifyPhoneOTP function with phoneNumber and OTP
        return verifyPhoneOTP(phoneNumber, otp, req, res);
    } else {
        console.error("Invalid verification method");
        return res.status(400).json({ success: false, message: "Invalid verification method." });
    }
});


// Verify email link route (for email-link verification method)
userRouter.get("/verify-email", verifyEmailLink);

// Forgot password (send OTP)
userRouter.post("/forgot-password", forgotPassword);

// Verify OTP for password reset
userRouter.post("/verify-otp-reset", verifyPasswordResetOTP);

// Reset password after OTP verification
userRouter.post("/reset-password", resetPassword);

export default userRouter;

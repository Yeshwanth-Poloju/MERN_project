import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PasswordResetForm = ({ url, setShowLogin }) => {
    const [currentStep, setCurrentStep] = useState("ForgotPassword");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleForgotPassword = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${url}/api/user/forgot-password`, { email });
            if (response.data.success) {
                toast.success("OTP sent to your email. Please verify.");
                setCurrentStep("VerifyOtp");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("Failed to send OTP. Please try again.");
        }
    };

    const handleOtpVerification = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${url}/api/user/verify-otp-reset`, { email, otp });
            if (response.data.success) {
                toast.success("OTP verified. You can now reset your password.");
                setCurrentStep("ResetPassword");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("OTP verification failed. Please try again.");
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        // Validate that new password and confirm password match
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match. Please try again.");
            return;
        }

        try {
            const response = await axios.post(`${url}/api/user/reset-password`, { email, password: newPassword });
            if (response.data.success) {
                toast.success("Password reset successfully. Please log in.");
                setShowLogin(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("Failed to reset password. Please try again.");
        }
    };

    return (
        <div className="login-popup">
            <form className="login-popup-container">
                {currentStep === "ForgotPassword" && (
                    <>
                        <div className="login-popup-title">

                            <h2>Forgot Password</h2>
                        </div>
                        <div className="login-popup-inputs">
                            <input
                                name="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="Your email"
                                required
                            />
                        </div>
                        <button onClick={handleForgotPassword}>Send OTP</button>
                    </>
                )}

                {currentStep === "VerifyOtp" && (
                    <>
                        <div className="login-popup-title">
                            <h2>Verify OTP</h2>
                        </div>
                        <div className="login-popup-inputs">
                            <input
                                name="otp"
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                                type="text"
                                placeholder="Enter OTP"
                                required
                            />
                        </div>
                        <button onClick={handleOtpVerification}>Verify OTP</button>
                    </>
                )}

                {currentStep === "ResetPassword" && (
                    <>
                        <div className="login-popup-title">
                            <h2>Reset Password</h2>
                        </div>
                        <div className="login-popup-inputs">
                            <input
                                name="newPassword"
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                type="password"
                                placeholder="New password"
                                required
                            />
                            <input
                                name="confirmPassword"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                                type="password"
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                        <button onClick={handleResetPassword}>Reset Password</button>
                    </>
                )}
            </form>
        </div>
    );
};

export default PasswordResetForm;
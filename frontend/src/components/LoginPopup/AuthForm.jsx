import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthForm = ({ url, setToken, setShowLogin, setCurrentState }) => {
    const [currentState, setCurrentFormState] = useState("Login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verificationMethod, setVerificationMethod] = useState("email-otp");

    const handleAuth = async (event) => {
        event.preventDefault();

        if (otpSent) {
            // OTP verification for signup
            try {
                const payload = verificationMethod === "sms-otp"
                    ? { phoneNumber, otp, verificationMethod }
                    : { email, otp, verificationMethod };

                const response = await axios.post(`${url}/api/user/verify-otp`, payload);
                if (response.data.success) {
                    toast.success("OTP verified successfully. You can now log in.");
                    setOtpSent(false);
                    setCurrentFormState("Login");
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error("OTP verification failed. Please try again.");
            }
        } else {
            const endpoint = currentState === "Login" ? "/api/user/login" : "/api/user/register";
            const payload = currentState === "Login"
                ? { email, password }
                : { name, email, password, phoneNumber, verificationMethod };

            try {
                const response = await axios.post(`${url}${endpoint}`, payload);
                if (response.data.success) {
                    if (currentState === "Login") {
                        setToken(response.data.token);
                        localStorage.setItem("token", response.data.token);
                        toast.success("Login Successfully");
                        setShowLogin(false);
                    } else {
                        setOtpSent(true);
                        toast.success("Signup successful. Please check your email for verification.");
                    }
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <div className="login-popup">
            <form onSubmit={handleAuth} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{otpSent ? "Verify OTP" : currentState}</h2>
                </div>
                <div className="login-popup-inputs">
                    {!otpSent && currentState === "Sign Up" && (
                        <input
                            name="name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            placeholder="Your name"
                            required
                        />
                    )}

                    {!otpSent && (
                        <>
                            <input
                                name="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="Your email"
                                required
                            />
                            <input
                                name="phoneNumber"
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                value={phoneNumber}
                                type="tel"
                                placeholder="Your phone number"
                                required
                            />
                            <input
                                name="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type="password"
                                placeholder="Your password"
                                required
                            />

                            {currentState === "Sign Up" && (
                                <div className="verification-methods">
                                    <label>
                                        <input
                                            type="radio"
                                            value="email-otp"
                                            checked={verificationMethod === "email-otp"}
                                            onChange={() => setVerificationMethod("email-otp")}
                                        />
                                        Email OTP
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="sms-otp"
                                            checked={verificationMethod === "sms-otp"}
                                            onChange={() => setVerificationMethod("sms-otp")}
                                        />
                                        SMS OTP
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="email-link"
                                            checked={verificationMethod === "email-link"}
                                            onChange={() => setVerificationMethod("email-link")}
                                        />
                                        Email Verification Link
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {otpSent && (
                        <input
                            name="otp"
                            onChange={(e) => setOtp(e.target.value)}
                            value={otp}
                            type="text"
                            placeholder="Enter OTP"
                            required
                        />
                    )}
                </div>

                <button type="submit">{otpSent ? "Verify OTP" : currentState === "Login" ? "Login" : "Sign Up"}</button>                {!otpSent && currentState === "Login" && (
                    <p>
                        Forgot Password?{" "}
                        <span onClick={() => setCurrentState("Reset")}>Click here</span>
                    </p>
                )}
                {!otpSent && (
                    <p>
                        {currentState === "Login" ? (
                            <>
                                Don't have an account?{" "}
                                <span onClick={() => setCurrentFormState("Sign Up")}>Sign Up</span>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <span onClick={() => setCurrentFormState("Login")}>Login</span>
                            </>
                        )}
                    </p>
                )}
            </form>
        </div>
    );
};

export default AuthForm;

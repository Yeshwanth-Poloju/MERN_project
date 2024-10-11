import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthForm = ({ url, setToken, setShowLogin, setCurrentState }) => {
    const [currentState, setCurrentFormState] = useState("Login");  // For login/signup switch
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const handleAuth = async (event) => {
        event.preventDefault();

        if (otpSent) {
            // OTP verification for signup
            try {
                const response = await axios.post(`${url}/api/user/verify-otp`, { email, otp });
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
            // Login or Signup
            const endpoint = currentState === "Login" ? "/api/user/login" : "/api/user/register";
            const payload = currentState === "Login" ? { email, password } : { name, email, password };

            try {
                const response = await axios.post(`${url}${endpoint}`, payload);
                if (response.data.success) {
                    if (currentState === "Login") {
                        setToken(response.data.token);
                        localStorage.setItem("token", response.data.token);
                        toast.success("Login Successfully");
                        setShowLogin(false);
                    } else {
                        // If signup, send OTP for verification
                        setOtpSent(true);
                        toast.success("Signup successful. OTP sent to your email. Please verify.");
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
                                name="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type="password"
                                placeholder="Your password"
                                required
                            />
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

                <button type="submit">{otpSent ? "Verify OTP" : currentState === "Login" ? "Login" : "Sign Up"}</button>
                {!otpSent && currentState === "Login" && (
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

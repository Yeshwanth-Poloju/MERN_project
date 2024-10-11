import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext); 
  const [currentState, setCurrentState] = useState("Login");
  const [otpSent, setOtpSent] = useState(false);  // To track if OTP is sent
  const [otp, setOtp] = useState("");  // OTP input state
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onOtpChange = (event) => {
    setOtp(event.target.value);
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;

    if (otpSent) {
      // OTP verification step
      newUrl += "/api/user/verify-otp";
      try {
        const response = await axios.post(newUrl, { email: data.email, otp });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("OTP Verified, Login Successfully");
          setShowLogin(false);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error("OTP verification failed. Please try again.");
      }
    } else {
      // Initial login or sign-up step
      if (currentState === "Login") {
        newUrl += "/api/user/login";
      } else {
        newUrl += "/api/user/register";
      }

      try {
        const response = await axios.post(newUrl, data);
        if (response.data.success) {
          if (currentState === "Sign Up") {
            // OTP sent to email
            setOtpSent(true);  // Enable OTP input
            toast.success("OTP sent to your email. Please verify.");
          } else {
            // Login successful without OTP
            setToken(response.data.token);
            localStorage.setItem("token", response.data.token);
            toast.success("Login Successfully");
            setShowLogin(false);
          }
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          toast.error("API not found (404). Please check the URL.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      }
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{otpSent ? "Verify OTP" : currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="Close"
          />
        </div>
        <div className="login-popup-inputs">
          {!otpSent && (
            <>
              {currentState === "Sign Up" && (
                <input
                  name="name"
                  onChange={onChangeHandler}
                  value={data.name}
                  type="text"
                  placeholder="Your name"
                  required
                />
              )}
              <input
                name="email"
                onChange={onChangeHandler}
                value={data.email}
                type="email"
                placeholder="Your email"
                required
              />
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type="password"
                placeholder="Your password"
                required
              />
            </>
          )}

          {otpSent && (
            <input
              name="otp"
              onChange={onOtpChange}
              value={otp}
              type="text"
              placeholder="Enter OTP"
              required
            />
          )}
        </div>
        <button type="submit">
          {otpSent ? "Verify OTP" : currentState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        {!otpSent && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>
              By continuing, I agree to the terms of use & privacy policy.
            </p>
          </div>
        )}
        {!otpSent && currentState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          !otpSent && (
            <p>
              Already have an account?{" "}
              <span onClick={() => setCurrentState("Login")}>Login here</span>
            </p>
          )
        )}
      </form>
    </div>
  );
};

export default LoginPopup;

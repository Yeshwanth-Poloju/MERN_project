import React, { useState, useContext } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import AuthForm from "./AuthForm";
import PasswordResetForm from "./PasswordResetForm";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Auth");  // "Auth" for login/signup, "Reset" for forgot/reset

  return (
    <div className="login-popup">
      <div className="login-popup-title">
        <img
          onClick={() => setShowLogin(false)}
          src={assets.cross_icon}
          alt="Close"
        />
      </div>
      {currentState === "Auth" ? (
        <AuthForm url={url} setToken={setToken} setShowLogin={setShowLogin} setCurrentState={setCurrentState} />
      ) : (
        <PasswordResetForm url={url} setShowLogin={setShowLogin} />
      )}
    </div>
  );
};

export default LoginPopup;
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer";

// Function to generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Function to send OTP via email using Nodemailer
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Email Verification",
    text: `Your OTP is ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

// Register user with OTP
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Checking if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // Hashing user password
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP and save user
    const otp = generateOTP();
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      otp, // Store OTP in the database
    });

    const user = await newUser.save();

    // Send OTP to the user's email
    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: "User registered successfully. OTP sent to your email.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during registration" });
  }
};

// Create token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};


// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    if (user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid, set user as verified
    user.verified = true;
    user.otp = null; // Clear the OTP after verification
    await user.save();

    const token = createToken(user._id); // Create token for authenticated session
    res.json({ success: true, token, message: "OTP verified. You can now log in." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during OTP verification" });
  }
};

// Forgot password (send OTP to email)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp;
    await user.save();

    // Send OTP to user's email
    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: "OTP sent to your email for password reset." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during OTP generation" });
  }
};

// Verify OTP during password reset
const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    if (user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid, allow the user to reset their password
    res.json({ success: true, message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during OTP verification" });
  }
};

// Reset password after OTP verification
const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // Hash the new password and update the user record
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    user.otp = null; // Clear the OTP after successful password reset
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during password reset" });
  }
};

export { 
  loginUser, 
  registerUser, 
  verifyOTP, 
  forgotPassword, 
  verifyPasswordResetOTP, 
  resetPassword 
};


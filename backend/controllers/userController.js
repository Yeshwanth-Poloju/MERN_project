import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from 'dotenv';

dotenv.config();

// Twilio setup (for SMS OTP)
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Function to send OTP via email using Nodemailer
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
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

// Function to send OTP using Twilio Verify
const sendOTP = async (phoneNumber) => {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Your Verify service SID
  await twilioClient.verify.v2.services(serviceSid)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' });
};

// Function to verify OTP using Twilio Verify
const verifyOTP = async (phoneNumber, otp) => {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Your Verify service SID
  const verificationCheck = await twilioClient.verify.v2.services(serviceSid)
    .verificationChecks
    .create({ to: phoneNumber, code: otp });

  return verificationCheck.status === 'approved'; // Return whether the OTP is valid
};

// Function to send verification email link
const sendVerificationLink = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Click the link to verify your email: ${process.env.BASE_URL}/verify-email?token=${token}`,
  };

  await transporter.sendMail(mailOptions);
};

// Register user with OTP
const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber, verificationMethod } = req.body; // Extract phoneNumber and verificationMethod
  try {
    // Checking if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    let token, otp;
    let verificationStatus = "Pending"; // Set default verification status

    // Handle verification based on user's choice
    if (verificationMethod === "email-link") {
      // Email verification link
      token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      await sendVerificationLink(email, token); // Call the sendVerificationLink function
    } else if (verificationMethod === "email-otp") {
      // Email OTP
      otp = generateOTP();
      await sendOTPEmail(email, otp);
    } else if (verificationMethod === "sms-otp") {
      // SMS OTP
      otp = generateOTP();
      await sendOTP(phoneNumber, otp);
    } else {
      return res.json({ success: false, message: "Invalid verification method." });
    }

    const newUser = new userModel({
      name,
      email,
      phoneNumber,  
      password: hashedPassword,
      otp, // Only needed for OTP methods
      verified: false,
      verificationMethod,
      verificationStatus, // Store verification status
    });

    await newUser.save();

    res.json({
      success: true,
      message: `User registered successfully. Verification sent via ${verificationMethod}.`,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during registration" });
  }
};


// Verify OTP for email
const verifyEmailOTP = async (email, otp, req, res) => { // Changed parameters
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
    user.verificationStatus = "Verified"; // Update verification status
    user.otp = null; // Clear OTP after successful verification
    await user.save();

    const token = createToken(user._id); // Create token for authenticated session
    res.json({ success: true, token, message: "Email OTP verified. You can now log in." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during email OTP verification" });
  }
};


// Verify OTP for phone number
const verifyPhoneOTP = async (phoneNumber, otp, req, res) => { // Changed parameters
  try {
    const isValid = await verifyOTP(phoneNumber, otp); // Use the Twilio verify function
    console.log(phoneNumber);

    if (!isValid) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Find the user by phone number
    const user = await userModel.findOne({ phoneNumber });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    // OTP is valid, set user as verified
    user.verified = true;
    user.verificationStatus = "Verified"; // Update verification status
    await user.save();

    const token = createToken(user._id); // Create token for authenticated session
    res.json({ success: true, token, message: "Phone OTP verified. You can now log in." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during phone OTP verification" });
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

// Reset password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null; // Clear OTP after password reset
    await user.save();

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error during password reset" });
  }
};

// Verify Email Link
const verifyEmailLink = async (req, res) => {
  const { token } = req.query; // Assuming you send the token as a query parameter
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Mark user as verified
    user.verified = true;
    await user.save();

    res.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Invalid or expired token" });
  }
};

// Export controllers
export {
  loginUser,
  registerUser,
  verifyEmailOTP,
  verifyPhoneOTP,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  verifyEmailLink
};
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true }, // Optional phone number for SMS OTP
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    otp: { type: String }, // Temporary OTP storage
    verified: { type: Boolean, default: false }, // Email/SMS verification status (boolean)
    verificationStatus: { type: String, default: "Pending" }, // Tracks verification status ('Pending', 'Verified', 'Failed', etc.)
    verificationMethod: { type: String }, // 'email-link', 'email-otp', or 'sms-otp'
    verificationToken: { type: String }, // For email verification link (JWT token)
    cartData: { type: Object, default: {} },
  },
  { minimize: false }
);

// Ensures that if the model is already compiled, we don't compile it again.
const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;

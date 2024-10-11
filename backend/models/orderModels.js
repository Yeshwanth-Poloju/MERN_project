import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  razorpay_order_id: { type: String }, // Store Razorpay order ID for verification
  razorpay_payment_id: { type: String }, // Store Razorpay payment ID for reference
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;

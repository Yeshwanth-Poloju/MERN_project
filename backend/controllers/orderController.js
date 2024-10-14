import orderModel from "../models/orderModels.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,  // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_SECRET_KEY,  // Your Razorpay Secret
});

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";
  try {
    // Create an order in Razorpay first
    const options = {
      amount: req.body.amount * 100, // amount in the smallest currency unit (e.g., paise)
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`, // Use a unique receipt ID
      payment_capture: 1, // Automatically capture payment
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", razorpayOrder); // Log the Razorpay order

    // Now that we have the Razorpay order ID, save the order in our database
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      razorpay_order_id: razorpayOrder.id, // Save the Razorpay order ID here
    });

    const savedOrder = await newOrder.save(); // Save the order to the database
    console.log("Saved Order to DB:", savedOrder); // Log the saved order

    // Optionally, clear the user's cart
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Respond with the Razorpay order details
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error("Error creating order:", error); // Log the error
    res.json({ success: false, message: "Error creating order." });
  }
};


const verifyOrder = async (req, res) => {
  const { orderId, paymentId } = req.body; // Razorpay orderId and paymentId from frontend
  try {
    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(paymentId);

    // Check if the Razorpay order ID matches the one from the request
    if (paymentDetails.order_id === orderId) {
      console.log("Payment ID:", paymentId);
      console.log("Order ID:", orderId);
      console.log("Fetched Order ID from payment:", paymentDetails.order_id);

      // Find the order in the database using the Razorpay order ID
      const order = await orderModel.findOne({ razorpay_order_id: orderId }); // Use razorpay_order_id field
      console.log("Order from DB:", order); // Log the retrieved order

      if (order) {
        // Update the order as paid
        await orderModel.findByIdAndUpdate(order._id, { payment: true });
        res.json({ success: true, message: "Payment verified and order updated as paid." });
      } else {
        res.json({ success: false, message: "Order not found in the database." });
      }
    } else {
      // If payment failed, find the order and delete it using the Razorpay order ID
      await orderModel.findOneAndDelete({ razorpay_order_id: orderId }); // Use razorpay_order_id for deletion
      res.json({ success: false, message: "Payment failed. Order deleted." });
    }
  } catch (error) {
    console.log("Verification error:", error);
    res.json({ success: false, message: "Payment verification error" });
  }
};


// User orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({});
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// API for updating status
const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, {
        status: req.body.status,
      });
      res.json({ success: true, message: "Status Updated Successfully" });
    } else {
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };

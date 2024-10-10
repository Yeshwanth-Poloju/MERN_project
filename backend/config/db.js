import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://jdhruv90235:dhruv1192003@cluster0.arbb3.mongodb.net/mern-project');
    console.log("DB Connected");
  } catch (error) {
    console.error("DB Connection Failed", error);
  }
};

import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://yeshwanthpoloju:'+ (process.env.MONGOOSE_PASSWORD) + '@cluster0.zrjad.mongodb.net/mern-project');
    console.log("DB Connected");
  } catch (error) {
    console.error("DB Connection Failed", error);
  }
};

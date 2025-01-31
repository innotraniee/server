import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
    });

    console.log("mongodb connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    console.error("Error code:", error.code);
    console.error("Stack trace:", error.stack);
  }
};
export default connectDB;

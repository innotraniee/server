import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./utils/db.js";
import dotenv from "dotenv";
import contactRoutes from "./routes/Contact.js";
import CVerifyRoute from "./routes/Verify.js";
import formSubmissionRoutes from "./routes/registration.js";
import Razorpay from "razorpay";
import submit from "./routes/submit.js";
import createOrder from "./routes/createOrder.js";

dotenv.config({});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use("/api/contact", contactRoutes);
app.use("/api/c-verify", CVerifyRoute);
app.use("/api/form", formSubmissionRoutes);
app.use("/api/submit", submit);
app.use("/api/create-order", createOrder);

const port = process.env.PORT;
app.listen(port, () => {
  connectDB();
  console.log(`Server running at port ${port}`);
});

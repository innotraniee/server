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
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
     "https://sdk.cashfree.com",
      "https://sandbox.cashfree.com",
      "https://innotraniee.in"
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); 
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
};

app.use(cors(corsOptions));

app.get("/api/test", (req, res) => {
  res.send("Hello, this is test route!");
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

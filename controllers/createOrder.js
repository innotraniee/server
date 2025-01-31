import Form from "../models/registration.js";
import { subDays } from "date-fns";
import { instance } from "../index.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({});

export const createOrder = async (req, res) => {
  try {
    const formData = req.body;

    const DaysGap = subDays(new Date(), 28);
    const emailAddress = formData.email;
    const user = await Form.findOne({
      emailAddress,
      createdAt: { $lte: DaysGap }, 
    });

    if (!user) {
      return res.status(400).json({
        message:
          "User does not exist or has not completed the 28-day criteria.",
      });
    }

    const amount = 99;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    const order = await instance.orders.create(options);
    
    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID, 
      orderId: order.id, 
      amount: order.amount, 
      currency: "INR", 
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Error creating order" });
  }
};

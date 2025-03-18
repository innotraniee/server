import dotenv from "dotenv";
import Form from "../models/registration.js";

dotenv.config();

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_KEY_SECRET = process.env.CASHFREE_KEY_SECRET;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "PRODUCTION";

export const createOrder = async (req, res) => {
  try {
    const formData = req.body;
    const emailAddress = formData.email;

    const user = await Form.findOne({
      emailAddress,
    });

    if (!user) {
      return res.status(400).json({
        message:
          "User does not exist or has not completed the 28-day criteria.",
      });
    }

    const amount = 99; 
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const customerId =
      formData.email.replace(/[^a-zA-Z0-9_-]/g, "_") ||
      user.contactNumber ||
      `user_${Date.now()}`;

    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: formData.name,
        customer_email: emailAddress,
        customer_phone: user.contactNumber,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/response?order_id={order_id}&status=success`,
        notify_url: `${process.env.BACKEND_URL}/api/submit`,
      },
      payment_option: {
        payment_methods: 'upi'
      }
    };

    const cashfreeApiUrl =
      CASHFREE_ENV === "PRODUCTION"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    const orderResponse = await fetch(cashfreeApiUrl, {
      method: "POST",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_KEY_SECRET,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const orderResponseData = await orderResponse.json();

    const paymentSessionId = orderResponseData.payment_session_id;
    
    if (!orderResponse.ok) {
      console.error("Failed to create order:", orderResponseData);
      return res.status(500).json({
        message: "Failed to create order. Please try again.",
        error: orderResponseData,
      });
    }

    const sessionApiUrl =
      CASHFREE_ENV === "PRODUCTION"
        ? "https://api.cashfree.com/pg/orders/sessions"
        : "https://sandbox.cashfree.com/pg/orders/sessions";

        
    const sessionRequest = {
      order_id: orderResponseData.order_id, 
      payment_session_id: paymentSessionId, 
      payment_method: {
        upi:{
           channel: "link"
        }
      }
    };

    const sessionResponse = await fetch(sessionApiUrl, {
      method: "POST",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_KEY_SECRET,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionRequest),
    });

    const sessionResponseData = await sessionResponse.json();

    if (!sessionResponse.ok) {
      console.error("Failed to create session:", sessionResponseData);
      return res.status(500).json({
        message: "Failed to create payment session. Please try again.",
        error: sessionResponseData,
      });
    }
    res.status(200).json({
      orderId: orderResponseData.order_id,
      amount: orderResponseData.order_amount,
      currency: orderResponseData.order_currency,
      paymentSessionId: paymentSessionId, 
      paymentsUrl: orderResponseData.payments.url,
      refundUrl: orderResponseData.refunds.url,
      settlementsUrl: orderResponseData.settlements.url,
      CASHFREE_APP_ID: CASHFREE_APP_ID,
    });
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    res.status(500).json({
      error: "Error creating order",
      message: error.message,
    });
  }
};

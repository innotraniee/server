import axios from "axios";
import dotenv from "dotenv";

dotenv.config({});

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "LIVE"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

// Initialize Payment

export const initializePayment = async ({
  orderId,
  orderAmount,
  customerName,
  customerEmail,
  customerPhone,
}) => {
  try {
    const url = `${CASHFREE_BASE_URL}/orders`;
    console.log("API URL being called:", url); // Log the full URL

    const headers = {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": process.env.CASHFREE_APP_ID, // Ensure this is correct
      "x-client-secret": process.env.CASHFREE_SECRET_KEY, // Ensure this is correct
    };

    const customerId = customerEmail.replace(/[^a-zA-Z0-9_-]/g, "");

    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `http://localhost:5173/payment/response?order_id=${orderId}`,
      },
    };

    console.log("Request payload:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (response.status === 401) {
      const errorMessage = `Authentication failed. Please check your API credentials. Response status: ${response.status}`;
      console.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: {
          status: response.status,
          headers: response.headers,
        },
      };
    }

    const data = await response.json();
    console.log("Response data:", data);

    // Check if the response contains a payment session ID
    if (response.ok && data.payment_session_id) {
      return {
        success: true,
        paymentSessionId: data.payment_session_id,
        paymentId: data.order_id,
      };
    } else {
      console.error("Failed response from Cashfree:", data);
      throw new Error(data.message || "Failed to create payment session.");
    }
  } catch (error) {
    console.error("Error initializing payment:", error.message);
    return {
      success: false,
      message: error.message,
      error: {
        status: error.status,
        headers: error.headers,
      },
    };
  }
};

// Verify Payment
export const verifyPayment = async (orderId) => {
  try {
    // Define the request URL and headers for verifying the payment
    const url = `${CASHFREE_BASE_URL}/orders/${orderId}`;
    const headers = {
      "x-client-id": APP_ID,
      "x-client-secret": SECRET_KEY,
    };

    // Send the request to verify the payment
    const response = await axios.get(url, { headers });

    // Check if the payment status is successful
    if (response.data && response.data.order_status === "PAID") {
      return { success: true, paymentDetails: response.data };
    } else {
      return { success: false, message: "Payment not successful." };
    }
  } catch (error) {
    // Log and handle errors
    console.error(
      "Error verifying payment:",
      error.response?.data || error.message
    );
    return { success: false, message: error.message };
  }
};

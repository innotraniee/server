import Contact from "../models/Contact.js";
import createTransporter from "../utils/email.js";
import dotenv from "dotenv";
dotenv.config();

export const createContact = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ReceiverEmail,
      subject: "New Contact Form Submission",
      text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ message: "Contact form submitted successfully!" });
  } catch (error) {
    console.error("Error saving contact form:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import ProjectSubmission from "../models/ProjectSubmission.js";
import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import createTransporter from "../utils/email.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({});

export const submitProject = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ...formData
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details. Please try again.",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const pdfDirectory = join(__dirname, "pdfs");

    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    const pdfTemplatePath = path.resolve("templates", "certificate.pdf");
    const existingPdfBytes = fs.readFileSync(pdfTemplatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const pageHeight = firstPage.getHeight();

    const adjustedYFromTop = (distanceFromTop) => pageHeight - distanceFromTop;
    const { name, internshipDomain, cId, startDate, endDate } = formData;

    const titleCaseName = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    firstPage.drawText(titleCaseName, {
      x: 268.56,
      y: adjustedYFromTop(250.04),
      size: 35,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    firstPage.drawText(internshipDomain, {
      x: 320.0,
      y: adjustedYFromTop(345.36),
      size: 19,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    firstPage.drawText(`${startDate} to`, {
      x: 513.72,
      y: adjustedYFromTop(367.36),
      size: 12,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    firstPage.drawText(endDate, {
      x: 592.84,
      y: adjustedYFromTop(367.36),
      size: 12,
      color: rgb(0, 0, 0),
      font: boldFont,
    });
    firstPage.drawText(cId, {
      x: 478.08,
      y: adjustedYFromTop(15.84),
      size: 12,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    const pdfFilename = `${name.replace(/ /g, "_")}_Certificate.pdf`;
    const pdfOutputPath = join(pdfDirectory, pdfFilename);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfOutputPath, pdfBytes);

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: formData.email,
      subject: "Project Submission Confirmation | InnoTraniee",
      html: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2c3e50;">Dear ${formData.name},</h2>
    <p>Congratulations on successfully completing your internship with us as a role of ${formData.internshipDomain} from ${formData.startDate} to ${formData.endDate}.</p>
    <p>We are thrilled to have had you as a part of our team and appreciate the effort and dedication you put into your work. It was a pleasure seeing you grow and contribute to our projects.</p>
    <p>As a token of our appreciation, please find your internship completion certificate attached to this email.</p>
    <p>We wish you all the best in your future endeavors and hope to collaborate with you again in the future!</p>
    <p>Thank you for being an incredible part of the InnoTraniee journey.</p>
    <p>Best regards,<br>
    <strong>Team InnoTraniee</strong></p>
  </div>
`,
      attachments: [
        {
          filename: pdfFilename,
          path: pdfOutputPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    if (fs.existsSync(pdfOutputPath)) {
      fs.unlinkSync(pdfOutputPath);
    } else {
      console.warn(`File not found for deletion: ${pdfOutputPath}`);
    }

    const newProjectSubmission = new ProjectSubmission({
      ...formData,
      cId,
    });

    await newProjectSubmission.save();
    transporter.setMaxListeners(20);

    res
      .status(200)
      .json({ success: true, message: "Project submission successful!" });
  } catch (error) {
    console.error("Error submitting project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

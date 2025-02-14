import Form from "../models/registration.js";
import { subMonths } from "date-fns";
import fs from "fs";
import createTransporter from "../utils/email.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import dotenv from "dotenv";
dotenv.config();

export const submitForm = async (req, res) => {
  try {
    const formData = req.body;

    const oneMonthAgo = subMonths(new Date(), 1);
    const email = formData.emailAddress;
    const existingEntry = await Form.findOne({
      email,
      createdAt: { $gte: oneMonthAgo },
    });

    if (existingEntry) {
      return res.status(400).json({
        message: "You cannot submit the form more than once within a month.",
      });
    }

    const newForm = new Form(formData);
    await newForm.save();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const pdfDirectory = join(__dirname, "pdfs");

    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // Load the template PDF
    const pdfTemplatePath = path.resolve("templates", "offer_letter.pdf");
    const existingPdfBytes = fs.readFileSync(pdfTemplatePath);

    // Create the PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const pageHeight = firstPage.getHeight();

    const formatDate = (date) => {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    };

    const issueDate = new Date();
    const oneMonthLater = new Date(issueDate);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const formattedStartDate = formatDate(issueDate);
    const formattedEndDate = formatDate(oneMonthLater);
    const name = formData.name;
    const preferredDomain = formData.preferredDomain
    const adjustedYFromTop = (distanceFromTop) => pageHeight - distanceFromTop;

    firstPage.drawText(name, {
      x: 62.60,
      y: adjustedYFromTop(224.64),
      size: 12,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    firstPage.drawText(preferredDomain, {
      x: 390,
      y: adjustedYFromTop(279.64),
      size: 10,
      color: rgb(0, 0, 0),
      font: boldFont,
    });

    firstPage.drawText(formattedStartDate, {
      x: 340.40,
      y: adjustedYFromTop(338.4),
      size: 9,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(formattedStartDate, {
      x: 448.64,
      y: adjustedYFromTop(223.2),
      size: 12,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(formattedEndDate, {
      x: 450.64,
      y: adjustedYFromTop(338.4),
      size: 9,
      color: rgb(0, 0, 0),
    });

    const pdfFilename = `${name.replace(/ /g, "_")}_Offer_Letter.pdf`;
    const pdfOutputPath = join(pdfDirectory, pdfFilename);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfOutputPath, pdfBytes);

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: formData.emailAddress,
      subject: "Offer Letter | InnoTraniee Internship Program",
      html: `Congratulations, <b>${name}</b>! You've been selected for the InnoTraniee Internship Program
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>We are pleased to inform you that you have been selected for the <strong>InnoTraniee Internship Program</strong>.</p>
        
        <h3 style="color: #0066cc;">Tasks/Projects Below</h3>
        <h4 style="color: #0066cc;"><a href="https://innotraniee.in/">Click here to get projects</a> go to internship tab and click on projects link</h4>
        <p>Start your exciting journey with InnoTraniee by following the links below:</p>
        <ul>
          <li><strong>Follow our LinkedIn page</strong>: <a href="https://www.linkedin.com/company/innotraniee">Click here</a></li>
          <li><strong>Follow us on Instagram</strong>: <a href="https://www.instagram.com/innotraniee">Click here</a></li>
        </ul>
        <p><em>*Join all the links above to stay updated daily.</em></p>
        
        <h3 style="color: #0066cc;">Important Guidelines</h3>
        <p>During your internship, please make sure to follow these guidelines:</p>
        <ul>
          <li>Update your LinkedIn Profile and share all your achievements (Offer Letter/Internship Completion Certificate) tagging @InnoTraniee and using the hashtag #innotraniee.</li>
          <li>Ensure your code is original. If any project or code is found to be copied, your internship will be terminated.</li>
          <li>Share a video of the completed task on LinkedIn, tag @InnoTraniee, and use #innotraniee.</li>
          <li>For a tech internship, maintain a separate GitHub repository (name it <strong>InnoTraniee</strong>) for all tasks. You will be asked to share the GitHub link in the task submission form.</li>
        </ul>

        <h3 style="color: #0066cc;">Internship Timeline</h3>
        <p><strong>Internship Start Date:</strong> ${formattedStartDate}</p>
        <p><strong>Task Submission Deadline:</strong> ${formattedEndDate}</p>
        
        <h3 style="color: #0066cc;">Task Submission Link</h3>
        <p>Visit our website to access and submit your tasks at internship page</p>
        
        <p>You can also join open-source industry projects to collaborate and contribute to the development process.</p>

        <p>Once again, congratulations on your selection for the InnoTraniee Internship Program!</p>

        <h3 style="color: #0066cc;">Contact Details</h3>
        <p>If you have any questions or queries, feel free to contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:innotraniee@gmail.com">innotraniee@gmail.com</a></li>
          <li><strong>Website:</strong> <a href="https://innotraniee.in/">innotraniee</a></li>
        </ul>
        
        <p>Best Regards, <br> Team InnoTraniee</p>
        <footer style="font-size: 0.9em; text-align: center;">
          <p><strong>InnoTraniee</strong> | Internship Program</p>
        </footer>
      </div>
    `,
      attachments: [
        {
          filename: pdfFilename,
          path: pdfOutputPath,
        },
      ],
    };

    // Send email with PDF attachment
    await transporter.sendMail(mailOptions);

    // Clean up and delete the PDF file after sending the email
    if (fs.existsSync(pdfOutputPath)) {
      fs.unlinkSync(pdfOutputPath);
    } else {
      console.warn(`File not found for deletion: ${pdfOutputPath}`);
    }

    // Respond back to the client
    res.status(200).json({ message: "Form submitted successfully." });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

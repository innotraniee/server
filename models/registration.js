import mongoose from "mongoose";

const FormSchema = new mongoose.Schema(
  {
    emailAddress: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    preferredDomain: { type: String, required: true },
    college: { type: String, required: true },
    contactNumber: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    qualification: { type: String, required: true },
    currentYear: { type: String, required: true },
    linkedInAndInstagram: { type: Boolean, default: false },
    acknowledgment: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", FormSchema);
export default Form;

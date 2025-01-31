import mongoose from "mongoose";

const ProjectSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    internshipDomain: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tasksPerformed: { type: Number, required: true },
    taskLinks: { type: [String], required: true },
    githubLinks: { type: [String], required: true },
    cId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProjectSubmission = mongoose.model(
  "ProjectSubmission",
  ProjectSubmissionSchema
);
export default ProjectSubmission;

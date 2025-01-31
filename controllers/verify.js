import ProjectSubmission from "../models/ProjectSubmission.js";

export const verify = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: "Code is required" });
  }

  try {
    const certificate = await ProjectSubmission.findOne({ code });

    if (certificate) {
      return res.status(200).json({ valid: true, message: "Code is valid" });
    } else {
      return res
        .status(404)
        .json({ valid: false, message: "Code is not valid" });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    return res
      .status(500)
      .json({ valid: false, message: "Server error. Please try again later." });
  }
};

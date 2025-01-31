import express  from "express"
import { submitProject } from"../controllers/projectSubmissionController.js";
const router = express.Router();

router.post("/", submitProject);


export default router;

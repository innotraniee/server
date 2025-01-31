import express from "express";
import { verify } from "../controllers/verify.js";

const router = express.Router();

router.post("/", verify);

export default router;

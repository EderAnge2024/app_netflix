import express from "express";
import { register, login, recoverPassword, verifyEmail } from "./controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post('/recover-password',recoverPassword)
router.post('/verirfy-email',verifyEmail)

export default router;

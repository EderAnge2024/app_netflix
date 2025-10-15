import express from "express";
import { register, login, verifyEmail, requestCode, verifyCodeAndResetPassword, verifyCodeOnly } from "./controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post('/verify-email', verifyEmail);
router.post('/request-code', requestCode);
router.post('/verify-code-reset', verifyCodeAndResetPassword);
router.post('/verify-code', verifyCodeOnly);

export default router;

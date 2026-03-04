import { Router } from "express";
import { AuthController } from "../controllers/auth";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", authController.login);

export { authRouter };
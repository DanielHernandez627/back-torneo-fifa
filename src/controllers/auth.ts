import { Request, Response } from "express";
import { errorHandler } from "../utilities/error.handler";
import { AuthService } from "../services/auth.service";

export class AuthController {
    private authService = new AuthService();

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const token = await this.authService.login(email, password);
            res.json({ token });
        } catch (error) {
            errorHandler(res, 401, error);
        }
    }
}
import { Request, Response } from "express";
import { errorHandler } from "../utilities/error.handler";
import { AuthService } from "../services/auth.service";

export class AuthController {
    private authService = new AuthService();

    register = async (req: Request<{}, {}, { username?: string }>, res: Response) => {
        try {
            const username = req.body.username?.trim() || '';
            const user = await this.authService.registerWithFirebaseToken(req.headers.authorization, username);
            res.status(201).json({ user });
        } catch (error) {
            const maybeStatus = (error as { statusCode?: number }).statusCode;
            errorHandler(res, maybeStatus ?? 400, error);
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const user = await this.authService.loginWithFirebaseToken(req.headers.authorization);
            res.json({ user });
        } catch (error) {
            const maybeStatus = (error as { statusCode?: number }).statusCode;
            errorHandler(res, maybeStatus ?? 401, error);
        }
    }
}
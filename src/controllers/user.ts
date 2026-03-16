import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { errorHandler } from "../utilities/error.handler";
import { User as UserModel } from "../models/user.model";

export class UserController {
    private userService = new UserService();

    checkUsernameAvailability = async (req: Request<{}, {}, {}, { username?: string }>, res: Response) => {
        try {
            const username = req.query.username?.trim();
            if (!username) {
                throw new Error("username query param is required");
            }

            const available = await this.userService.isUsernameAvailable(username);
            res.json({ username, available });
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getUserById = async ( req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const user = await this.userService.getUserById(id);
            res.json(user);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createUser = async (req: Request<{}, {}, UserModel>, res: Response) => {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateUser = async (req: Request<{ id: string }, {}, Partial<UserModel>>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const user = await this.userService.updateUser(id, req.body);
            res.json(user);
        }catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteUser = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await this.userService.deleteUser(id);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
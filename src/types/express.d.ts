import { AuthenticatedUserModel } from "../models/authenticated-user.model";

declare module "express-serve-static-core" {
    interface Request {
        user?: AuthenticatedUserModel;
    }
}

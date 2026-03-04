import { JwtPayloadModel } from "../models/jwt-payload.model";

declare module "express-serve-static-core" {
    interface Request {
        user?: JwtPayloadModel;
    }
}

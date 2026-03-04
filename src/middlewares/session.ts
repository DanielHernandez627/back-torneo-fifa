import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyToken } from "../utilities/jwt.handler";

const getBearerToken = (authorization?: string): string | null => {
    if (!authorization) {
        return null;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ message: "Missing or invalid Authorization header" });
        }

        const decoded = verifyToken(token);
        req.user = decoded;

        return next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ message: "Token expired" });
        }

        if (error instanceof JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(401).json({ message: "Unauthorized" });
    }
};

export { checkJwt };
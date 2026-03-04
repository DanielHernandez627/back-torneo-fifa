import { env } from "../config/env";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { JwtPayloadModel } from "../models/jwt-payload.model";


const JWT_SECRET = env.JWT_SECRET;

const isTokenPayload = (decoded: string | JwtPayload): decoded is JwtPayload & JwtPayloadModel => {
    return (
        typeof decoded !== "string" &&
        typeof decoded.id === "string" &&
        typeof decoded.userName === "string"
    );
};

const generateToken = (id: string, userName: string): string => {
    const payload = { id, userName };
    const token = sign(payload, JWT_SECRET, { expiresIn: "2h" });
    return token;
};

const verifyToken = (token: string): JwtPayloadModel => {
    const decoded = verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded)) {
        throw new Error("Invalid token payload");
    }

    return {
        id: decoded.id,
        userName: decoded.userName,
    };
};

export { generateToken, verifyToken };
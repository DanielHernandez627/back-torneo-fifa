import { Router } from "express";
import { UserController } from "../controllers/user";
import { checkJwt } from "../middlewares/session";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/:id", checkJwt, userController.getUserById);
userRouter.post("/", userController.createUser);
userRouter.put("/:id", checkJwt, userController.updateUser);
userRouter.delete("/:id", checkJwt, userController.deleteUser);

export { userRouter };

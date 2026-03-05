import { Router } from "express";
import { UserController } from "../controllers/user";
import { checkJwt } from "../middlewares/session";

const userRouter = Router();
const userController = new UserController();

/**
 * @openapi
 * /user:
 *   post:
 *     tags:
 *       - User
 *     summary: Registrar usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /user/{id}:
 *   get:
 *     tags:
 *       - User
 *     summary: Obtener usuario por id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 *   put:
 *     tags:
 *       - User
 *     summary: Actualizar usuario por id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Datos inválidos
 *   delete:
 *     tags:
 *       - User
 *     summary: Eliminar usuario por id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */

userRouter.get("/:id", checkJwt, userController.getUserById);
userRouter.post("/", userController.createUser);
userRouter.put("/:id", checkJwt, userController.updateUser);
userRouter.delete("/:id", checkJwt, userController.deleteUser);

export { userRouter };

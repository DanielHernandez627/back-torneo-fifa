import { Router } from "express";
import { MatchController } from "../controllers/match";
import { checkJwt } from "../middlewares/session";

const matchesRouter = Router();
const matchController = new MatchController();

/**
 * @openapi
 * /matches:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Obtener todos los partidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de partidos
 *       401:
 *         description: No autorizado
 *   post:
 *     tags:
 *       - Matches
 *     summary: Crear partido
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Partido creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /matches/{id}:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Obtener partido por id
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
 *         description: Partido encontrado
 *       404:
 *         description: Partido no encontrado
 *   put:
 *     tags:
 *       - Matches
 *     summary: Actualizar partido por id
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
 *         description: Partido actualizado
 *       400:
 *         description: Datos inválidos
 *   delete:
 *     tags:
 *       - Matches
 *     summary: Eliminar partido por id
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
 *         description: Partido eliminado
 *       404:
 *         description: Partido no encontrado
 */

matchesRouter.get("/", checkJwt, matchController.getAllMatches);
matchesRouter.get("/:id", checkJwt, matchController.getMatchById);
matchesRouter.post("/", checkJwt, matchController.createMatch);
matchesRouter.put("/:id", checkJwt, matchController.updateMatch);
matchesRouter.delete("/:id", checkJwt, matchController.deleteMatch);

export { matchesRouter };

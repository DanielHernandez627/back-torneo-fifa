import { Router } from "express";
import { TeamController } from "../controllers/team";
import { checkJwt } from "../middlewares/session";

const teamsRouter = Router();
const teamController = new TeamController();

/**
 * @openapi
 * /teams:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Obtener todos los equipos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipos
 *       401:
 *         description: No autorizado
 *   post:
 *     tags:
 *       - Teams
 *     summary: Crear equipo
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
 *         description: Equipo creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /teams/{id}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Obtener equipo por id
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
 *         description: Equipo encontrado
 *       404:
 *         description: Equipo no encontrado
 *   put:
 *     tags:
 *       - Teams
 *     summary: Actualizar equipo por id
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
 *         description: Equipo actualizado
 *       400:
 *         description: Datos inválidos
 *   delete:
 *     tags:
 *       - Teams
 *     summary: Eliminar equipo por id
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
 *         description: Equipo eliminado
 *       404:
 *         description: Equipo no encontrado
 */

teamsRouter.get("/", checkJwt, teamController.getAllTeams);
teamsRouter.get("/:id", checkJwt, teamController.getTeamById);
teamsRouter.post("/", checkJwt, teamController.createTeam);
teamsRouter.put("/:id", checkJwt, teamController.updateTeam);
teamsRouter.delete("/:id", checkJwt, teamController.deleteTeam);

export { teamsRouter };

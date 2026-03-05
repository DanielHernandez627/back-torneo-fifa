import { Router } from "express";
import { PhaseController } from "../controllers/phase";
import { checkJwt } from "../middlewares/session";

const phaseRouter = Router();
const phaseController = new PhaseController();

/**
 * @openapi
 * /phase:
 *   get:
 *     tags:
 *       - Phase
 *     summary: Obtener todas las fases
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fases
 *       401:
 *         description: No autorizado
 *   post:
 *     tags:
 *       - Phase
 *     summary: Crear fase
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
 *         description: Fase creada
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /phase/{id}:
 *   get:
 *     tags:
 *       - Phase
 *     summary: Obtener fase por id
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
 *         description: Fase encontrada
 *       404:
 *         description: Fase no encontrada
 *   put:
 *     tags:
 *       - Phase
 *     summary: Actualizar fase por id
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
 *         description: Fase actualizada
 *       400:
 *         description: Datos inválidos
 *   delete:
 *     tags:
 *       - Phase
 *     summary: Eliminar fase por id
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
 *         description: Fase eliminada
 *       404:
 *         description: Fase no encontrada
 */

phaseRouter.get("/", checkJwt, phaseController.getAllPhases);
phaseRouter.get("/:id", checkJwt, phaseController.getPhaseById);
phaseRouter.post("/", checkJwt, phaseController.createPhase);
phaseRouter.put("/:id", checkJwt, phaseController.updatePhase);
phaseRouter.delete("/:id", checkJwt, phaseController.deletePhase);

export { phaseRouter };

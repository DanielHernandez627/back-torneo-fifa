import { Router } from "express";
import { TournamentController } from "../controllers/tournament";
import { checkJwt } from "../middlewares/session";

const tournamentsRouter = Router();
const tournamentController = new TournamentController();

/**
 * @openapi
 * /tournaments:
 *   get:
 *     tags:
 *       - Tournaments
 *     summary: Obtener todos los torneos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de torneos
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Crear torneo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tournament'
 *     responses:
 *       201:
 *         description: Torneo creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /tournaments/{id}:
 *   get:
 *     tags:
 *       - Tournaments
 *     summary: Obtener torneo por id
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
 *         description: Torneo encontrado
 *       404:
 *         description: Torneo no encontrado
 *   put:
 *     tags:
 *       - Tournaments
 *     summary: Actualizar torneo por id
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
 *         description: Torneo actualizado
 *       400:
 *         description: Datos inválidos
 *   delete:
 *     tags:
 *       - Tournaments
 *     summary: Eliminar torneo por id
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
 *         description: Torneo eliminado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @openapi
 * /tournaments/{id}/standings:
 *   get:
 *     tags:
 *       - Tournaments
 *     summary: Obtener tabla de posiciones de un torneo
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
 *         description: Posiciones del torneo
 *       400:
 *         description: Solicitud inválida
 */

/**
 * @openapi
 * /tournaments/{id}/fixtures/league:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Generar fixture de liga para un torneo
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
 *             properties:
 *               phaseId:
 *                 type: integer
 *               doubleRound:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Fixture de liga generado
 *       400:
 *         description: Datos inválidos
 * /tournaments/{id}/fixtures/quadrangular:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Generar fase cuadrangular
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
 *             properties:
 *               sourcePhaseId:
 *                 type: integer
 *               targetPhaseId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Fase cuadrangular generada
 *       400:
 *         description: Datos inválidos
 * /tournaments/{id}/fixtures/final:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Generar fase final
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
 *             properties:
 *               sourcePhaseId:
 *                 type: integer
 *               targetPhaseId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Fase final generada
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /tournaments/matches/{matchId}/result:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Registrar resultado de partido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeTeamScore
 *               - awayTeamScore
 *             properties:
 *               homeTeamScore:
 *                 type: integer
 *               awayTeamScore:
 *                 type: integer
 *               overwrite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Resultado registrado
 *       400:
 *         description: Datos inválidos
 * /tournaments/phases/{phaseId}/close:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Cerrar fase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fase cerrada
 *       400:
 *         description: Solicitud inválida
 * /tournaments/{id}/phases/advance:
 *   post:
 *     tags:
 *       - Tournaments
 *     summary: Avanzar torneo a la siguiente fase
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
 *         description: Torneo avanzado a siguiente fase
 *       400:
 *         description: Solicitud inválida
 */

tournamentsRouter.get("/", checkJwt, tournamentController.getAllTournaments);
tournamentsRouter.get("/:id", checkJwt, tournamentController.getTournamentById);
tournamentsRouter.get("/:id/standings", checkJwt, tournamentController.getStandings);
tournamentsRouter.post("/", checkJwt, tournamentController.createTournament);
tournamentsRouter.post("/:id/fixtures/league", checkJwt, tournamentController.generateLeagueFixture);
tournamentsRouter.post("/:id/fixtures/quadrangular", checkJwt, tournamentController.generateQuadrangular);
tournamentsRouter.post("/:id/fixtures/final", checkJwt, tournamentController.generateFinal);
tournamentsRouter.post("/matches/:matchId/result", checkJwt, tournamentController.registerMatchResult);
tournamentsRouter.post("/phases/:phaseId/close", checkJwt, tournamentController.closePhase);
tournamentsRouter.post("/:id/phases/advance", checkJwt, tournamentController.advanceToNextPhase);
tournamentsRouter.put("/:id", checkJwt, tournamentController.updateTournament);
tournamentsRouter.delete("/:id", checkJwt, tournamentController.deleteTournament);

export { tournamentsRouter };

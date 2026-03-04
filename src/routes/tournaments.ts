import { Router } from "express";
import { TournamentController } from "../controllers/tournament";
import { checkJwt } from "../middlewares/session";

const tournamentsRouter = Router();
const tournamentController = new TournamentController();

tournamentsRouter.get("/", checkJwt, tournamentController.getAllTournaments);
tournamentsRouter.get("/:id", checkJwt, tournamentController.getTournamentById);
tournamentsRouter.post("/", checkJwt, tournamentController.createTournament);
tournamentsRouter.put("/:id", checkJwt, tournamentController.updateTournament);
tournamentsRouter.delete("/:id", checkJwt, tournamentController.deleteTournament);

export { tournamentsRouter };

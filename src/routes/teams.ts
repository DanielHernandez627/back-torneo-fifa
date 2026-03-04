import { Router } from "express";
import { TeamController } from "../controllers/team";
import { checkJwt } from "../middlewares/session";

const teamsRouter = Router();
const teamController = new TeamController();

teamsRouter.get("/", checkJwt, teamController.getAllTeams);
teamsRouter.get("/:id", checkJwt, teamController.getTeamById);
teamsRouter.post("/", checkJwt, teamController.createTeam);
teamsRouter.put("/:id", checkJwt, teamController.updateTeam);
teamsRouter.delete("/:id", checkJwt, teamController.deleteTeam);

export { teamsRouter };

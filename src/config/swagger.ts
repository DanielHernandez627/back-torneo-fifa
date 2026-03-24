import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

const port = process.env.PORT || 3000;

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Back Torneo FIFA API",
			version: "1.0.0",
			description: "Documentación de endpoints del backend de torneos FIFA",
		},
		servers: [
			{
				url: `http://localhost:${port}/api/v1`,
				description: "Servidor local",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
					AuthRegisterRequest: {
						type: "object",
						required: ["username"],
						properties: {
							username: { type: "string", example: "fifa_master" },
						},
					},
					AuthLoginRequest: {
						type: "object",
						description: "No request body is required. Send Firebase ID token in Authorization: Bearer <token>",
						properties: {},
					},
					AuthLoginResponse: {
						type: "object",
						properties: {
							user: {
								type: "object",
								properties: {
									id: { type: "string", example: "12" },
									userName: { type: "string", example: "fifa_master" },
									firebaseUid: { type: "string", example: "8h4D3rP..." },
									email: { type: "string", format: "email", example: "user@mail.com" },
									emailVerified: { type: "boolean", example: true },
									provider: { type: "string", example: "firebase" },
								},
							},
						},
					},
				Tournament: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						name: { type: "string", example: "Torneo Apertura" },
						type: { type: "string", example: "LEAGUE" },
					},
				},
				ErrorResponse: {
					type: "object",
					properties: {
						message: { type: "string", example: "Error de validación" },
					},
				},
			},
		},
	},
	apis: [path.join(__dirname, "../routes/*.ts"), path.join(__dirname, "../controllers/*.ts")],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

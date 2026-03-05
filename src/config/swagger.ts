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
					AuthLoginRequest: {
						type: "object",
						required: ["email", "password"],
						properties: {
							email: { type: "string", format: "email", example: "user@mail.com" },
							password: { type: "string", example: "123456" },
						},
					},
					AuthLoginResponse: {
						type: "object",
						properties: {
							token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
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

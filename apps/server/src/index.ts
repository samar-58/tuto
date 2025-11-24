import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@tuto/api/context";
import { appRouter } from "@tuto/api/routers/index";
import { auth } from "@tuto/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AccessToken } from "livekit-server-sdk";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.get("/getToken", async (c) => {
	console.log("Getting token");
	console.log(c.req.query());
	try {
		const roomName = c.req.query("roomName") as string;
		const participantName = c.req.query("participantName") as string;

		if (!roomName || !participantName) {
			return c.json({ error: "Missing roomName or participantName" }, 400);
		}

		// const session = await auth.api.getSession({
		// 	headers: c.req.raw.headers,
		// });

		// // Check if user is authenticated
		// if (!session?.user?.id) {
		// 	return c.json({ error: "User not authenticated" }, 401);
		// }


		// Generate token only if room exists
		const at = new AccessToken(Bun.env.LIVEKIT_API_KEY!, Bun.env.LIVEKIT_API_SECRET!, {
			identity: participantName,
		});

		at.addGrant({
			roomJoin: true,
			room: roomName,
			canPublish: true,
			canSubscribe: true,
		});

		const token = await at.toJwt();

		console.log("Generated Token for existing room:", roomName);

		return c.json({ token });
	} catch (error) {
		console.error("Error generating token:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
})


export default app;

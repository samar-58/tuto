import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@tuto/api/context";
import { appRouter } from "@tuto/api/routers/index";
import { auth } from "@tuto/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AccessToken } from "livekit-server-sdk";
import prisma from "@tuto/db";

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

		// Check if user is authenticated
		//   const session = await auth.api.getSession({
		// 	headers: fromNodeHeaders(c.header),
		//   });

		//   if (!session?.user?.id) {
		// 	return c.status(401);
		// 	  error: "User not authenticated"
		// 	});


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

app.post("/createMeeting", async (c) => {
	try {
		// Get authenticated user from session
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		// Check if user is authenticated
		if (!session?.user?.id) {
			return c.json({ error: "User not authenticated" }, 401);
		}

		const { name, description, id } = await c.req.json() as { name: string, description: string, id: string };

		if (!name || !description) {
			return c.json({ error: "Name and description are required" }, 400);
		}

		if (!id) {
			return c.json({ error: "Meeting ID is required" }, 400);
		}

		// Create meeting with authenticated user's ID
		const meeting = await prisma.meeting.create({
			data: {
				id,
				name,
				description,
				userId: session.user.id, // Use authenticated user's ID from session
			}
		});

		return c.json({ meeting }, 201);
	} catch (error) {
		console.error("Error creating meeting:", error);
		return c.json({ error: "Failed to create meeting" }, 500);
	}
})

app.get("/allRecordings", async (c) => {
	// Get authenticated user from session
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user?.id) {
		return c.json({ error: "User not authenticated" }, 401);
	}
	try {
		const meetings = await prisma.meeting.findMany({
			where: {
				userId: session.user.id,
				hasEgress: true
			}
		});
		return c.json({ meetings });
	} catch (error) {
		console.error("Error fetching meetings:", error);
		return c.json({ error: "Failed to fetch meetings" }, 500);
	}
})

export default app;

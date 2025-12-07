import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@tuto/api/context";
import { appRouter } from "@tuto/api/routers/index";
import { auth } from "@tuto/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AccessToken } from "livekit-server-sdk";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, smoothStream, stepCountIs, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { serve } from '@hono/node-server';
import prisma from "@tuto/db";
import { randomUUID } from "node:crypto";


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
	try {
		const roomName = c.req.query("roomName") as string;
		const participantName = c.req.query("participantName") as string;
		const role = (c.req.query("role") as 'tutor' | 'student') || 'tutor';

		if (!roomName || !participantName) {
			return c.json({ error: "Missing roomName or participantName" }, 400);
		}

		// Generate token with role metadata
		const at = new AccessToken(Bun.env.LIVEKIT_API_KEY!, Bun.env.LIVEKIT_API_SECRET!, {
			identity: participantName,
			metadata: JSON.stringify({ role }),
		});

		at.addGrant({
			roomJoin: true,
			room: roomName,
			canPublish: true,
			canSubscribe: true,
		});

		const token = await at.toJwt()
		console.log(`Generated token for ${participantName} as ${role}`)

		return c.json({ token });
	} catch (error) {
		console.error("Error generating token:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
})

app.post("/summarize", async (c) => {
	const { messages, meetingId }: { messages: UIMessage[]; meetingId: string } = await c.req.json();

	
	return createUIMessageStreamResponse({
		stream: createUIMessageStream({
		  execute: ({ writer: dataStream }) => {
			const result = streamText({
			  messages: convertToModelMessages(messages),
			  model: openai("gpt-4o-mini"),
			  system: "You are a helpful assistant that summarizes text.",
			  temperature: 0.7,
			  stopWhen: stepCountIs(20),
			  experimental_transform: smoothStream({
				delayInMs: 10,
				chunking: "line",
			  }),
			  maxRetries: 3,

			});
			result.consumeStream();
			dataStream.merge(
			  result.toUIMessageStream({
				sendReasoning: true,
			  }),
			);
		  },
		  onFinish: async ({ messages }) => {
			await Promise.all(
				messages.map(async (message) => {
					const parts = JSON.parse(JSON.stringify(message.parts));
					await prisma.summarizedText.create({
						data: {
							id: randomUUID(),
							parts,
							role: message.role,
							meetingId: meetingId,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});
				}),
			);
			console.log(messages);
		  },
		  onError: (error) => {
			console.error(`Error : ${error}`)
			return error instanceof Error ? error.message : String(error)
		  },
		}),
	});
});

export default serve({ fetch: app.fetch, port: 3000 });

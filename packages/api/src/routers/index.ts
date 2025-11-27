import { protectedProcedure, publicProcedure, router } from "../index";
import { engressRouter } from "./engress";
import { getTokenRouter } from "./get-token";
import { meetingRouter } from "./meeting";
import { videoToMp3Router } from "./video-to-mp3";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	engress: engressRouter,
	getToken: getTokenRouter,	
	meeting: meetingRouter,
	videoToMp3: videoToMp3Router,
});


export type AppRouter = typeof appRouter;

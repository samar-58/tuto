import { protectedProcedure, publicProcedure, router } from "../index";
import { engressRouter } from "./engress";
import { getTokenRouter } from "./get-token";

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
});


export type AppRouter = typeof appRouter;

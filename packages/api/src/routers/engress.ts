import { protectedProcedure, router } from "../index";
import { z } from "zod";
import { getEgressInfo, startEngress } from "../engress/start-engress";
import { stopEngress } from "../engress/stop-engress";
import { Effect } from "effect";



export const engressRouter = router({
	startEngress: protectedProcedure
		.input(
			z.object({
				roomName: z.string(),
				userName: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return Effect.runPromise(startEngress(input.roomName, input.userName));
		}),
	getEgressInfo: protectedProcedure
		.input(
			z.object({
				egressId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return Effect.runPromise(getEgressInfo(input.egressId));
		}),
	stopEngress: protectedProcedure
		.input(
			z.object({
				egressId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return Effect.runPromise(stopEngress(input.egressId));
		}),
});

export type EngressRouter = typeof engressRouter;
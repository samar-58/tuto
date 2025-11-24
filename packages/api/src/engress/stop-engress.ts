import { Effect } from "effect";
import { EgressClient } from "livekit-server-sdk";


export const stopEngress = (egressId: string) => Effect.gen(function* () {
    if (!egressId) {
        yield* Effect.die(new Error("Egress ID is required"));
    }
    const egressClient = yield* Effect.succeed(new EgressClient(Bun.env.LIVEKIT_URL!, Bun.env.LIVEKIT_API_KEY!, Bun.env.LIVEKIT_API_SECRET!));
    const egressInfo = yield* Effect.promise(() => egressClient.stopEgress(egressId));
    return egressInfo;
});
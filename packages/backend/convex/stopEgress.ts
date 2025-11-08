"use node";
import { EgressClient } from "livekit-server-sdk";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;

export const stopEgress = action(async (ctx, { egressId }: { egressId: string }) => {
    if (!egressId) {
        throw new Error("Egress ID is required");
    }

    const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

    try {
        const result = await egressClient.stopEgress(egressId);
        // If result is available, egress completed successfully
        const status = result ? "completed" : "stopped";
        await ctx.runMutation(internal.engress.ingressStore.patchIngressData, {
            egressId,
            status,
            result,
        });
        return { success: true, egressId };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // If already stopped/aborted, treat as success
        if (errorMessage.includes('EGRESS_ABORTED') || errorMessage.includes('cannot be stopped')) {
            await ctx.runMutation(internal.engress.ingressStore.patchIngressData, {
                egressId,
                status: "stopped",
                result: null,
            });
            return { success: true, egressId };
        }
        
        throw error;
    }
});
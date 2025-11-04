"use node";
import { EgressClient } from "livekit-server-sdk";
import { action } from "./_generated/server";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;

export const stopEgress = action(async (ctx, { egressId }: { egressId: string }) => {
    if (!egressId) {
        throw new Error("Egress ID is required");
    }

    const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

    try {
        await egressClient.stopEgress(egressId);
        console.log(`Egress stopped with ID: ${egressId}`);
        return { success: true, egressId };
    } catch (error) {
        console.error("Failed to stop egress:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to stop recording");
    }
});
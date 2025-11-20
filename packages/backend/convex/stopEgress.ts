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
        await egressClient.stopEgress(egressId);
        
        // Wait a moment for egress to finalize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the final egress status to extract file URLs
        const egressList = await egressClient.listEgress({
            egressId: egressId,
        });
        
        const egressInfo = egressList[0];
        if (!egressInfo) {
            throw new Error(`Egress info not found for ID: ${egressId}`);
        }
        
        // Extract only serializable fields from the result
        const serializableResult: Record<string, any> = {};
        
        // The result is a discriminated union, check the case
        const result = egressInfo.result;
        
        if (result && result.case === "segments") {
            const segmentsInfo = result.value;
            serializableResult.playlistName = segmentsInfo.playlistName || null;
            serializableResult.livePlaylistName = segmentsInfo.livePlaylistName || null;
            serializableResult.playlistLocation = segmentsInfo.playlistLocation || null;
            serializableResult.duration = segmentsInfo.duration || null;
            serializableResult.size = segmentsInfo.size || null;
            serializableResult.segmentCount = segmentsInfo.segmentCount || null;
        } else if (result && result.case === "file") {
            const fileInfo = result.value;
            serializableResult.filename = fileInfo.filename || null;
            serializableResult.location = fileInfo.location || null;
            serializableResult.size = fileInfo.size || null;
        }
        
        // Map LiveKit status enum to string
        const statusMap: Record<string, string> = {
            "EGRESS_COMPLETE": "completed",
            "EGRESS_ENDING": "ending",
            "EGRESS_FAILED": "failed",
            "EGRESS_ABORTED": "aborted",
            "EGRESS_ACTIVE": "active",
        };
        const status = statusMap[egressInfo.status] || "stopped";
        
        await ctx.runMutation(internal.engress.ingressStore.patchIngressData, {
            egressId,
            status,
            result: Object.keys(serializableResult).length > 0 ? serializableResult : null,
        });
        
        return { 
            success: true, 
            egressId,
            status,
            playlistUrl: serializableResult.playlistName || null,
        };
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
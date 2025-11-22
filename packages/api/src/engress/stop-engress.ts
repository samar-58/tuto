import { EgressClient } from "livekit-server-sdk";

export const stopEngress = async (egressId: string) => {
    if (!egressId) {
        throw new Error("Egress ID is required");
    }

    const egressClient = new EgressClient(Bun.env.LIVEKIT_URL!, Bun.env.LIVEKIT_API_KEY, Bun.env.LIVEKIT_API_SECRET);

    try {
        const result = await egressClient.stopEgress(egressId);
        return result;
    } catch (error) {
        console.error("Failed to stop egress:", error)
    }
}
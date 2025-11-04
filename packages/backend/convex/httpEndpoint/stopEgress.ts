import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const stopEgress = httpAction(async (ctx, request) => {
    const { egressId } = await request.json();

    if (!egressId) {
        return new Response(JSON.stringify({ error: "egressId is required" }), {
            status: 400,
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                Vary: "Origin",
            })
        });
    }

    try {
        const result = await ctx.runAction(api.stopEgress.stopEgress, { egressId });
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                Vary: "Origin",
            })
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error }), {
            status: 500,
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                Vary: "Origin",
            })
        });
    }
});
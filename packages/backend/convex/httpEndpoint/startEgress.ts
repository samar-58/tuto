import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const startEgress = httpAction(async (ctx, request) => {
    const { roomName,username } = await request.json();
    
    if (!roomName) {
        return new Response(JSON.stringify({ error: "roomName is required" }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
    if (!username) {
        return new Response(JSON.stringify({ error: "username is required" }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    try {
        const egressInfo = await ctx.runAction(api.startEgress.startEgress, { roomName,username });
        return new Response(JSON.stringify(egressInfo), { 
            status: 200, 
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3001",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                Vary: "Origin",
            })
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error}), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
 });
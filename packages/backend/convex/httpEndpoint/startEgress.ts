import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const startEgress = httpAction(async (ctx, request) => {
    // Get user identity from the HTTP request
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //     return new Response(JSON.stringify({ error: "User not authenticated" }), {
    //         status: 401,
    //         headers: new Headers({
    //             "Content-Type": "application/json",
    //             "Access-Control-Allow-Origin": "*",
    //             "Access-Control-Allow-Methods": "POST, OPTIONS",
    //             "Access-Control-Allow-Headers": "Content-Type",
    //             Vary: "Origin",
    //         })
    //     });
    // }

    const { roomName, username } = await request.json();
    
    if (!roomName) {
        return new Response(JSON.stringify({ error: "roomName is required" }), {
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
    if (!username) {
        return new Response(JSON.stringify({ error: "username is required" }), {
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
        // Pass userId to the action since auth context doesn't flow through ctx.runAction
        const egressInfo = await ctx.runAction(api.startEgress.startEgress, { 
            roomName, 
            username,
           // userId: identity.subject 
        });
        return new Response(JSON.stringify(egressInfo), {
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
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
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
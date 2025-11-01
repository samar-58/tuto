import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export const getToken = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const roomName = url.searchParams.get("roomName");
    const userName = url.searchParams.get("userName");
    
    if (!roomName || !userName) {
        return new Response("roomName and userName are required", { status: 400 });
    }
    
    const token = await ctx.runAction(api.generateToken.generateToken, { roomName, userName });
    return new Response(token , { status: 200 , headers: new Headers({
        "Access-Control-Allow-Origin": "http://localhost:3001",
        Vary: "origin",
      })});
 });
 
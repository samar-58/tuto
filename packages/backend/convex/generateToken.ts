"use node";
import { AccessToken } from "livekit-server-sdk";
import { action } from "./_generated/server";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;

export const generateToken = action(async (ctx, { roomName, userName }: { roomName: string; userName: string }) => {
   if(!roomName || !userName) {
      throw new Error("Room name and user name are required");
   }

   const at = new AccessToken(API_KEY, API_SECRET, {
      identity: userName,
      name: userName,
   });

   at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt(); 
  return token;
});
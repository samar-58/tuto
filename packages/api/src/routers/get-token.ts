import { protectedProcedure, router } from "../index";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";

const API_KEY = Bun.env.LIVEKIT_API_KEY;
const API_SECRET = Bun.env.LIVEKIT_API_SECRET;


export const generateToken = async ({
  roomName,
  userName,
}: {
  roomName: string;
  userName: string;
}) => {
  if (!roomName || !userName) {
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
};

export const getTokenRouter = router({
  getToken: protectedProcedure
    .input(
      z.object({
        roomName: z.string(),
        participantName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { roomName, participantName } = input;
      return generateToken({ roomName, userName: participantName });
    }),
});


export type GetTokenRouter = typeof getTokenRouter; 
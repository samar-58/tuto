import { Room } from "livekit-client";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";


export async function joinRoom(roomName: string, identity: string): Promise<Room> {
  let room: Room;


  const trpc = useTRPC();
  const { data: token } = useQuery(trpc.getToken.getToken.queryOptions({
    roomName: roomName,
    participantName: identity,
  }));

  if (!token) {
    throw new Error("Token is missing");
  }

  room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  if (!import.meta.env.VITE_LIVEKIT_URL) {
    throw new Error("LiveKit URL is missing");
  }

  await room.connect(import.meta.env.VITE_LIVEKIT_URL, token);

  console.log(" Connected to room:", room.name);
  room.on("dataReceived", (payload, participant) => {
    const message = new TextDecoder().decode(payload);
    console.log(`${participant?.identity}: ${message}`);
  });
  return room;
}

export function sendMessage(msg: string, room: Room) {
  if (!room) return;
  room.localParticipant.publishData(
    new TextEncoder().encode(msg),
    { reliable: true }
  );
  console.log("Sent:", msg);
}

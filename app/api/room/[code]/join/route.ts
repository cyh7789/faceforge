import {
  requestBody,
  requestedCard,
  roomErrorResponse,
} from "@/lib/rooms/http";
import { roomStore } from "@/lib/rooms/server";

interface RoomContext {
  params: Promise<{ code: string }>;
}

export async function POST(request: Request, context: RoomContext) {
  try {
    const { code } = await context.params;
    const card = requestedCard(await requestBody(request));
    const { playerToken } = await roomStore.join(code, card);
    return Response.json({ playerToken });
  } catch (error) {
    return roomErrorResponse(error);
  }
}

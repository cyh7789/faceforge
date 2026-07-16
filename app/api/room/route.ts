import {
  requestBody,
  requestedCard,
  roomErrorResponse,
} from "@/lib/rooms/http";
import { roomStore } from "@/lib/rooms/server";

export async function POST(request: Request) {
  try {
    const card = requestedCard(await requestBody(request));
    const credentials = await roomStore.create(card);
    return Response.json(credentials, { status: 201 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}

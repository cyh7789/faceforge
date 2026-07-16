import {
  requestBody,
  requestedPick,
  requestedToken,
  roomErrorResponse,
} from "@/lib/rooms/http";
import { roomStore } from "@/lib/rooms/server";
import { roomView } from "@/lib/rooms/view";

interface RoomContext {
  params: Promise<{ code: string }>;
}

export async function POST(request: Request, context: RoomContext) {
  try {
    const { code } = await context.params;
    const body = await requestBody(request);
    const token = requestedToken(body);
    const action =
      body.action === "forfeit"
        ? ({ type: "forfeit" } as const)
        : ({ type: "pick", pick: requestedPick(body) } as const);
    const room = await roomStore.update(code, token, action);
    return Response.json(roomView(room, token));
  } catch (error) {
    return roomErrorResponse(error);
  }
}

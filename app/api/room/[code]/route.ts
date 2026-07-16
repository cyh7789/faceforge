import { roomErrorResponse } from "@/lib/rooms/http";
import { roomStore } from "@/lib/rooms/server";
import { roomView } from "@/lib/rooms/view";

interface RoomContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: Request, context: RoomContext) {
  try {
    const { code } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const room = await roomStore.get(code, token);
    return Response.json(roomView(room, token));
  } catch (error) {
    return roomErrorResponse(error);
  }
}

import { InMemoryRoomStore } from "./store";

const roomStoreGlobal = globalThis as typeof globalThis & {
  faceForgeRoomStore?: InMemoryRoomStore;
};

// This in-memory adapter is for next dev and single-process self-hosting.
// Serverless multi-instance deployments must replace it with the KV RoomStore adapter.
export const roomStore =
  roomStoreGlobal.faceForgeRoomStore ?? new InMemoryRoomStore();

roomStoreGlobal.faceForgeRoomStore = roomStore;

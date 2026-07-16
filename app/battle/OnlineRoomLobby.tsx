"use client";

import { useState } from "react";

import { isPresetCard } from "@/lib/engine/presets";
import type { Card } from "@/lib/engine/types";

import { onlineRoomErrorMessage } from "./OnlineBattle";
import styles from "./battle.module.css";

export interface OnlineRoomSession {
  code: string;
  token: string;
}

interface OnlineRoomControlsProps {
  card?: Card;
  joinCode: string;
  pending: boolean;
  error: string;
  onJoinCodeChange: (code: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function OnlineRoomControls({
  card,
  joinCode,
  pending,
  error,
  onJoinCodeChange,
  onCreate,
  onJoin,
}: OnlineRoomControlsProps) {
  const cardName = card
    ? isPresetCard(card)
      ? card.nameEn
      : card.class.nameEn
    : null;

  return (
    <section className={styles.onlineLobbyPanel} aria-labelledby="online-room-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>ONLINE ROOM</p>
          <h2 id="online-room-title">Create or join</h2>
        </div>
        <span>LAN ready</span>
      </div>
      <p className={styles.onlineSelectedCard}>
        {cardName ? `Playing as ${cardName}` : "Pick your hero above first"}
      </p>
      {error && <p className={styles.onlineLobbyError} role="alert">{error}</p>}
      <div className={styles.onlineLobbyActions}>
        <button type="button" onClick={onCreate} disabled={!card || pending}>
          <strong>Create Room</strong>
          <small>建立四位數房號</small>
        </button>
        <span>OR</span>
        <div>
          <label htmlFor="online-room-code">Room code</label>
          <input
            id="online-room-code"
            value={joinCode}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="one-time-code"
            placeholder="1234"
            onChange={(event) => onJoinCodeChange(event.target.value)}
          />
          <button
            type="button"
            onClick={onJoin}
            disabled={!card || joinCode.length !== 4 || pending}
          >
            <strong>Join Room</strong>
            <small>輸入房號加入</small>
          </button>
        </div>
      </div>
    </section>
  );
}

interface OnlineRoomLobbyProps {
  card?: Card;
  onConnected: (session: OnlineRoomSession) => void;
}

export default function OnlineRoomLobby({
  card,
  onConnected,
}: OnlineRoomLobbyProps) {
  const [joinCode, setJoinCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function changeJoinCode(value: string) {
    setJoinCode(value.replace(/\D/g, "").slice(0, 4));
    setError("");
  }

  async function connect(kind: "create" | "join") {
    if (!card) {
      return;
    }
    if (kind === "join" && !/^\d{4}$/.test(joinCode)) {
      setError("Enter a 4-digit room code.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const code = kind === "join" ? joinCode : "";
      const response = await fetch(
        kind === "create" ? "/api/room" : `/api/room/${code}/join`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ card }),
        },
      );
      const body = (await response.json()) as {
        code?: string;
        playerToken?: string;
        error?: string;
      };
      if (!response.ok || !body.playerToken) {
        setError(onlineRoomErrorMessage(body.error));
        return;
      }
      onConnected({
        code: kind === "create" ? body.code ?? "" : code,
        token: body.playerToken,
      });
    } catch {
      setError(onlineRoomErrorMessage());
    } finally {
      setPending(false);
    }
  }

  return (
    <OnlineRoomControls
      card={card}
      joinCode={joinCode}
      pending={pending}
      error={error}
      onJoinCodeChange={changeJoinCode}
      onCreate={() => void connect("create")}
      onJoin={() => void connect("join")}
    />
  );
}

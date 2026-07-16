"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { CLASS_ASSETS } from "@/lib/engine/assets";
import {
  BATTLE_STATS,
  type BattleRound,
} from "@/lib/engine/battle";
import { isPresetCard } from "@/lib/engine/presets";
import type { Card, StatKey } from "@/lib/engine/types";
import type { OnlineRoomView } from "@/lib/rooms/view";

import styles from "./battle.module.css";

const ROOM_POLL_MS = 1_500;
const REVEAL_DURATION_MS = 1_800;

const STAT_LABELS: Readonly<Record<StatKey, { label: string; name: string }>> = {
  hp: { label: "HP", name: "生命" },
  mp: { label: "MP", name: "魔力" },
  def: { label: "DEF", name: "防禦" },
  agi: { label: "AGI", name: "敏捷" },
  luk: { label: "LUK", name: "幸運" },
  grit: { label: "GRT", name: "韌性" },
};

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function nextRoundToAnimate(
  seenRoundCount: number,
  rounds: readonly BattleRound[],
): BattleRound | null {
  return rounds.length > seenRoundCount ? rounds.at(-1) ?? null : null;
}

export function onlineRoomErrorMessage(code?: string): string {
  switch (code) {
    case "ROOM_FULL":
      return "房間已滿 · Room full. 換個房號，或建立新房再戰。";
    case "ROOM_NOT_FOUND":
      return "找不到房間 · Room not found. 檢查四位數房號，或建立新房。";
    case "ROOM_EXPIRED":
      return "房間已過期 · Room expired. 建立新房就能重新開戰。";
    case "UNAUTHORIZED":
      return "玩家連結失效 · Player link expired. 返回大廳重新加入。";
    case "OUT_OF_TURN":
      return "回合剛剛換人 · Turn changed. 戰況會自動更新。";
    case "STAT_USED":
      return "這項能力用過了 · Stat already used. 請挑另一項。";
    case "OPPONENT_CONNECTED":
      return "對手回來了 · Opponent reconnected. 繼續對戰吧。";
    default:
      return "連不上房間 · Could not reach the room. 檢查網路後重試，或返回大廳。";
  }
}

function cardNameEn(card: Card): string {
  return isPresetCard(card) ? card.nameEn : card.class.nameEn;
}

function cardName(card: Card): string {
  return isPresetCard(card) ? card.name : card.class.name;
}

interface OnlineBattleScreenProps {
  room: OnlineRoomView;
  revealedRound: BattleRound | null;
  pending: boolean;
  error: string;
  onPick: (pick: StatKey) => void;
  onForfeit: () => void;
  onLeave: () => void;
}

export function OnlineBattleScreen({
  room,
  revealedRound,
  pending,
  error,
  onPick,
  onForfeit,
  onLeave,
}: OnlineBattleScreenProps) {
  const opponent = room.player === "A" ? "B" : "A";
  const yourTurn = room.turn === room.player;
  const opponentThinking =
    room.phase !== "waiting" &&
    room.phase !== "complete" &&
    room.turn === opponent;
  const status =
    room.phase === "waiting"
      ? "WAITING"
      : room.phase === "complete"
        ? "FINAL"
        : "LIVE";

  return (
    <main className={`${styles.battlePage} phone-shell`}>
      <header className={styles.arenaHeader}>
        <button type="button" onClick={onLeave}>Leave Room</button>
        <div>
          <p>ONLINE ROOM · {room.code}</p>
          <h1>Battle Arena</h1>
        </div>
        <span>{status}</span>
      </header>

      {error && (
        <aside className={styles.onlineError} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onLeave}>
            返回大廳 · Back to Lobby
          </button>
        </aside>
      )}

      {room.phase === "waiting" ? (
        <section className={styles.waitingRoom} aria-live="polite">
          <div className={styles.waitingSpinner} aria-hidden="true" />
          <p className={styles.eyebrow}>ROOM READY</p>
          <h2>Waiting for Player 2</h2>
          <p>Share this room code with the other phone</p>
          <strong className={styles.roomCode}>{room.code}</strong>
          <div className={styles.onlineWaitingCards}>
            <FighterCard card={room.cards.A} label="PLAYER 1" />
            <div className={styles.onlineEmptyFighter}>
              <span aria-hidden="true">?</span>
              <strong>Player 2</strong>
              <small>等待加入</small>
            </div>
          </div>
        </section>
      ) : room.cards.B ? (
        <section className={styles.onlineArena}>
          <div className={styles.onlineScore} aria-label={`Score ${room.score.A} to ${room.score.B}`}>
            <span>P1</span>
            <strong>{room.score.A} — {room.score.B}</strong>
            <span>P2</span>
          </div>

          <div className={styles.onlineFighters}>
            <FighterCard
              card={room.cards.A}
              label={room.player === "A" ? "YOU · P1" : "OPPONENT · P1"}
              thinking={opponentThinking && opponent === "A"}
            />
            <FighterCard
              card={room.cards.B}
              label={room.player === "B" ? "YOU · P2" : "OPPONENT · P2"}
              thinking={opponentThinking && opponent === "B"}
            />
          </div>

          <div className={styles.onlineLedger} aria-label="Public card stats">
            {BATTLE_STATS.map((stat) => (
              <div key={stat}>
                <strong>{room.cards.A.stats[stat]}</strong>
                <span>{STAT_LABELS[stat].label} · {STAT_LABELS[stat].name}</span>
                <strong>{room.cards.B!.stats[stat]}</strong>
              </div>
            ))}
          </div>

          {room.phase !== "complete" && (
            <section className={styles.onlinePicks} aria-labelledby="online-pick-title">
              <p id="online-pick-title">
                {yourTurn
                  ? room.opponentPicked
                    ? "Opponent locked in · choose your stat"
                    : "Your turn · choose an unused stat"
                  : "Opponent is choosing · please wait"}
              </p>
              <div>
                {BATTLE_STATS.map((stat) => {
                  const available = room.availableStats.includes(stat);
                  return (
                    <button
                      type="button"
                      key={stat}
                      disabled={!yourTurn || !available || pending}
                      onClick={() => onPick(stat)}
                    >
                      <strong>{STAT_LABELS[stat].label} {room.cards[room.player]!.stats[stat]}</strong>
                      <small>{available ? STAT_LABELS[stat].name : "已使用"}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {room.canForfeit && room.phase !== "complete" && (
            <aside className={styles.disconnectNotice} role="status">
              <div>
                <strong>Opponent disconnected</strong>
                <small>對手超過 30 秒未回應</small>
              </div>
              <button type="button" onClick={onForfeit} disabled={pending}>
                Claim Forfeit
              </button>
            </aside>
          )}
        </section>
      ) : null}

      {revealedRound && (
        <RoundReveal round={revealedRound} />
      )}

      {room.phase === "complete" && room.winner && (
        <OnlineResult room={room} onLeave={onLeave} />
      )}
    </main>
  );
}

function FighterCard({
  card,
  label,
  thinking = false,
}: {
  card: Card;
  label: string;
  thinking?: boolean;
}) {
  return (
    <article className={styles.onlineFighter}>
      <span>{label}</span>
      {thinking && (
        <i className={styles.thinkingBubble} aria-label="Opponent is choosing">...</i>
      )}
      <div>
        <Image
          src={CLASS_ASSETS[card.class.key]}
          alt=""
          fill
          sizes="145px"
        />
      </div>
      <strong>{cardNameEn(card)}</strong>
      <small lang="zh-Hant">{cardName(card)}</small>
    </article>
  );
}

function RoundReveal({ round }: { round: BattleRound }) {
  return (
    <div className={styles.onlineRevealBackdrop} role="status" aria-live="assertive">
      <section className={styles.onlineReveal}>
        <p>REVEAL! · 同時揭曉</p>
        <div>
          {(["A", "B"] as const).map((player) => {
            const pick = round.picks[player];
            return (
              <article key={player}>
                <span>P{player === "A" ? "1" : "2"}</span>
                <strong>{STAT_LABELS[pick].label}</strong>
                <b>{round.values[player]}</b>
              </article>
            );
          })}
        </div>
        <strong>
          {round.winner === "tie"
            ? "TIE · 平手"
            : `PLAYER ${round.winner === "A" ? "1" : "2"} WINS ROUND`}
        </strong>
      </section>
    </div>
  );
}

function OnlineResult({
  room,
  onLeave,
}: {
  room: OnlineRoomView;
  onLeave: () => void;
}) {
  const isDraw = room.winner === "draw";
  const didWin = room.winner === room.player;
  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true" aria-labelledby="online-result-title">
      <section className={styles.resultPanel}>
        <div className={styles.crown} aria-hidden="true">{isDraw ? "≈" : didWin ? "♛" : "×"}</div>
        <p className={styles.eyebrow}>
          {isDraw ? "MATCH DRAW" : room.winReason === "forfeit" ? "FORFEIT RESULT" : "MATCH RESULT"}
        </p>
        <h2 id="online-result-title">
          {isDraw ? "Draw!" : didWin ? "You Win!" : "You Lose"}
        </h2>
        {room.winReason === "forfeit" && (
          <p className={styles.classSubtitle}>
            {didWin
              ? "Win by forfeit · 對手離線，這局由你收下"
              : "你離線太久，對手取得勝利 · Opponent claimed the forfeit"}
          </p>
        )}
        <p className={styles.finalScore}>
          {room.score.A} <span>—</span> {room.score.B}
        </p>
        <div className={styles.resultActions}>
          <button type="button" onClick={onLeave} className="sticker-button sticker-button-primary">
            <span>Back to Lobby</span>
            <small>返回選角</small>
          </button>
        </div>
      </section>
    </div>
  );
}

interface OnlineBattleProps {
  code: string;
  token: string;
  onLeave: () => void;
}

export default function OnlineBattle({ code, token, onLeave }: OnlineBattleProps) {
  const [room, setRoom] = useState<OnlineRoomView | null>(null);
  const [revealedRound, setRevealedRound] = useState<BattleRound | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const seenRoundCount = useRef(0);

  const acceptRoom = useCallback((next: OnlineRoomView) => {
    const round = nextRoundToAnimate(seenRoundCount.current, next.rounds);
    if (round) {
      setRevealedRound(round);
    }
    seenRoundCount.current = next.rounds.length;
    setRoom(next);
    setError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/room/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const body = (await response.json()) as OnlineRoomView | ApiErrorBody;
        if (!cancelled) {
          if (response.ok) {
            acceptRoom(body as OnlineRoomView);
          } else {
            setError(onlineRoomErrorMessage((body as ApiErrorBody).error));
          }
        }
      } catch {
        if (!cancelled) {
          setError(onlineRoomErrorMessage());
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, ROOM_POLL_MS);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [acceptRoom, code, token]);

  useEffect(() => {
    if (!revealedRound) {
      return;
    }
    const timer = setTimeout(() => setRevealedRound(null), REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [revealedRound]);

  async function submitAction(body: { pick: StatKey } | { action: "forfeit" }) {
    setPending(true);
    try {
      const response = await fetch(`/api/room/${encodeURIComponent(code)}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, ...body }),
      });
      const result = (await response.json()) as OnlineRoomView | ApiErrorBody;
      if (response.ok) {
        acceptRoom(result as OnlineRoomView);
      } else {
        setError(onlineRoomErrorMessage((result as ApiErrorBody).error));
      }
    } catch {
      setError(onlineRoomErrorMessage());
    } finally {
      setPending(false);
    }
  }

  if (!room) {
    return (
      <main className={`${styles.battlePage} phone-shell`}>
        <header className={styles.arenaHeader}>
          <button type="button" onClick={onLeave}>Leave Room</button>
          <div><p>ONLINE ROOM · {code}</p><h1>Connecting</h1></div>
          <span>SYNC</span>
        </header>
        {error ? (
          <div className={`${styles.canvasLoading} ${styles.connectionError}`} role="alert">
            <p>{error}</p>
            <button type="button" onClick={onLeave}>
              返回大廳 · Back to Lobby
            </button>
          </div>
        ) : (
          <div className={styles.canvasLoading} role="status">
            同步戰況中… · Syncing server battle state…
          </div>
        )}
      </main>
    );
  }

  return (
    <OnlineBattleScreen
      room={room}
      revealedRound={revealedRound}
      pending={pending}
      error={error}
      onPick={(pick) => void submitAction({ pick })}
      onForfeit={() => void submitAction({ action: "forfeit" })}
      onLeave={onLeave}
    />
  );
}

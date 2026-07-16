"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  battleModeFromSearch,
  type BattleMode,
} from "@/lib/battle-navigation";
import { COLLECTION_STORAGE_KEY } from "@/lib/collection";
import { CLASS_ASSETS } from "@/lib/engine/assets";
import type {
  BattlePlayer,
  BattleState,
} from "@/lib/engine/battle";
import {
  APPRENTICE_MOCHI,
  isPresetCard,
  NPC_PRESETS,
  type PresetCard,
} from "@/lib/engine/presets";
import { pickRoast } from "@/lib/engine/roast";
import type { Card, StatKey } from "@/lib/engine/types";

import styles from "./battle.module.css";

const BattleCanvas = dynamic(() => import("@/games/battle/BattleCanvas"), {
  ssr: false,
  loading: () => (
    <div className={styles.canvasLoading} role="status">
      Opening the arena…
    </div>
  ),
});

const BATTLE_SELECTION_STORAGE_KEY = "faceforge.battle.selection.v1";

const STAT_LABELS: readonly { key: StatKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
  { key: "def", label: "DEF" },
  { key: "agi", label: "AGI" },
  { key: "luk", label: "LUK" },
  { key: "grit", label: "GRT" },
];

type SelectedCards = Partial<Record<BattlePlayer, Card>>;

interface StoredSelections {
  cards: SelectedCards;
  npc: PresetCard;
}

function readCollection(): Card[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(COLLECTION_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed)
      ? (parsed as Card[]).filter((card) => !card.isPreset)
      : [];
  } catch {
    return [];
  }
}

function readStoredSelections(collection: Card[]): StoredSelections {
  try {
    const parsed = JSON.parse(
      sessionStorage.getItem(BATTLE_SELECTION_STORAGE_KEY) ?? "{}",
    ) as Partial<Record<BattlePlayer | "npc", string>>;
    return {
      cards: {
        A: collection.find(({ id }) => id === parsed.A),
        B: collection.find(({ id }) => id === parsed.B),
      },
      npc:
        NPC_PRESETS.find(({ id }) => id === parsed.npc) ?? APPRENTICE_MOCHI,
    };
  } catch {
    return { cards: {}, npc: APPRENTICE_MOCHI };
  }
}

function storeSelections(cards: SelectedCards, npc: PresetCard) {
  try {
    sessionStorage.setItem(
      BATTLE_SELECTION_STORAGE_KEY,
      JSON.stringify({ A: cards.A?.id, B: cards.B?.id, npc: npc.id }),
    );
  } catch {
    // Battle still works when session storage is unavailable.
  }
}

function playerLabel(player: BattlePlayer) {
  return player === "A" ? "Player 1" : "Player 2";
}

function cardNameEn(card: Card): string {
  return isPresetCard(card) ? card.nameEn : card.class.nameEn;
}

function cardName(card: Card): string {
  return isPresetCard(card) ? card.name : card.class.name;
}

interface BattleModePickerProps {
  mode: BattleMode;
  onChange: (mode: BattleMode) => void;
}

function BattleModePicker({ mode, onChange }: BattleModePickerProps) {
  return (
    <section className={styles.modePicker} aria-label="Battle mode">
      <button
        type="button"
        className={mode === "quick" ? styles.activeMode : ""}
        onClick={() => onChange("quick")}
        aria-pressed={mode === "quick"}
      >
        <strong>Quick Match</strong>
        <small>單人挑戰 NPC</small>
      </button>
      <button
        type="button"
        className={mode === "twoPlayers" ? styles.activeMode : ""}
        onClick={() => onChange("twoPlayers")}
        aria-pressed={mode === "twoPlayers"}
      >
        <strong>2 Players</strong>
        <small>同機輪流對戰</small>
      </button>
    </section>
  );
}

export default function BattleGame() {
  const [collection, setCollection] = useState<Card[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<BattleMode>("quick");
  const [selected, setSelected] = useState<SelectedCards>({});
  const [selectedNpc, setSelectedNpc] =
    useState<PresetCard>(APPRENTICE_MOCHI);
  const [activePlayer, setActivePlayer] = useState<BattlePlayer>("A");
  const [handoff, setHandoff] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [result, setResult] = useState<BattleState>();
  const [matchKey, setMatchKey] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const cards = readCollection();
      const stored = readStoredSelections(cards);
      const params = new URLSearchParams(window.location.search);
      const returnedMode = battleModeFromSearch(window.location.search);
      const returnedPlayer = params.get("player");
      const returnedCard = params.get("card");
      const player: BattlePlayer =
        returnedMode === "twoPlayers" && returnedPlayer === "B" ? "B" : "A";
      const drawnCard = cards.find(({ id }) => id === returnedCard);
      const next = drawnCard
        ? { ...stored.cards, [player]: drawnCard }
        : stored.cards;
      const nextActivePlayer = player === "B" && !next.A ? "A" : player;

      setCollection(cards);
      setMode(returnedMode);
      setSelected(next);
      setSelectedNpc(stored.npc);
      if (returnedCard) {
        setActivePlayer(nextActivePlayer);
        storeSelections(next, stored.npc);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const winner = result?.winner ? result.cards[result.winner] : undefined;
  const loser = result?.winner
    ? result.cards[result.winner === "A" ? "B" : "A"]
    : undefined;
  const loserRoast = useMemo(
    () =>
      loser
        ? pickRoast(loser.class.key, `${loser.id}-battle`, loser.curse)
        : "",
    [loser],
  );

  const opponent = mode === "quick" ? selectedNpc : selected.B;

  function chooseCard(card: Card) {
    const player = mode === "quick" ? "A" : activePlayer;
    const next = { ...selected, [player]: card };
    setSelected(next);
    storeSelections(next, selectedNpc);
  }

  function chooseNpc(card: PresetCard) {
    setSelectedNpc(card);
    storeSelections(selected, card);
  }

  function chooseMode(nextMode: BattleMode) {
    setMode(nextMode);
    setResult(undefined);
    setInBattle(false);
    setHandoff(false);
    setActivePlayer("A");
  }

  function lockCard() {
    if (mode === "quick") {
      if (selected.A) {
        setInBattle(true);
      }
      return;
    }
    if (!selected[activePlayer]) {
      return;
    }
    if (activePlayer === "A") {
      setHandoff(true);
      return;
    }
    if (selected.A && selected.B) {
      setInBattle(true);
    }
  }

  function passToPlayerTwo() {
    setHandoff(false);
    setActivePlayer("B");
  }

  function rematch() {
    setResult(undefined);
    setMatchKey((key) => key + 1);
  }

  function changeCards() {
    setResult(undefined);
    setInBattle(false);
    setHandoff(false);
    setActivePlayer("A");
    setSelected({});
    setSelectedNpc(APPRENTICE_MOCHI);
    setMatchKey((key) => key + 1);
    try {
      sessionStorage.removeItem(BATTLE_SELECTION_STORAGE_KEY);
    } catch {
      // A fresh in-memory selection is enough for this session.
    }
  }

  if (!hydrated) {
    return (
      <main className={`${styles.page} phone-shell`}>
        <div className={styles.pageLoading} role="status">Reading your collection…</div>
      </main>
    );
  }

  if (collection.length === 0) {
    return (
      <main className={`${styles.page} phone-shell`}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.backLink}>Home</Link>
          <p>FACEFORGE BATTLE</p>
          <span aria-hidden="true" />
        </header>
        <BattleModePicker mode={mode} onChange={chooseMode} />
        <section className={styles.emptyPanel}>
          <div className={styles.emptyVs} aria-hidden="true">VS</div>
          <p className={styles.eyebrow}>YOUR ROSTER IS EMPTY</p>
          <h1>Draw a hero first</h1>
          <p>先抽一張臉鬥士卡，魔鏡才有選手可以派上場。</p>
          <Link
            href={`/draw?returnTo=battle&mode=${mode}&player=A`}
            className="sticker-button sticker-button-primary"
          >
            <span>Draw First Card</span>
            <small>先去抽卡</small>
          </Link>
        </section>
      </main>
    );
  }

  if (inBattle && selected.A && opponent) {
    return (
      <main className={`${styles.battlePage} phone-shell`}>
        <header className={styles.arenaHeader}>
          <button type="button" onClick={changeCards}>Change Cards</button>
          <div>
            <p>BO3 FACE-OFF</p>
            <h1>Battle Arena</h1>
          </div>
          <span>{result ? "FINAL" : "LIVE"}</span>
        </header>

        <BattleCanvas
          key={matchKey}
          cardA={selected.A}
          cardB={opponent}
          onComplete={setResult}
        />

        {result && winner && loser && (
          <div className={styles.resultBackdrop} role="dialog" aria-modal="true" aria-labelledby="result-title">
            <section className={styles.resultPanel}>
              <div className={styles.crown} aria-hidden="true">♛</div>
              <p className={styles.eyebrow}>MATCH WINNER</p>
              <h2 id="result-title">{cardNameEn(winner)}</h2>
              <p className={styles.classSubtitle} lang="zh-Hant">{cardName(winner)}</p>
              <div className={styles.winnerMascot}>
                <Image
                  src={CLASS_ASSETS[winner.class.key]}
                  alt={`${cardNameEn(winner)} victory pose`}
                  fill
                  sizes="180px"
                />
              </div>
              <p className={styles.finalScore}>
                {result.score.A} <span>—</span> {result.score.B}
              </p>
              <div className={styles.roastBubble} lang="zh-Hant">
                <strong>魔鏡給 {cardName(loser)}：</strong>
                <p>「{loserRoast}」</p>
              </div>
              <div className={styles.resultActions}>
                <button type="button" onClick={rematch} className="sticker-button sticker-button-primary">
                  <span>Rematch</span>
                  <small>同卡再戰</small>
                </button>
                <button type="button" onClick={changeCards} className="sticker-button sticker-button-secondary">
                  <span>Change Cards</span>
                  <small>重新出卡</small>
                </button>
                <Link href="/" className={styles.homeAction}>Home · 回首頁</Link>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`${styles.page} phone-shell`}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.backLink}>Home</Link>
        <div>
          <p>FACEFORGE BATTLE</p>
          <h1>Choose Fighters</h1>
        </div>
        <span className={styles.step}>
          {mode === "quick" ? "SOLO" : `P${activePlayer === "A" ? "1" : "2"}/2`}
        </span>
      </header>

      <BattleModePicker mode={mode} onChange={chooseMode} />

      <section className={styles.introCopy}>
        <p className={styles.eyebrow}>
          {mode === "quick"
            ? "QUICK MATCH · SOLO"
            : `${playerLabel(activePlayer).toUpperCase()} IS CHOOSING`}
        </p>
        <h2>{mode === "quick" ? "Pick your hero and rival" : "Pick your face-born hero"}</h2>
        <p>
          {mode === "quick"
            ? "選你的臉鬥士，再挑戰見習生或鬼臉宗師。"
            : "選一張卡，屬性公開後用讀心術搶下兩勝。"}
        </p>
      </section>

      <section className={styles.slots} aria-label="Selected battle cards">
        {mode === "quick" ? (
          <>
            <button
              type="button"
              className={`${styles.slot} ${styles.activeSlot}`}
              aria-label={selected.A ? `Your slot, ${selected.A.class.nameEn}` : "Your slot, empty"}
            >
              <span className={styles.slotPlayer}>YOU</span>
              {selected.A ? (
                <>
                  <span className={styles.slotImage}>
                    <Image
                      src={CLASS_ASSETS[selected.A.class.key]}
                      alt=""
                      fill
                      sizes="150px"
                    />
                  </span>
                  <strong>{selected.A.class.nameEn}</strong>
                  <small lang="zh-Hant">{selected.A.class.name}</small>
                </>
              ) : (
                <>
                  <span className={styles.slotQuestion} aria-hidden="true">?</span>
                  <strong>Choose Hero</strong>
                  <small>選擇你的卡</small>
                </>
              )}
            </button>
            <div
              className={`${styles.slot} ${styles.npcSlot}`}
              aria-label={`NPC opponent, ${selectedNpc.nameEn}`}
            >
              <span className={styles.slotPlayer}>NPC</span>
              <span className={styles.slotImage}>
                <Image
                  src={CLASS_ASSETS[selectedNpc.class.key]}
                  alt=""
                  fill
                  sizes="150px"
                />
              </span>
              <strong>{selectedNpc.nameEn}</strong>
              <small lang="zh-Hant">{selectedNpc.name}</small>
            </div>
          </>
        ) : (["A", "B"] as const).map((player) => {
          const card = selected[player];
          const isActive = activePlayer === player;
          return (
            <button
              type="button"
              key={player}
              className={`${styles.slot} ${isActive ? styles.activeSlot : ""}`}
              onClick={() => setActivePlayer(player)}
              disabled={!isActive}
              aria-label={`${playerLabel(player)} slot${card ? `, ${card.class.nameEn}` : ", empty"}`}
            >
              <span className={styles.slotPlayer}>P{player === "A" ? "1" : "2"}</span>
              {card ? (
                <>
                  <span className={styles.slotImage}>
                    <Image
                      src={CLASS_ASSETS[card.class.key]}
                      alt=""
                      fill
                      sizes="150px"
                    />
                  </span>
                  <strong>{card.class.nameEn}</strong>
                  <small lang="zh-Hant">{card.class.name}</small>
                </>
              ) : (
                <>
                  <span className={styles.slotQuestion} aria-hidden="true">?</span>
                  <strong>Empty Slot</strong>
                  <small>尚未出卡</small>
                </>
              )}
            </button>
          );
        })}
      </section>

      <section className={styles.collectionPanel} aria-labelledby="roster-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>COLLECTION</p>
            <h2 id="roster-title">
              {mode === "quick" ? "Choose your hero" : `Choose for ${playerLabel(activePlayer)}`}
            </h2>
          </div>
          <span>{collection.length} cards</span>
        </div>
        <div className={styles.cardGrid}>
          {collection.map((card) => {
            const choosingPlayer = mode === "quick" ? "A" : activePlayer;
            const chosen = selected[choosingPlayer]?.id === card.id;
            return (
              <button
                type="button"
                key={card.id}
                className={`${styles.cardChoice} ${chosen ? styles.chosenCard : ""}`}
                onClick={() => chooseCard(card)}
                aria-pressed={chosen}
              >
                <span className={styles.choiceImage}>
                  <Image
                    src={CLASS_ASSETS[card.class.key]}
                    alt=""
                    fill
                    sizes="120px"
                  />
                </span>
                <span className={styles.choiceCopy}>
                  <strong>{card.class.nameEn}</strong>
                  <small lang="zh-Hant">{card.class.name}</small>
                  <span className={styles.miniStats}>
                    {STAT_LABELS.map(({ key, label }) => (
                      <i key={key}>{label} {card.stats[key]}</i>
                    ))}
                  </span>
                </span>
                {chosen && <b className={styles.pickedBadge}>PICKED</b>}
              </button>
            );
          })}
        </div>
      </section>

      {mode === "quick" && (
        <section className={styles.npcPanel} aria-labelledby="npc-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>NPC OPPONENT</p>
              <h2 id="npc-title">Choose your challenge</h2>
            </div>
            <span>Auto-play</span>
          </div>
          <div className={styles.npcGrid}>
            {NPC_PRESETS.map((npc) => {
              const chosen = selectedNpc.id === npc.id;
              return (
                <button
                  type="button"
                  key={npc.id}
                  className={`${styles.npcChoice} ${chosen ? styles.chosenNpc : ""}`}
                  onClick={() => chooseNpc(npc)}
                  aria-pressed={chosen}
                >
                  <span className={styles.npcImage}>
                    <Image
                      src={CLASS_ASSETS[npc.class.key]}
                      alt=""
                      fill
                      sizes="90px"
                    />
                  </span>
                  <span>
                    <strong>{npc.nameEn}</strong>
                    <small lang="zh-Hant">{npc.name}</small>
                    <i>
                      {npc.npcStrategy === "apprentice"
                        ? "Random picks · 入門"
                        : "Greedy picks · 魔王"}
                    </i>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.selectionActions}>
        <Link
          href={`/draw?returnTo=battle&mode=${mode}&player=${mode === "quick" ? "A" : activePlayer}`}
          className="sticker-button sticker-button-secondary"
        >
          <span>Draw New</span>
          <small>現場抽一張</small>
        </Link>
        <button
          type="button"
          className="sticker-button sticker-button-primary"
          onClick={lockCard}
          disabled={!selected[mode === "quick" ? "A" : activePlayer]}
        >
          <span>
            {mode === "quick"
              ? "Enter Arena"
              : activePlayer === "A"
                ? "Lock P1 Card"
                : "Enter Arena"}
          </span>
          <small>
            {mode === "quick"
              ? "開始快速對戰"
              : activePlayer === "A"
                ? "鎖定並交機"
                : "開始對戰"}
          </small>
        </button>
      </div>

      {mode === "twoPlayers" && handoff && (
        <div className={styles.handoff} role="dialog" aria-modal="true" aria-labelledby="handoff-title">
          <p className={styles.eyebrow}>PLAYER 1 LOCKED IN</p>
          <div className={styles.handoffIcon} aria-hidden="true">↝</div>
          <h2 id="handoff-title">Pass to Player 2</h2>
          <p lang="zh-Hant">把手機交給玩家 2，準備選擇第二張出戰卡。</p>
          <button type="button" onClick={passToPlayerTwo} autoFocus className="sticker-button sticker-button-primary">
            <span>I&apos;m Player 2</span>
            <small>玩家 2 準備好了</small>
          </button>
        </div>
      )}
    </main>
  );
}

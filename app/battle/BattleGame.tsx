"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { COLLECTION_STORAGE_KEY } from "@/lib/collection";
import { CLASS_ASSETS } from "@/lib/engine/assets";
import type {
  BattlePlayer,
  BattleState,
} from "@/lib/engine/battle";
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

function readCollection(): Card[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(COLLECTION_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as Card[]) : [];
  } catch {
    return [];
  }
}

function readStoredSelections(collection: Card[]): SelectedCards {
  try {
    const parsed = JSON.parse(
      sessionStorage.getItem(BATTLE_SELECTION_STORAGE_KEY) ?? "{}",
    ) as Partial<Record<BattlePlayer, string>>;
    return {
      A: collection.find(({ id }) => id === parsed.A),
      B: collection.find(({ id }) => id === parsed.B),
    };
  } catch {
    return {};
  }
}

function storeSelections(cards: SelectedCards) {
  try {
    sessionStorage.setItem(
      BATTLE_SELECTION_STORAGE_KEY,
      JSON.stringify({ A: cards.A?.id, B: cards.B?.id }),
    );
  } catch {
    // Battle still works when session storage is unavailable.
  }
}

function playerLabel(player: BattlePlayer) {
  return player === "A" ? "Player 1" : "Player 2";
}

export default function BattleGame() {
  const [collection, setCollection] = useState<Card[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<SelectedCards>({});
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
      const returnedPlayer = params.get("player");
      const returnedCard = params.get("card");
      const player: BattlePlayer = returnedPlayer === "B" ? "B" : "A";
      const drawnCard = cards.find(({ id }) => id === returnedCard);
      const next = drawnCard ? { ...stored, [player]: drawnCard } : stored;
      const nextActivePlayer = player === "B" && !next.A ? "A" : player;

      setCollection(cards);
      setSelected(next);
      if (returnedCard) {
        setActivePlayer(nextActivePlayer);
        storeSelections(next);
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

  function chooseCard(card: Card) {
    const next = { ...selected, [activePlayer]: card };
    setSelected(next);
    storeSelections(next);
  }

  function lockCard() {
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
        <section className={styles.emptyPanel}>
          <div className={styles.emptyVs} aria-hidden="true">VS</div>
          <p className={styles.eyebrow}>YOUR ROSTER IS EMPTY</p>
          <h1>Draw a hero first</h1>
          <p>先抽一張臉鬥士卡，魔鏡才有選手可以派上場。</p>
          <Link
            href="/draw?returnTo=battle&player=A"
            className="sticker-button sticker-button-primary"
          >
            <span>Draw First Card</span>
            <small>先去抽卡</small>
          </Link>
        </section>
      </main>
    );
  }

  if (inBattle && selected.A && selected.B) {
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
          cardB={selected.B}
          onComplete={setResult}
        />

        {result && winner && loser && (
          <div className={styles.resultBackdrop} role="dialog" aria-modal="true" aria-labelledby="result-title">
            <section className={styles.resultPanel}>
              <div className={styles.crown} aria-hidden="true">♛</div>
              <p className={styles.eyebrow}>MATCH WINNER</p>
              <h2 id="result-title">{winner.class.nameEn}</h2>
              <p className={styles.classSubtitle} lang="zh-Hant">{winner.class.name}</p>
              <div className={styles.winnerMascot}>
                <Image
                  src={CLASS_ASSETS[winner.class.key]}
                  alt={`${winner.class.nameEn} victory pose`}
                  fill
                  sizes="180px"
                />
              </div>
              <p className={styles.finalScore}>
                {result.score.A} <span>—</span> {result.score.B}
              </p>
              <div className={styles.roastBubble} lang="zh-Hant">
                <strong>魔鏡給 {loser.class.name}：</strong>
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
        <span className={styles.step}>P{activePlayer === "A" ? "1" : "2"}/2</span>
      </header>

      <section className={styles.introCopy}>
        <p className={styles.eyebrow}>{playerLabel(activePlayer).toUpperCase()} IS CHOOSING</p>
        <h2>Pick your face-born hero</h2>
        <p>選一張卡，屬性公開後用讀心術搶下兩勝。</p>
      </section>

      <section className={styles.slots} aria-label="Selected battle cards">
        {(["A", "B"] as const).map((player) => {
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
            <h2 id="roster-title">Choose for {playerLabel(activePlayer)}</h2>
          </div>
          <span>{collection.length} cards</span>
        </div>
        <div className={styles.cardGrid}>
          {collection.map((card) => {
            const chosen = selected[activePlayer]?.id === card.id;
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

      <div className={styles.selectionActions}>
        <Link
          href={`/draw?returnTo=battle&player=${activePlayer}`}
          className="sticker-button sticker-button-secondary"
        >
          <span>Draw New</span>
          <small>現場抽一張</small>
        </Link>
        <button
          type="button"
          className="sticker-button sticker-button-primary"
          onClick={lockCard}
          disabled={!selected[activePlayer]}
        >
          <span>{activePlayer === "A" ? "Lock P1 Card" : "Enter Arena"}</span>
          <small>{activePlayer === "A" ? "鎖定並交機" : "開始對戰"}</small>
        </button>
      </div>

      {handoff && (
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

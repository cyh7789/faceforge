"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { CharacterCard } from "@/components/CharacterCard";
import {
  battleDestination,
  battleReturnQuery,
} from "@/lib/battle-navigation";
import { downloadCardImage } from "@/lib/card-image";
import { addCard, COLLECTION_STORAGE_KEY } from "@/lib/collection";
import { PENDING_DRAW_STORAGE_KEY } from "@/lib/draw-session";
import type { Card, Rarity } from "@/lib/engine/types";

import {
  RevealErrorPanel,
  type AnalyzeErrorCode,
} from "./RevealErrorPanel";
import styles from "./reveal.module.css";

const LOADING_LINES = [
  "Reading your pore constellations…",
  "Translating ancient wrinkle scrolls…",
  "Summoning your face-born fate…",
  "Measuring strange energy…",
] as const;

const GLOW_CLASS: Readonly<Record<Rarity, string>> = {
  common: styles.commonGlow,
  rare: styles.rareGlow,
  legendary: styles.legendaryGlow,
};

function readStoredCollection(): Card[] {
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

export default function RevealPage() {
  const router = useRouter();
  const cardCaptureRef = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<Card>();
  const [flipped, setFlipped] = useState(false);
  const [errorCode, setErrorCode] = useState<AnalyzeErrorCode>();
  const [attempt, setAttempt] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [savingImage, setSavingImage] = useState(false);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    const timer = window.setInterval(
      () => setLineIndex((index) => (index + 1) % LOADING_LINES.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const image = sessionStorage.getItem(PENDING_DRAW_STORAGE_KEY);
    if (!image) {
      const timer = window.setTimeout(() => setErrorCode("missing_photo"), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const controller = new AbortController();

    async function analyze() {
      const ritualStarted = Date.now();
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ image, mode: "draw" }),
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          card?: Card;
          error?: AnalyzeErrorCode;
        };

        if (!response.ok || !body.card) {
          if (!cancelled) {
            setErrorCode(body.error ?? "upstream_error");
          }
          return;
        }

        const remainingRitual = Math.max(0, 1400 - (Date.now() - ritualStarted));
        await new Promise((resolve) => window.setTimeout(resolve, remainingRitual));
        if (!cancelled) {
          sessionStorage.removeItem(PENDING_DRAW_STORAGE_KEY);
          setCard(body.card);
        }
      } catch (error) {
        if (
          !cancelled &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setErrorCode("upstream_error");
        }
      }
    }

    void analyze();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  function retake() {
    sessionStorage.removeItem(PENDING_DRAW_STORAGE_KEY);
    router.push(`/draw${battleReturnQuery(window.location.search)}`);
  }

  function retry() {
    setErrorCode(undefined);
    setAttempt((value) => value + 1);
  }

  function saveToCollection() {
    if (!card) {
      return;
    }
    try {
      const next = addCard(readStoredCollection(), card);
      localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(next));
      const destination = battleDestination(window.location.search, card.id);
      if (destination) {
        router.push(destination);
      } else {
        router.push("/");
      }
    } catch {
      setActionError("Collection storage is unavailable in this browser.");
    }
  }

  async function saveCardImage() {
    if (!cardCaptureRef.current || !card || savingImage) {
      return;
    }
    setSavingImage(true);
    setActionError(undefined);
    try {
      await downloadCardImage(cardCaptureRef.current, card);
    } catch {
      setActionError("Could not save the card image. Please try again.");
    } finally {
      setSavingImage(false);
    }
  }

  if (errorCode) {
    return <RevealErrorPanel code={errorCode} onRetry={retry} onRetake={retake} />;
  }

  if (!card) {
    return (
      <main className={`${styles.ritualPage} phone-shell min-h-dvh`}>
        <button type="button" onClick={retake} className={styles.cancelLink}>
          Cancel
        </button>
        <section className={styles.ritualContent} aria-live="polite">
          <p className="text-xs font-black tracking-[0.24em] text-ff-cream">
            THE MIRROR IS READING
          </p>
          <div className={styles.crystalBall} aria-hidden="true">
            <span className={styles.crystalFace}>⌁</span>
            <span className={styles.orbit} />
          </div>
          <h1 className="text-3xl font-black text-ff-cream">Forging your fate…</h1>
          <p className={styles.loadingLine}>{LOADING_LINES[lineIndex]}</p>
          <div className={styles.loadingDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="phone-shell min-h-dvh overflow-hidden px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <header className="mb-4 text-center">
        <p className="text-[10px] font-black tracking-[0.24em] text-ff-pink-deep">
          YOUR FATE HAS LANDED
        </p>
        <h1 className="mt-1 text-2xl font-black text-ff-ink">
          {flipped ? "Meet your hero" : "Tap to reveal"}
        </h1>
        {!flipped && (
          <p className="mt-1 text-sm font-bold text-ff-plum">
            The glow whispers: {card.rarity}
          </p>
        )}
      </header>

      <section className="relative flex justify-center" aria-label="Card reveal">
        {card.rarity === "legendary" && (
          <div className={styles.confetti} aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i
                key={index}
                style={
                  {
                    "--confetti-index": index,
                    "--confetti-x": (index * 23) % 100,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
        <div className={`${styles.cardLanding} ${GLOW_CLASS[card.rarity]}`}>
          <div ref={cardCaptureRef} className={styles.captureFrame}>
            <CharacterCard
              card={card}
              flipped={flipped}
              animateStats={flipped}
              onFlip={() => setFlipped((value) => !value)}
            />
          </div>
        </div>
      </section>

      <p className="mt-4 text-center text-sm font-bold text-ff-plum" aria-live="polite">
        {flipped ? "Card revealed. Tap it anytime to flip." : "Tap the face-down card"}
      </p>

      {flipped && (
        <section className={styles.actions} aria-label="Card actions">
          <button
            type="button"
            className="sticker-button sticker-button-secondary"
            onClick={() => setFlipped(false)}
          >
            View Card Back
          </button>
          <button
            type="button"
            className="sticker-button sticker-button-primary"
            onClick={saveToCollection}
          >
            Save to Collection
          </button>
          <button
            type="button"
            className="sticker-button sticker-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={saveCardImage}
            disabled={savingImage}
          >
            {savingImage ? "Saving…" : "Save Card Image"}
          </button>
        </section>
      )}

      {actionError && (
        <p className="mt-4 rounded-xl border-2 border-ff-error bg-white px-3 py-2 text-center text-sm font-bold text-ff-error" role="alert">
          {actionError}
        </p>
      )}
    </main>
  );
}

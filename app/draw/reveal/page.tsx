"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { CharacterCard } from "@/components/CharacterCard";
import {
  battleDestination,
  battleReturnQuery,
} from "@/lib/battle-navigation";
import { addCard, COLLECTION_STORAGE_KEY } from "@/lib/collection";
import { PENDING_DRAW_STORAGE_KEY } from "@/lib/draw-session";
import type { Card, Rarity } from "@/lib/engine/types";

import styles from "./reveal.module.css";

const LOADING_LINES = [
  "觀測毛孔星象中… Reading your pore constellations…",
  "解讀皺紋古文書… Translating ancient wrinkle scrolls…",
  "召喚臉部命運… Summoning your face-born fate…",
  "衡量怪力波動… Measuring strange energy…",
] as const;

type AnalyzeErrorCode =
  | "face_too_small"
  | "no_face"
  | "file_too_large"
  | "upstream_error"
  | "missing_photo";

const ERROR_COPY: Readonly<
  Record<AnalyzeErrorCode, { title: string; subtitle: string; detail: string }>
> = {
  face_too_small: {
    title: "Get closer!",
    subtitle: "臉再靠近一點！",
    detail: "Fill the oval with your face, then try the ritual again.",
  },
  no_face: {
    title: "No face found!",
    subtitle: "魔鏡找不到臉！",
    detail: "Keep one uncovered face centered in the frame.",
  },
  file_too_large: {
    title: "That portrait is too mighty!",
    subtitle: "照片太大張了！",
    detail: "Choose a smaller photo or take a new one.",
  },
  upstream_error: {
    title: "The mirror went cloudy!",
    subtitle: "魔鏡暫時看不清楚！",
    detail: "Your photo is still here. Retry, or take another one.",
  },
  missing_photo: {
    title: "No portrait is waiting",
    subtitle: "還沒有照片可以占卜！",
    detail: "Return to the draw station and capture your face first.",
  },
};

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

async function waitForImages(node: HTMLElement): Promise<void> {
  const pending = Array.from(node.querySelectorAll("img"))
    .filter((image) => !image.complete)
    .map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    );
  await Promise.all(pending);
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
      await waitForImages(cardCaptureRef.current);
      await document.fonts.ready;
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardCaptureRef.current, {
        backgroundColor: "#fff6df",
        cacheBust: true,
        pixelRatio: 2,
      });
      const download = document.createElement("a");
      download.href = dataUrl;
      download.download = `${card.id}-${card.class.key}.png`;
      download.click();
    } catch {
      setActionError("The card image could not be saved. Please try again.");
    } finally {
      setSavingImage(false);
    }
  }

  if (errorCode) {
    const copy = ERROR_COPY[errorCode];
    return (
      <main className="phone-shell flex min-h-dvh flex-col items-center justify-center px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))] text-center">
        <section className="sticker-panel w-full px-6 py-9" role="alert">
          <div className={styles.errorMirror} aria-hidden="true">?</div>
          <p className="text-xs font-black tracking-[0.2em] text-ff-error">RITUAL INTERRUPTED</p>
          <h1 className="mt-2 text-3xl font-black text-ff-ink">{copy.title}</h1>
          <p className="mt-1 text-xl font-black text-ff-pink-deep" lang="zh-Hant">
            {copy.subtitle}
          </p>
          <p className="mx-auto mt-4 max-w-xs text-sm font-bold leading-relaxed text-ff-plum">
            {copy.detail}
          </p>
          <div className="mt-7 grid gap-3">
            {errorCode === "upstream_error" && (
              <button
                type="button"
                onClick={retry}
                className="sticker-button sticker-button-primary"
              >
                Retry Ritual
              </button>
            )}
            <button
              type="button"
              onClick={retake}
              className="sticker-button sticker-button-secondary"
            >
              Retake Photo
            </button>
          </div>
        </section>
      </main>
    );
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
        {flipped ? "Card revealed — tap it anytime to flip" : "Tap the face-down card"}
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
            {savingImage ? "Saving Image…" : "Save Card Image"}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CharacterCard } from "@/components/CharacterCard";
import { downloadCardImage } from "@/lib/card-image";
import {
  bestCardForClass,
  COLLECTION_STORAGE_KEY,
} from "@/lib/collection";
import { CLASS_ASSETS } from "@/lib/engine/assets";
import { CLASS_BY_WEAKEST, PALADIN } from "@/lib/engine/classify";
import type { Card, ClassInfo, Rarity } from "@/lib/engine/types";

const CLASS_ROSTER: readonly ClassInfo[] = Array.from(
  new Map(
    [...Object.values(CLASS_BY_WEAKEST), PALADIN].map((classInfo) => [
      classInfo.key,
      classInfo,
    ]),
  ).values(),
);

const SLOT_FRAME: Readonly<Record<Rarity, string>> = {
  common: "border-ff-common bg-ff-common-soft",
  rare: "border-ff-rare bg-ff-rare-soft",
  legendary: "border-ff-gold bg-ff-gold-soft",
};

const RARITY_LABEL: Readonly<Record<Rarity, string>> = {
  common: "Common",
  rare: "Rare",
  legendary: "Legendary",
};

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

interface CollectionCardDetailProps {
  card: Card;
  flipped: boolean;
  savingImage: boolean;
  actionError?: string;
  onFlip: () => void;
  onClose: () => void;
  onSaveImage: (node: HTMLElement) => void;
}

export function CollectionCardDetail({
  card,
  flipped,
  savingImage,
  actionError,
  onFlip,
  onClose,
  onSaveImage,
}: CollectionCardDetailProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ff-ink/70 px-5 py-[calc(20px+env(safe-area-inset-top))] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section className="flex w-full max-w-[350px] flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between text-ff-cream">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em]">
              COLLECTION CARD
            </p>
            <h2 id="detail-title" className="text-lg font-black">
              {card.class.nameEn}
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            className="min-h-11 rounded-full border-2 border-ff-cream bg-ff-plum px-4 text-sm font-black shadow-[0_3px_0_var(--color-ff-cream)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div ref={captureRef}>
          <CharacterCard card={card} flipped={flipped} onFlip={onFlip} />
        </div>
        <p className="text-sm font-bold text-ff-cream">
          Tap the card to flip
        </p>
        <button
          type="button"
          className="sticker-button sticker-button-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={savingImage}
          onClick={() => captureRef.current && onSaveImage(captureRef.current)}
        >
          {savingImage
            ? "Saving Image…"
            : "Save Card Image"}
        </button>
        {actionError && (
          <p className="w-full rounded-xl border-2 border-ff-error bg-white px-3 py-2 text-center text-sm font-bold text-ff-error" role="alert">
            {actionError}
          </p>
        )}
      </section>
    </div>
  );
}

export default function CollectionHome() {
  const [collection, setCollection] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card>();
  const [detailFlipped, setDetailFlipped] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollection(readCollection());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(undefined);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  const unlockedCount = useMemo(
    () => new Set(collection.map((card) => card.class.key)).size,
    [collection],
  );

  function openCard(card: Card) {
    setSelected(card);
    setDetailFlipped(true);
    setActionError(undefined);
  }

  async function saveSelectedCardImage(node: HTMLElement) {
    if (!selected || savingImage) {
      return;
    }
    setSavingImage(true);
    setActionError(undefined);
    try {
      await downloadCardImage(node, selected);
    } catch {
      setActionError(
        "Could not save the card image. Please try again.",
      );
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <main className="phone-shell min-h-dvh px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(24px+env(safe-area-inset-top))]">
      <header className="text-center">
        <p className="mb-1 text-xs font-black tracking-[0.28em] text-ff-plum">
          YOUR FACE. YOUR FATE.
        </p>
        <h1 className="text-4xl font-black tracking-[-0.05em] text-ff-ink">
          FACE<span className="text-ff-pink-deep">FORGE</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-ff-plum">
          Your curious cabinet of face-born heroes
        </p>
      </header>

      <section className="sticker-panel mt-6 p-4" aria-labelledby="collection-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[0.18em] text-ff-pink-deep">
              COLLECTION
            </p>
            <h2 id="collection-title" className="text-xl font-black text-ff-ink">
              Class Album
            </h2>
          </div>
          <strong className="text-lg font-black tabular-nums text-ff-plum">
            {unlockedCount}/15
          </strong>
        </div>

        <div
          className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ff-plum bg-ff-lavender-soft p-0.5"
          role="progressbar"
          aria-label="Collection progress"
          aria-valuemin={0}
          aria-valuemax={15}
          aria-valuenow={unlockedCount}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-ff-pink-deep to-ff-lavender transition-[width] duration-300"
            style={{ width: `${(unlockedCount / 15) * 100}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {CLASS_ROSTER.map((classInfo) => {
            const card = bestCardForClass(collection, classInfo.key);
            const content = (
              <>
                <span className="relative block aspect-square w-full">
                  <Image
                    src={CLASS_ASSETS[classInfo.key]}
                    alt={card ? `${classInfo.nameEn} mascot` : ""}
                    fill
                    sizes="(max-width: 430px) 28vw, 120px"
                    className={`object-contain drop-shadow-sm ${card ? "" : "brightness-0 opacity-35"}`}
                  />
                  {!card && (
                    <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-ff-cream [text-shadow:0_3px_0_var(--color-ff-plum)]">
                      ?
                    </span>
                  )}
                </span>
                <span className="mt-1 block min-h-8 text-center text-[10px] font-black leading-tight text-ff-ink">
                  {card ? classInfo.nameEn : "UNKNOWN"}
                </span>
                <span className="mt-1 block text-center text-[10px] font-black uppercase tracking-wider text-ff-plum">
                  {card ? RARITY_LABEL[card.rarity] : "Locked"}
                </span>
              </>
            );

            return card ? (
              <button
                type="button"
                key={classInfo.key}
                onClick={() => openCard(card)}
                className={`collection-slot cursor-pointer ${SLOT_FRAME[card.rarity]}`}
                aria-label={`View ${classInfo.nameEn}, ${RARITY_LABEL[card.rarity]}`}
              >
                {content}
              </button>
            ) : (
              <div
                key={classInfo.key}
                className="collection-slot border-ff-plum/45 bg-ff-plum/20"
                aria-label={`${classInfo.nameEn}, locked`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <nav className="mt-5 grid grid-cols-2 gap-3" aria-label="Game modes">
        <Link href="/draw" className="sticker-button sticker-button-primary">
          <span className="text-lg">Draw</span>
          <small>Forge a card</small>
        </Link>
        <Link href="/battle" className="sticker-button sticker-button-secondary">
          <span className="text-lg">Battle</span>
          <small>Quick or 2 players</small>
        </Link>
      </nav>

      {selected && (
        <CollectionCardDetail
          card={selected}
          flipped={detailFlipped}
          savingImage={savingImage}
          actionError={actionError}
          onFlip={() => setDetailFlipped((value) => !value)}
          onClose={() => setSelected(undefined)}
          onSaveImage={(node) => void saveSelectedCardImage(node)}
        />
      )}
    </main>
  );
}

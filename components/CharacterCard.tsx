"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { CLASS_ASSETS } from "@/lib/engine/assets";
import type { Card, StatKey } from "@/lib/engine/types";

import styles from "./CharacterCard.module.css";

const STATS: readonly { key: StatKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
  { key: "def", label: "DEF" },
  { key: "agi", label: "AGI" },
  { key: "luk", label: "LUK" },
  { key: "grit", label: "GRT" },
];

const RARITY_LABELS = {
  common: "COMMON",
  rare: "RARE",
  legendary: "LEGENDARY",
} as const;

interface CharacterCardProps {
  card: Card;
  flipped: boolean;
  onFlip?: () => void;
  animateStats?: boolean;
  className?: string;
}

export function CharacterCard({
  card,
  flipped,
  onFlip,
  animateStats = false,
  className = "",
}: CharacterCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[card.rarity]} ${className}`}
      data-rarity={card.rarity}
    >
      <button
        type="button"
        className={styles.flipButton}
        onClick={onFlip}
        disabled={!onFlip}
        aria-label={`${flipped ? "View card back" : "Reveal card"}: ${card.class.nameEn}`}
        aria-pressed={flipped}
      >
        <span className={`${styles.inner} ${flipped ? styles.flipped : ""}`}>
          <span className={`${styles.face} ${styles.back}`} aria-hidden={flipped}>
            <span className={styles.backMoon}>☾</span>
            <span className={styles.backTitle}>FACEFORGE</span>
            <span className={styles.constellation} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className={styles.backSubtitle}>A face written in the stars</span>
          </span>

          <span className={`${styles.face} ${styles.front}`} aria-hidden={!flipped}>
            <span className={styles.nameplate}>
              <span className={styles.rarity}>{RARITY_LABELS[card.rarity]}</span>
              <strong>{card.class.nameEn}</strong>
              <small>{card.class.name}</small>
            </span>

            <span className={styles.mascot}>
              <Image
                src={CLASS_ASSETS[card.class.key]}
                alt={`${card.class.nameEn} mascot`}
                fill
                sizes="(max-width: 430px) 76vw, 320px"
              />
            </span>

            <span
              className={`${styles.stats} ${animateStats ? styles.animateStats : ""}`}
              aria-label="Character stats"
            >
              {STATS.map(({ key, label }, index) => {
                const value = card.stats[key];
                const style = {
                  "--stat-value": `${value}%`,
                  "--stat-delay": `${420 + index * 70}ms`,
                } as CSSProperties;

                return (
                  <span className={styles.stat} key={key}>
                    <b>{label}</b>
                    <span className={styles.track} aria-hidden="true">
                      <span className={styles.fill} style={style} />
                    </span>
                    <em>{value}</em>
                  </span>
                );
              })}
            </span>

            <span className={styles.traits}>
              <span className={styles.talent}>
                <b>💎 TALENT</b>
                <small>{card.talent.name}</small>
              </span>
              <span className={styles.curse}>
                <b>💀 CURSE</b>
                <small>
                  {card.curse.name} {Math.round(card.curse.score)}
                </small>
              </span>
            </span>

            <span className={styles.roast} lang="zh-Hant">
              「{card.roast}」
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

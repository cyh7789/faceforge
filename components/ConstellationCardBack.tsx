"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  createConstellationLayout,
  fortuneForClass,
  type ConstellationLayout,
  type ConstellationStar,
} from "@/lib/constellation";
import type { Card } from "@/lib/engine/types";

import styles from "./CharacterCard.module.css";

interface ConstellationCardBackProps {
  card: Card;
}

function drawCrescent(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const x = width * 0.79;
  const y = height * 0.16;
  const radius = width * 0.075;

  context.save();
  context.fillStyle = "#ffe6a5";
  context.strokeStyle = "#67477f";
  context.lineWidth = Math.max(1.5, width * 0.006);
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.arc(
    x + radius * 0.38,
    y - radius * 0.12,
    radius * 0.78,
    0,
    Math.PI * 2,
    true,
  );
  context.fill("evenodd");
  context.stroke();

  context.strokeStyle = "#67477f";
  context.lineWidth = Math.max(1, width * 0.004);
  context.lineCap = "round";
  context.beginPath();
  context.arc(x - radius * 0.27, y - radius * 0.08, radius * 0.12, 0, Math.PI);
  context.stroke();
  context.beginPath();
  context.arc(x - radius * 0.12, y + radius * 0.24, radius * 0.13, 0.15, Math.PI - 0.15);
  context.stroke();
  context.restore();
}

function drawStar(
  context: CanvasRenderingContext2D,
  star: ConstellationStar,
  width: number,
  height: number,
): void {
  const x = star.x * width;
  const y = star.y * height;
  const radius = star.radius * width;
  const innerRadius = radius * 0.58;

  context.save();
  context.globalAlpha = star.brightness;
  context.fillStyle = "#ffe7a8";
  context.strokeStyle = "#65457b";
  context.lineWidth = Math.max(1.2, width * 0.005);
  context.lineJoin = "round";
  context.beginPath();
  for (let point = 0; point < star.points * 2; point += 1) {
    const angle = star.rotation - Math.PI / 2 + (point * Math.PI) / star.points;
    const pointRadius = point % 2 === 0 ? radius : innerRadius;
    const pointX = x + Math.cos(angle) * pointRadius;
    const pointY = y + Math.sin(angle) * pointRadius;
    if (point === 0) {
      context.moveTo(pointX, pointY);
    } else {
      context.lineTo(pointX, pointY);
    }
  }
  context.closePath();
  context.fill();
  context.stroke();

  if (star.smiley && radius >= 5) {
    context.globalAlpha = 0.9;
    context.fillStyle = "#65457b";
    const eyeRadius = Math.max(0.8, radius * 0.08);
    context.beginPath();
    context.arc(x - radius * 0.22, y - radius * 0.05, eyeRadius, 0, Math.PI * 2);
    context.arc(x + radius * 0.22, y - radius * 0.05, eyeRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#65457b";
    context.lineWidth = Math.max(0.8, radius * 0.08);
    context.beginPath();
    context.arc(x, y + radius * 0.06, radius * 0.28, 0.15, Math.PI - 0.15);
    context.stroke();
  }
  context.restore();
}

function drawMap(
  context: CanvasRenderingContext2D,
  layout: ConstellationLayout,
  width: number,
  height: number,
): void {
  const sky = context.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, "#9888d2");
  sky.addColorStop(0.52, "#dca9d2");
  sky.addColorStop(1, "#f2c5d2");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "rgba(255, 241, 202, 0.72)";
  context.lineWidth = Math.max(1.5, width * 0.006);
  context.setLineDash([width * 0.018, width * 0.018]);
  context.beginPath();
  context.ellipse(
    width * 0.5,
    height * 0.49,
    width * 0.32,
    height * 0.33,
    0,
    0,
    Math.PI * 2,
  );
  context.stroke();
  context.restore();

  for (const line of layout.lines) {
    const from = layout.stars[line.from];
    const to = layout.stars[line.to];
    context.save();
    context.globalAlpha = 0.42 + line.brightness * 0.45;
    context.strokeStyle = "#f6d889";
    context.lineWidth = Math.max(1.2, width * 0.006);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(from.x * width, from.y * height);
    context.lineTo(to.x * width, to.y * height);
    context.stroke();
    context.restore();
  }

  for (const star of layout.stars) {
    drawStar(context, star, width, height);
  }
  drawCrescent(context, width, height);
}

export function ConstellationCardBack({ card }: ConstellationCardBackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(
    () => createConstellationLayout(card.id, card.rawScores),
    [card.id, card.rawScores],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) {
        return;
      }
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawMap(context, layout, width, height);
    };

    draw();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", draw);
      return () => window.removeEventListener("resize", draw);
    }
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [layout]);

  return (
    <span className={styles.backMap}>
      <canvas
        ref={canvasRef}
        className={styles.backCanvas}
        aria-label={`Wrinkle constellation map for ${card.class.nameEn}`}
      />
      <span className={styles.backTitle}>FACEFORGE</span>
      <span className={styles.backMapLabel}>WRINKLE CONSTELLATION</span>
      <span className={styles.backFortune} lang="zh-Hant">
        {fortuneForClass(card.class.key)}
      </span>
    </span>
  );
}

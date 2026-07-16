"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PENDING_DRAW_STORAGE_KEY } from "@/lib/draw-session";

import styles from "./draw.module.css";

const HINTS = [
  "Make your weirdest face! 做最怪的表情！",
  "The stranger, the rarer! 越怪越稀有！",
  "Face powers only! 只能用臉！",
] as const;

type CameraStatus = "starting" | "ready" | "error";
type PrecheckMode = "detecting" | "fallback";

interface Shot {
  blob: Blob;
  previewUrl: string;
}

interface DetectedFace {
  boundingBox: DOMRectReadOnly;
}

interface FaceDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedFace[]>;
}

type FaceDetectorConstructor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => FaceDetectorLike;

function battleReturnQuery(search: string): string {
  const params = new URLSearchParams(search);
  if (params.get("returnTo") !== "battle") {
    return "";
  }
  const player = params.get("player") === "B" ? "B" : "A";
  return `?returnTo=battle&player=${player}`;
}

async function downscaleToJpeg(blob: Blob): Promise<string> {
  const sourceUrl = URL.createObjectURL(blob);
  const image = new window.Image();
  image.src = sourceUrl;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(sourceUrl);
    throw new Error("Image could not be decoded");
  }

  const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(sourceUrl);
    throw new Error("Canvas is unavailable");
  }
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(sourceUrl);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export default function DrawCameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const shotUrlRef = useRef<string | undefined>(undefined);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");
  const [precheckMode, setPrecheckMode] = useState<PrecheckMode>("detecting");
  const [faceReady, setFaceReady] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [shot, setShot] = useState<Shot>();
  const [submitting, setSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string>();

  useEffect(() => {
    const timer = window.setInterval(
      () => setHintIndex((index) => (index + 1) % HINTS.length),
      3000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let detectionTimer: number | undefined;
    let detecting = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setCameraStatus("error");
        setPrecheckMode("fallback");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        });
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus("ready");

        const FaceDetectorApi = (
          window as unknown as { FaceDetector?: FaceDetectorConstructor }
        ).FaceDetector;
        if (!FaceDetectorApi) {
          setPrecheckMode("fallback");
          return;
        }

        const detector = new FaceDetectorApi({ fastMode: true, maxDetectedFaces: 1 });
        detectionTimer = window.setInterval(async () => {
          const video = videoRef.current;
          if (!video || detecting || video.readyState < 2) {
            return;
          }

          detecting = true;
          try {
            const faces = await detector.detect(video);
            const box = faces[0]?.boundingBox;
            const largeEnough = Boolean(
              box &&
                box.width / video.videoWidth >= 0.34 &&
                box.height / video.videoHeight >= 0.34,
            );
            if (!cancelled) {
              setFaceReady(largeEnough);
            }
          } catch {
            if (!cancelled) {
              setPrecheckMode("fallback");
            }
            if (detectionTimer !== undefined) {
              window.clearInterval(detectionTimer);
            }
          } finally {
            detecting = false;
          }
        }, 600);
      } catch {
        if (!cancelled) {
          setCameraStatus("error");
          setPrecheckMode("fallback");
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      if (detectionTimer !== undefined) {
        window.clearInterval(detectionTimer);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
      if (shotUrlRef.current) {
        URL.revokeObjectURL(shotUrlRef.current);
      }
    };
  }, []);

  function setCapturedShot(blob: Blob) {
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(blob);
    shotUrlRef.current = previewUrl;
    setShot({ blob, previewUrl });
    setCaptureError(undefined);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCaptureError("Camera is still waking up. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCaptureError("This browser could not capture the frame.");
      return;
    }
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedShot(blob);
        } else {
          setCaptureError("This browser could not capture the frame.");
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  function chooseFile(file: File | undefined) {
    if (file) {
      setCapturedShot(file);
    }
  }

  function retake() {
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current);
      shotUrlRef.current = undefined;
    }
    setShot(undefined);
    setCaptureError(undefined);
  }

  async function submitShot() {
    if (!shot || submitting) {
      return;
    }
    setSubmitting(true);
    setCaptureError(undefined);
    try {
      const image = await downscaleToJpeg(shot.blob);
      sessionStorage.setItem(PENDING_DRAW_STORAGE_KEY, image);
      router.push(`/draw/reveal${battleReturnQuery(window.location.search)}`);
    } catch {
      setCaptureError("We could not read that image. Try another photo.");
      setSubmitting(false);
    }
  }

  const shutterEnabled =
    cameraStatus === "ready" && (precheckMode === "fallback" || faceReady);

  if (shot) {
    return (
      <main className="phone-shell relative flex min-h-dvh flex-col overflow-hidden bg-ff-ink">
        <div className="relative min-h-0 flex-1 bg-ff-ink">
          <Image
            src={shot.previewUrl}
            alt="Captured face preview"
            fill
            unoptimized
            className="object-contain"
          />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-ff-ink/80 to-transparent px-5 pb-14 pt-[calc(18px+env(safe-area-inset-top))] text-center text-ff-cream">
            <p className="text-xs font-black tracking-[0.2em]">PHOTO CHECK</p>
            <h1 className="mt-1 text-2xl font-black">Ready for the mirror?</h1>
          </div>
        </div>

        <section className="rounded-t-[30px] border-t-4 border-ff-plum bg-ff-cream px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          <p className="text-center text-sm font-bold text-ff-plum">
            Keep your full face clear and close to the camera.
          </p>
          {captureError && (
            <p className="mt-3 rounded-xl border-2 border-ff-error bg-white px-3 py-2 text-center text-sm font-bold text-ff-error" role="alert">
              {captureError}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={retake}
              disabled={submitting}
              className="sticker-button sticker-button-secondary"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={submitShot}
              disabled={submitting}
              className="sticker-button sticker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Preparing…" : "Consult Mirror"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${styles.cameraPage} phone-shell min-h-dvh`}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted
        playsInline
        aria-label="Front camera preview"
      />
      <div className={styles.scrim} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          Back
        </Link>
        <div className="text-center text-ff-cream">
          <p className="text-[10px] font-black tracking-[0.2em]">DRAW STATION</p>
          <h1 className="text-lg font-black">Show us your power</h1>
        </div>
        <span className="w-14" aria-hidden="true" />
      </header>

      <section className={styles.guide} aria-label="Face positioning guide">
        <div className={styles.oval} />
        <p className={styles.hint}>{HINTS[hintIndex]}</p>
        <p
          className={`${styles.badge} ${
            precheckMode === "fallback"
              ? styles.warning
              : faceReady
                ? styles.ready
                : styles.waiting
          }`}
          role="status"
        >
          {precheckMode === "fallback"
            ? cameraStatus === "error"
              ? "Face check unavailable — use a photo"
              : "Face check unavailable — camera ready"
            : faceReady
              ? "Face ready"
              : cameraStatus === "starting"
                ? "Starting camera…"
                : "Move closer until your face fills the oval"}
        </p>
      </section>

      <section className={styles.controls}>
        {captureError && (
          <p className={styles.captureError} role="alert">
            {captureError}
          </p>
        )}
        {cameraStatus === "error" && (
          <p className="mb-3 text-center text-sm font-bold text-ff-cream">
            Camera unavailable. Choose a photo instead.
          </p>
        )}
        <button
          type="button"
          className={styles.shutter}
          onClick={captureFrame}
          disabled={!shutterEnabled}
          aria-label={shutterEnabled ? "Take photo" : "Take photo, unavailable until face is ready"}
        >
          <span />
        </button>

        <label className={styles.uploadButton} htmlFor="face-upload">
          Use Photo Instead
        </label>
        <input
          id="face-upload"
          type="file"
          className="sr-only"
          accept="image/*"
          capture="user"
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </section>
    </main>
  );
}

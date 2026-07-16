"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PENDING_DRAW_STORAGE_KEY } from "@/lib/draw-session";
import {
  createLocalFaceDetector,
  evaluateFaceGate,
  type FaceGateState,
  type LocalFaceDetector,
} from "@/lib/faceDetect";

import styles from "./draw.module.css";

const HINTS = [
  "Make your weirdest face! 做最怪的表情！",
  "The stranger, the rarer! 越怪越稀有！",
  "Face powers only! 只能用臉！",
] as const;

type CameraStatus = "starting" | "ready" | "error";
type DetectorStatus = "loading" | "ready" | "degraded";

interface Shot {
  blob: Blob;
  previewUrl: string;
  source: "camera" | "upload";
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const shotUrlRef = useRef<string | undefined>(undefined);
  const detectorRef = useRef<LocalFaceDetector | undefined>(undefined);
  const detectorPromiseRef = useRef<Promise<LocalFaceDetector> | undefined>(undefined);
  const detectorStatusRef = useRef<DetectorStatus>("loading");
  const shotActiveRef = useRef(false);
  const uploadRequestRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>("loading");
  const [cameraGate, setCameraGate] = useState<FaceGateState>("no-face");
  const [hintIndex, setHintIndex] = useState(0);
  const [shot, setShot] = useState<Shot>();
  const [shotGate, setShotGate] = useState<FaceGateState>("good");
  const [uploadChecking, setUploadChecking] = useState(false);
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

    const detectorPromise = createLocalFaceDetector();
    detectorPromiseRef.current = detectorPromise;
    detectorPromise
      .then((detector) => {
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = detector;
        detectorStatusRef.current = "ready";
        setDetectorStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          detectorStatusRef.current = "degraded";
          setDetectorStatus("degraded");
          setCameraGate("degraded");
        }
      });

    return () => {
      cancelled = true;
      detectorRef.current?.close();
      detectorRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setCameraStatus("error");
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
      } catch {
        if (!cancelled) {
          setCameraStatus("error");
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
      if (shotUrlRef.current) {
        URL.revokeObjectURL(shotUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready" || detectorStatus !== "ready") {
      return;
    }

    let cancelled = false;
    let detectionTimer: number | undefined;

    async function detectCameraFace() {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (
        !cancelled &&
        !shotActiveRef.current &&
        video &&
        detector &&
        video.readyState >= 2 &&
        video.videoWidth > 0
      ) {
        try {
          const faces = await detector.detectVideo(video, performance.now());
          if (!cancelled) {
            setCameraGate(
              evaluateFaceGate({
                detectorAvailable: true,
                faces,
                frameWidth: video.videoWidth,
                minimumFaceWidthRatio: 0.35,
              }),
            );
          }
        } catch {
          detectorStatusRef.current = "degraded";
          detectorRef.current?.close();
          detectorRef.current = undefined;
          if (!cancelled) {
            setDetectorStatus("degraded");
            setCameraGate("degraded");
          }
        }
      }

      if (!cancelled && detectorStatusRef.current === "ready") {
        detectionTimer = window.setTimeout(detectCameraFace, 150);
      }
    }

    void detectCameraFace();
    return () => {
      cancelled = true;
      if (detectionTimer !== undefined) {
        window.clearTimeout(detectionTimer);
      }
    };
  }, [cameraStatus, detectorStatus]);

  function setCapturedShot(blob: Blob, source: Shot["source"]): string {
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(blob);
    shotUrlRef.current = previewUrl;
    shotActiveRef.current = true;
    setShot({ blob, previewUrl, source });
    setCaptureError(undefined);
    return previewUrl;
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
          setShotGate(cameraGate);
          setUploadChecking(false);
          setCapturedShot(blob, "camera");
        } else {
          setCaptureError("This browser could not capture the frame.");
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  async function chooseFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const requestId = ++uploadRequestRef.current;
    setShotGate("no-face");
    setUploadChecking(true);
    const previewUrl = setCapturedShot(file, "upload");
    const image = new window.Image();
    image.src = previewUrl;

    try {
      await image.decode();
    } catch {
      if (uploadRequestRef.current === requestId) {
        setCaptureError("We could not read that image. Try another photo.");
        setUploadChecking(false);
      }
      return;
    }

    if (detectorStatusRef.current === "degraded") {
      if (uploadRequestRef.current === requestId) {
        setShotGate("degraded");
        setUploadChecking(false);
      }
      return;
    }

    try {
      const detector = await detectorPromiseRef.current;
      if (!detector || detectorRef.current !== detector) {
        throw new Error("Face detector unavailable");
      }
      const faces = await detector.detectImage(image);
      if (uploadRequestRef.current !== requestId) {
        return;
      }
      const gate = evaluateFaceGate({
        detectorAvailable: true,
        faces,
        frameWidth: image.naturalWidth,
        minimumFaceWidthRatio: 0,
      });
      setShotGate(gate);
      if (gate === "no-face") {
        setCaptureError("這張沒有臉喔 No face detected");
      }
    } catch {
      detectorStatusRef.current = "degraded";
      detectorRef.current?.close();
      detectorRef.current = undefined;
      if (uploadRequestRef.current === requestId) {
        setDetectorStatus("degraded");
        setCameraGate("degraded");
        setShotGate("degraded");
      }
    } finally {
      if (uploadRequestRef.current === requestId) {
        setUploadChecking(false);
      }
    }
  }

  function retake() {
    uploadRequestRef.current += 1;
    shotActiveRef.current = false;
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current);
      shotUrlRef.current = undefined;
    }
    setShot(undefined);
    setShotGate("good");
    setUploadChecking(false);
    setCameraGate(detectorStatusRef.current === "degraded" ? "degraded" : "no-face");
    setCaptureError(undefined);
  }

  async function submitShot() {
    const uploadBlocked =
      shot?.source === "upload" && shotGate !== "good" && shotGate !== "degraded";
    if (!shot || submitting || uploadChecking || uploadBlocked) {
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
    cameraStatus === "ready" && (cameraGate === "good" || cameraGate === "degraded");
  const submitDisabled =
    submitting ||
    uploadChecking ||
    (shot?.source === "upload" && shotGate !== "good" && shotGate !== "degraded");
  const guideTone =
    cameraStatus === "error" || detectorStatus === "degraded"
      ? "warning"
      : cameraStatus === "starting" || detectorStatus === "loading"
        ? "starting"
        : cameraGate === "good"
          ? "ready"
          : "waiting";
  const guideText =
    cameraStatus === "error"
      ? "相機無法使用 Camera unavailable"
      : cameraStatus === "starting"
        ? "啟動相機中 Starting camera…"
        : detectorStatus === "loading"
          ? "啟動臉部偵測中 Starting face check…"
          : cameraGate === "degraded"
            ? "臉部偵測暫時不可用 Face check unavailable"
            : cameraGate === "good"
              ? "可以拍了 Ready"
              : cameraGate === "too-small"
                ? "再靠近一點 Get closer"
                : "找不到臉 Find your face";

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
            <p className="text-xs font-black tracking-[0.2em]">
              {shot.source === "upload" ? "ALBUM CHECK" : "PHOTO CHECK"}
            </p>
            <h1 className="mt-1 text-2xl font-black">Ready for the mirror?</h1>
          </div>
        </div>

        <section className="rounded-t-[30px] border-t-4 border-ff-plum bg-ff-cream px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          {shot.source === "upload" ? (
            <p className="text-center text-sm font-bold text-ff-plum" role="status">
              {uploadChecking
                ? "確認照片中 Checking for a face…"
                : shotGate === "good"
                  ? "找到臉了 Face detected"
                  : shotGate === "degraded"
                    ? "臉部偵測暫時不可用 · Face check unavailable"
                    : "請換一張有臉的照片 Choose another photo"}
            </p>
          ) : (
            <p className="text-center text-sm font-bold text-ff-plum">
              Keep your full face clear and close to the camera.
            </p>
          )}
          {shotGate === "degraded" && (
            <p className="mx-auto mt-2 w-fit rounded-full border border-ff-pink-deep bg-white px-2 py-1 text-center text-[10px] font-black text-ff-pink-deep">
              偵測降級 · Check skipped
            </p>
          )}
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
              disabled={submitDisabled}
              className="sticker-button sticker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadChecking
                ? "Checking…"
                : submitting
                  ? "Preparing…"
                  : "Consult Mirror"}
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
        <div
          className={`${styles.oval} ${
            guideTone === "ready"
              ? styles.ovalReady
              : guideTone === "waiting"
                ? styles.ovalBlocked
                : guideTone === "warning"
                  ? styles.ovalWarning
                  : styles.ovalStarting
          }`}
        />
        <p className={styles.hint}>{HINTS[hintIndex]}</p>
        <p
          className={`${styles.badge} ${styles[guideTone]}`}
          role="status"
        >
          {guideText}
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

        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
        >
          or choose from album
        </button>
        <p className={styles.albumHint}>
          相簿裡沒有傳說 · No legendaries in your album
        </p>
        <input
          ref={fileInputRef}
          id="face-upload"
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={(event) => {
            void chooseFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </section>
    </main>
  );
}

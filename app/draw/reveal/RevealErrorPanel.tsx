import styles from "./reveal.module.css";

export type AnalyzeErrorCode =
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
    detail:
      "讓臉填滿橢圓再試一次 · Fill the oval with your face, then try again.",
  },
  no_face: {
    title: "No face found!",
    subtitle: "魔鏡找不到臉！",
    detail:
      "請讓一張清楚、沒被遮住的臉待在畫面中央 · Keep one clear, uncovered face centered in the frame.",
  },
  file_too_large: {
    title: "That portrait is too mighty!",
    subtitle: "這張照片能量太大了！",
    detail:
      "換一張較小的照片，或直接重拍 · Choose a smaller photo or take a new one.",
  },
  upstream_error: {
    title: "The mirror went cloudy!",
    subtitle: "魔鏡起霧了！",
    detail:
      "照片還在，先再試一次；不行再重拍 · Your photo is safe. Retry, or take another one.",
  },
  missing_photo: {
    title: "No portrait is waiting",
    subtitle: "還沒有照片可以占卜！",
    detail:
      "回到抽卡站拍一張臉照吧 · Return to the draw station and capture your face first.",
  },
};

interface RevealErrorPanelProps {
  code: AnalyzeErrorCode;
  onRetry: () => void;
  onRetake: () => void;
}

export function RevealErrorPanel({
  code,
  onRetry,
  onRetake,
}: RevealErrorPanelProps) {
  const copy = ERROR_COPY[code];

  return (
    <main className="phone-shell flex min-h-dvh flex-col items-center justify-center px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))] text-center">
      <section className="sticker-panel w-full px-6 py-9" role="alert">
        <div className={styles.errorMirror} aria-hidden="true">
          ?
        </div>
        <p className="text-xs font-black tracking-[0.2em] text-ff-error">
          RITUAL INTERRUPTED
        </p>
        <h1 className="mt-2 text-3xl font-black text-ff-ink">{copy.title}</h1>
        <p className="mt-1 text-xl font-black text-ff-pink-deep" lang="zh-Hant">
          {copy.subtitle}
        </p>
        <p className="mx-auto mt-4 max-w-xs text-sm font-bold leading-relaxed text-ff-plum">
          {copy.detail}
        </p>
        <div className="mt-7 grid gap-3">
          {code === "upstream_error" && (
            <button
              type="button"
              onClick={onRetry}
              className="sticker-button sticker-button-primary"
            >
              再試一次 · Retry Ritual
            </button>
          )}
          <button
            type="button"
            onClick={onRetake}
            className="sticker-button sticker-button-secondary"
          >
            重拍 · Retake Photo
          </button>
        </div>
      </section>
    </main>
  );
}

import styles from "./reveal.module.css";

export type AnalyzeErrorCode =
  | "face_too_small"
  | "no_face"
  | "face_out_of_bound"
  | "file_too_large"
  | "upstream_error"
  | "missing_photo";

const ERROR_COPY: Readonly<
  Record<AnalyzeErrorCode, { title: string; subtitle: string; detail: string }>
> = {
  face_too_small: {
    title: "Get closer!",
    subtitle: "Your face needs to get closer!",
    detail:
      "Fill the oval with your face, then try again.",
  },
  no_face: {
    title: "No face found!",
    subtitle: "The mirror can't find a face!",
    detail:
      "Keep one clear, uncovered face centered in the frame.",
  },
  face_out_of_bound: {
    title: "Too close to the mirror!",
    subtitle: "Your face runs past the edge!",
    detail:
      "Back off a little so your whole face fits inside the frame.",
  },
  file_too_large: {
    title: "That portrait is too mighty!",
    subtitle: "This photo's energy is too strong!",
    detail:
      "Choose a smaller photo or take a new one.",
  },
  upstream_error: {
    title: "The mirror went cloudy!",
    subtitle: "The mirror fogged up!",
    detail:
      "Your photo is safe. Retry, or take another one.",
  },
  missing_photo: {
    title: "No portrait is waiting",
    subtitle: "There's no photo to divine yet!",
    detail:
      "Return to the draw station and capture your face first.",
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
        <p className="mt-1 text-xl font-black text-ff-pink-deep">
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
              Retry Ritual
            </button>
          )}
          <button
            type="button"
            onClick={onRetake}
            className="sticker-button sticker-button-secondary"
          >
            Retake Photo
          </button>
        </div>
      </section>
    </main>
  );
}

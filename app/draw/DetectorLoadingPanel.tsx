import styles from "./draw.module.css";

interface DetectorLoadingPanelProps {
  showSkip: boolean;
  onSkip: () => void;
}

export function DetectorLoadingPanel({
  showSkip,
  onSkip,
}: DetectorLoadingPanelProps) {
  return (
    <div className={styles.detectorLoading} role="status" aria-live="polite">
      <div className={styles.loadingMirror} aria-hidden="true">
        <span>☾</span>
      </div>
      <p className={styles.loadingEyebrow}>FIRST-TIME FACE MAGIC</p>
      <h2>
        魔鏡甦醒中…
        <small>Waking the mirror…</small>
      </h2>
      <div className={styles.detectorProgress} aria-hidden="true">
        <i />
      </div>
      <p className={styles.detectorHint}>
        首次載入約 11 MB，完成後拍照會更快。
        <small>Loading face magic once for this browser.</small>
      </p>
      {showSkip && (
        <div className={styles.detectorEscape}>
          <p>載入比預期久一點 · Taking longer than expected</p>
          <button type="button" onClick={onSkip}>
            略過偵測 · Skip detection
          </button>
        </div>
      )}
    </div>
  );
}

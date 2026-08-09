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
        Waking the mirror…
      </h2>
      <div className={styles.detectorProgress} aria-hidden="true">
        <i />
      </div>
      <p className={styles.detectorHint}>
        First load is about 11 MB. Photos will be faster after that.
        <small>Loading face magic once for this browser.</small>
      </p>
      {showSkip && (
        <div className={styles.detectorEscape}>
          <p>Taking longer than expected</p>
          <button type="button" onClick={onSkip}>
            Skip detection
          </button>
        </div>
      )}
    </div>
  );
}

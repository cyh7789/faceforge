import Link from "next/link";

export default function BattleComingSoon() {
  return (
    <main className="phone-shell flex min-h-dvh flex-col items-center justify-center px-6 pb-[calc(32px+env(safe-area-inset-bottom))] pt-[calc(32px+env(safe-area-inset-top))] text-center">
      <div className="sticker-panel w-full px-6 py-10">
        <p className="text-xs font-black tracking-[0.24em] text-ff-pink-deep">
          NEXT QUEST
        </p>
        <div className="mx-auto my-6 flex size-32 items-center justify-center rounded-full border-4 border-ff-plum bg-ff-lavender-soft shadow-[0_6px_0_var(--color-ff-plum)]">
          <span className="text-5xl font-black text-ff-plum" aria-hidden="true">
            VS
          </span>
        </div>
        <h1 className="text-3xl font-black text-ff-ink">Battle is coming soon</h1>
        <p className="mx-auto mt-3 max-w-xs text-base font-bold leading-relaxed text-ff-plum">
          Your heroes are stretching. The arena opens in a later batch.
        </p>
        <Link
          href="/"
          className="sticker-button sticker-button-primary mx-auto mt-8 w-full max-w-xs"
        >
          Back to Collection
        </Link>
      </div>
    </main>
  );
}

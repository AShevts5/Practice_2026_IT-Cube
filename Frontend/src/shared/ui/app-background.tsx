export function AppBackground() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-violet-100/90 via-background to-sky-100/80 dark:from-violet-950/60 dark:via-background dark:to-slate-900/90"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.55 0.19 255 / 0.22) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
    </>
  );
}

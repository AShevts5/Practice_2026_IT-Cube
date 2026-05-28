export async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import("./browser.ts");
  return worker.start({ onUnhandledRequest: "bypass" });
}

import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-primary text-primary-foreground flex items-center justify-center gap-2 px-4 py-2 text-sm"
    >
      <WifiOffIcon className="size-4 shrink-0" />
      <span>Нет сети — показаны сохранённые данные, вход и регистрация недоступны</span>
    </div>
  );
}

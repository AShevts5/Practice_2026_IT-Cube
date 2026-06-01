import { SITE } from "@/shared/model/site";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

export function registerPwa() {
  if (!import.meta.env.PROD) {
    return;
  }

  const updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      toast.info(`${SITE.host} готов к работе офлайн`);
    },
    onNeedRefresh() {
      toast("Доступно обновление", {
        description: "Нажмите, чтобы загрузить новую версию приложения",
        duration: Infinity,
        action: {
          label: "Обновить",
          onClick: () => {
            void updateSW(true);
          },
        },
      });
    },
    onRegistered(registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    },
  });
}

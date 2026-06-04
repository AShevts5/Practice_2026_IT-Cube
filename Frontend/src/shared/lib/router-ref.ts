import type { Router } from "react-router-dom";

let router: Router | null = null;

export function bindRouter(instance: Router) {
  router = instance;
}

export function navigateReplace(to: string) {
  if (router) {
    void router.navigate(to, { replace: true });
    return;
  }
  window.location.assign(to);
}

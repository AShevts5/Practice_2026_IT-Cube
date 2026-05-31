export async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  console.warn(
    "MSW mocks отключены: фронт использует контракт Backend API. Установите VITE_USE_MOCKS=false.",
  );
}

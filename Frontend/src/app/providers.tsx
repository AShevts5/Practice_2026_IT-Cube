import { queryClient, queryPersister, shouldPersistPublicQuery } from "@/shared/api/query-client";
import { ThemeProvider } from "@/shared/model/theme-provider.tsx";
import { OfflineBanner } from "@/shared/ui/offline-banner";
import { Toaster } from "@/shared/ui/kit/sonner";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { defaultShouldDehydrateQuery } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) && shouldPersistPublicQuery(query),
          },
        }}
      >
        <OfflineBanner />
        {children}
        <Toaster richColors position="top-right" />
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

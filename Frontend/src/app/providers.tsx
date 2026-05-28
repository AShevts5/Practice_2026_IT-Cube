import { queryClient } from "@/shared/api/query-client";
import { ThemeProvider } from "@/shared/model/theme-provider.tsx";
import { Toaster } from "@/shared/ui/kit/sonner";
import { QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
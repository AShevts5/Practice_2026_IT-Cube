import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/lib/css";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type ThemeToggleProps = {
  labeled?: boolean;
  className?: string;
};

export function ThemeToggle({ labeled = false, className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return labeled ? (
      <Button
        variant="ghost"
        className={cn("text-muted-foreground h-9 w-full justify-start gap-2 px-2", className)}
        disabled
      >
        <SunIcon className="size-4" />
        Светлая тема
      </Button>
    ) : (
      <Button variant="ghost" size="icon-sm" aria-label="Тема" disabled>
        <SunIcon className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Тёмная тема" : "Светлая тема";
  const Icon = isDark ? MoonIcon : SunIcon;

  if (labeled) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "text-muted-foreground hover:text-foreground h-9 w-full justify-start gap-2 px-2 text-sm font-normal",
          className,
        )}
        aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}

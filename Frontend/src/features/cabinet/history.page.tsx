import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";

function CabinetHistoryPage() {
  return (
    <div>
      <CabinetPageHeader
        title="История"
        description="История изменений команды"
      />
      <p className="text-muted-foreground text-sm">
        Раздел пока не реализован в API бэкенда.
      </p>
    </div>
  );
}

export const Component = CabinetHistoryPage;

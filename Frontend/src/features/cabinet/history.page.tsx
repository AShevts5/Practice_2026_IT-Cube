import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";

function CabinetHistoryPage() {
  return (
    <div>
      <CabinetPageHeader
        title="История"
        description="Журнал действий команды"
      />
      <p className="text-muted-foreground text-sm">
        Здесь появится история ваших изменений.
      </p>
    </div>
  );
}

export const Component = CabinetHistoryPage;

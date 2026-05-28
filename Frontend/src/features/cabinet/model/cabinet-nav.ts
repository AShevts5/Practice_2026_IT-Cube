import { ROUTES } from "@/shared/model/routes";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  ClockIcon,
  FileUpIcon,
  LayoutGridIcon,
  MicIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

export type CabinetNavItem = {
  label: string;
  to?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const CABINET_NAV: CabinetNavItem[] = [
  { label: "Личная информация", to: ROUTES.CABINET_EDIT, icon: UserIcon },
  { label: "Команда", to: ROUTES.CABINET_DASHBOARD, icon: UsersIcon },
  { label: "Кейсы", to: ROUTES.CABINET_CHANGE_CASE, icon: LayoutGridIcon },
  { label: "История", to: ROUTES.CABINET_HISTORY, icon: ClockIcon },
  { label: "Материал кейса", icon: BookOpenIcon, disabled: true },
  { label: "Загрузка решения", icon: FileUpIcon, disabled: true },
  { label: "Защита", icon: MicIcon, disabled: true },
  { label: "Итоги", icon: TrophyIcon, disabled: true },
];

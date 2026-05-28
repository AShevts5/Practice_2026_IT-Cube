import { adminHandlers } from "./admin.ts";
import { authHandlers } from "./auth.ts";
import { boardsHandlers } from "./boards.ts";
import { cabinetHandlers } from "./cabinet.ts";
import { eventsHandlers } from "./events.ts";

export const handlers = [
  ...authHandlers,
  ...eventsHandlers,
  ...cabinetHandlers,
  ...adminHandlers,
  ...boardsHandlers,
];

// Register all handlers by importing this module once.
// Import this in server-side code that publishes events.
import "./handlers/notificationHandler";
import "./handlers/emailHandler";
import "./handlers/activityLogHandler";
import "./handlers/accountingHandler";

export { publish, register, on } from "./eventBus";
export type { DomainEvent, DomainEventType, EventMap } from "./types";

import { getDb } from "../../db/client";
import { container, DI_TOKENS } from "./Container";

export function registerDatabaseInContainerAfterReinit(): void {
  container.register(DI_TOKENS.DB, getDb());
}

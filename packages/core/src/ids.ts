import { randomBytes } from "node:crypto";

export function generateTaskId(): string {
  const hex = randomBytes(2).toString("hex");
  return `tm-${hex}`;
}

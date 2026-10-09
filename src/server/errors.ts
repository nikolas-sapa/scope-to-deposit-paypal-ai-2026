import type { ErrorCode } from "../shared/contracts";

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status: number) {
    super(message);
    this.name = "AppError";
  }
}

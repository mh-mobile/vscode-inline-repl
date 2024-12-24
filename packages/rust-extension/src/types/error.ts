import { object, string, optional, literal, type InferOutput } from "valibot";

export const RustErrorContentSchema = object({
  name: literal("Error"),
  message: string(),
  stack: optional(string()),
});

export type RustErrorContent = InferOutput<typeof RustErrorContentSchema>;

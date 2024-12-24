import {
  object,
  string,
  optional,
  regex,
  type InferOutput,
  pipe,
} from "valibot";

export const RubyErrorContentSchema = object({
  name: pipe(string(), regex(/^(?:Errno::.+|.+Error)$/, "Invalid name format")),
  message: string(),
  stack: optional(string()),
});

export type RubyErrorContent = InferOutput<typeof RubyErrorContentSchema>;

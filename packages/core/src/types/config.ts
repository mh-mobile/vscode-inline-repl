export interface ReplConfiguration {
  clearOnExecute: boolean;
  chromeExecutable: string;
}

export type ConfigurationKey = keyof ReplConfiguration;

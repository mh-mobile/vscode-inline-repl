import {
  workspace,
  WorkspaceConfiguration,
  ConfigurationChangeEvent,
  Event,
  EventEmitter,
  Disposable,
} from "vscode";
import { ReplConfiguration, ConfigurationKey } from "../types/config";

export abstract class ConfigurationManager implements Disposable {
  protected config: WorkspaceConfiguration;
  protected readonly configKeys: ConfigurationKey[] = [
    "clearOnExecute",
    "chromeExecutable",
  ];

  private readonly _onConfigChange = new EventEmitter<{
    key: ConfigurationKey;
    value: ReplConfiguration[ConfigurationKey];
    oldValue: ReplConfiguration[ConfigurationKey];
  }>();

  readonly onConfigChange: Event<{
    key: ConfigurationKey;
    value: ReplConfiguration[ConfigurationKey];
    oldValue: ReplConfiguration[ConfigurationKey];
  }> = this._onConfigChange.event;

  private disposables: Disposable[] = [];

  constructor(protected readonly configSection: string) {
    this.config = workspace.getConfiguration(this.configSection);
    this.disposables.push(
      workspace.onDidChangeConfiguration(this.handleConfigChange.bind(this))
    );
  }

  get<K extends ConfigurationKey>(key: K): ReplConfiguration[K] {
    return this.config.get<ReplConfiguration[K]>(key)!;
  }

  async update<K extends ConfigurationKey>(
    key: K,
    value: ReplConfiguration[K],
    global: boolean = true
  ): Promise<void> {
    await this.config.update(key, value, global);
  }

  getAll(): ReplConfiguration {
    return {
      clearOnExecute: this.get("clearOnExecute"),
      chromeExecutable: this.get("chromeExecutable"),
    };
  }

  private handleConfigChange(event: ConfigurationChangeEvent): void {
    if (event.affectsConfiguration(this.configSection)) {
      const oldConfig = this.config;
      this.config = workspace.getConfiguration(this.configSection);

      for (const key of this.configKeys) {
        if (event.affectsConfiguration(`${this.configSection}.${key}`)) {
          const oldValue = oldConfig.get<ReplConfiguration[typeof key]>(key)!;
          const newValue = this.get(key);

          this._onConfigChange.fire({
            key,
            value: newValue,
            oldValue,
          });
        }
      }
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this._onConfigChange.dispose();
  }
}

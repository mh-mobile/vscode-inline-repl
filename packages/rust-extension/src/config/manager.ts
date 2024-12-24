import {
  ConfigurationManager as BaseConfigurationManager,
  Context,
} from "@inline-repl/core";

export class RustConfigurationManager extends BaseConfigurationManager {
  constructor() {
    super(Context.current.core.extensionPrefix);
  }
}

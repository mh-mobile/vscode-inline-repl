import {
  ConfigurationManager as BaseConfigurationManager,
  Context,
} from "@inline-repl/core";

export class RubyConfigurationManager extends BaseConfigurationManager {
  constructor() {
    super(Context.current.core.extensionPrefix);
  }
}

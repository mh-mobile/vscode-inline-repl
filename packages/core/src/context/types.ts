export interface CoreContext {
  extensionPrefix: string;
  cell_separator: string;
  comment_icon_path?: string;
}

export interface ExtensionSpecificContext {
  language: string;
}

export interface ExtensionContext<T extends ExtensionSpecificContext> {
  core: CoreContext;
  specific: T;
}

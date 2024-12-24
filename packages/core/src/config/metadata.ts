import { ExtensionContext } from "vscode";

export function getExtensionMetadata(context: ExtensionContext) {
  const packageJSON = context.extension.packageJSON;

  const metadata = packageJSON.extensionMetadata || {};
  return {
    identifier: metadata.identifier,
  };
}

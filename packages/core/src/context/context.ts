import {
  CoreContext,
  ExtensionContext,
  ExtensionSpecificContext,
} from "./types";

export class Context<
  T extends ExtensionSpecificContext = ExtensionSpecificContext,
> {
  private static _instance: Context<any>;
  private _context: ExtensionContext<T>;

  static initialize<U extends ExtensionSpecificContext>(
    context: ExtensionContext<U>
  ): Context<U> {
    Context._instance = new Context(context);
    return Context._instance;
  }

  static get current(): Context<any> {
    if (!Context._instance) {
      throw new Error("Context not initialized");
    }
    return Context._instance;
  }

  private constructor(context: ExtensionContext<T>) {
    this._context = context;
  }

  get core(): CoreContext {
    return this._context.core;
  }

  get specific(): T {
    return this._context.specific;
  }
}

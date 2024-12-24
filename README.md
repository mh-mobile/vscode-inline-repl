# VS Code Inline REPL Extensions

This monorepo contains VS Code extensions that provide inline REPL functionality using Jupyter kernels. The extensions allow you to execute code directly in your editor and see the results inline. The project is inspired by [Zed Editor's REPL functionality](https://zed.dev/docs/repl), bringing a similar seamless code evaluation experience to VS Code.

## Available Extensions

- [Ruby Inline REPL](packages/ruby-extension/README.md) - Inline REPL for Ruby using IRuby kernel
- [Rust Inline REPL](packages/rust-extension/README.md) - Inline REPL for Rust using Evcxr kernel

## Project Structure

```
.
├── packages/
│   ├── core/              # Shared core functionality
│   ├── ruby-extension/         # Ruby Inline REPL extension
│   └── rust-extension/         # Rust Inline REPL extension
```

This project uses pnpm workspaces for managing the monorepo.

## Prerequisites

- Node.js (version specified in `.nvmrc`)
- pnpm
- VS Code
- Jupyter
- Language-specific requirements:
  - For Ruby: IRuby kernel
  - For Rust: Evcxr kernel

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/mh-mobile/vscode-inline-repl.git
   cd vscode-inline-repl
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

## Building Extensions

Due to limitations with `vsce` and pnpm workspaces, extensions need to be built using a bundler:

1. Build the core package:

   ```bash
   cd packages/core
   pnpm build
   ```

2. Build the extension:
   ```bash
   cd packages/[ruby-extension|rust-extension]
   pnpm build
   vsce package --no-dependencies
   ```

For detailed information about each extension, please refer to their respective README files:

- [Ruby Inline REPL Documentation](packages/ruby-extension/README.md)
- [Rust Inline REPL Documentation](packages/rust-extension/README.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

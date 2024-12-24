# Rust Inline REPL

[![Visual Studio Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/mh-mobile.rust-inline-repl)](https://marketplace.visualstudio.com/items?itemName=mh-mobile.rust-inline-repl)

Rust Inline REPL is a VS Code extension that provides an interactive way to execute Rust code directly within your editor. It integrates with Jupyter's Rust kernel (Evcxr) to offer a seamless REPL experience while coding.

## Features

- Execute Rust code directly in your editor
- View results inline through VS Code's comment UI
- Code cell support with `// %%` markers
- Queue management for sequential code execution
- Real-time execution status in the status bar
- Support for both selection-based and line-based code execution

### Code Execution Options

- Execute selected code
- Execute current line when no selection
- Execute code cells (marked by `// %%`)

### Visual Feedback

- Inline output display using VS Code's comment UI
- Execution status indicators
- Queue status in the status bar
- Support for error display and stack traces

## Requirements

- Visual Studio Code
- Jupyter VS Code extension
- Rust Evcxr kernel for Jupyter

## Installation

1. Install the [Jupyter extension for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter)
2. Install the Evcxr Jupyter kernel:
   ```bash
   cargo install evcxr_jupyter
   jupyter kernelspec install --user $(evcxr_jupyter --install)
   ```
3. Install this extension from the VS Code marketplace

## Usage

1. Open a Rust file (`.rs`)
2. Start coding and use any of these methods to execute code: `Shortcut: [Ctrl+Shift+Enter] (Windows/Linux) / [Cmd+Shift+Enter] (Mac)`
   - Select code and press
   - Place cursor on a line and press
   - Use code cells with `// %%` markers

## Extension Settings

This extension contributes the following settings:

- `rustInlineRepl.clearOnExecute`: Enable/disable clearing previous outputs when executing new code

## Commands

- `Rust Inline REPL: Execute Code`: Execute the selected code or current line
- `Rust Inline REPL: Clear Output`: Clear all output comments
- `Rust Inline REPL: Restart Kernel`: Restart the Rust kernel
- `Rust Inline REPL: Manage Kernel Access`: Manage access to the Jupyter kernel
- `Rust Inline REPL: Close REPL Output`: Close the REPL output comment
- `Rust Inline REPL: Copy Output`: Copy the current output to the clipboard
- `Rust Inline REPL: Open in Buffer`: Open the REPL output in a new editor buffer

## Known Issues

[Report issues on GitHub]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

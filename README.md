# Obsidian Blur Plugin

A plugin for Obsidian that allows you to selectively blur elements in your notes for privacy or focus purposes.

## Features

- **Selective Blurring**: Choose specific elements to blur in your notes
- **Preset Management**: Create and manage blur presets
- **Easy Selection**: Visual interface for selecting elements with real-time preview
- **Draggable Panel**: Convenient preset management panel that can be moved around
- **Customizable Blur**: Adjust the blur amount to your preference

## How to Use

### Managing Presets

1. Open the command palette (Cmd/Ctrl + P)
2. Run the "Blur Mode:Manage Blur Presets" command
3. A draggable panel will appear showing your current presets
4. Hover over elements to see a preview (yellow highlight)
5. Click elements to add them to your preset (green highlight)
6. Click again to remove them from the preset
7. Use the × button in the preset panel to remove specific elements

### Toggling Blur Effect

- Click the blur icon in the ribbon to toggle the blur effect on/off
- When enabled, all elements in your presets will be blurred
- When disabled, all elements return to normal visibility

### Customizing Blur Amount

1. Go to Settings > Blur Plugin
2. Adjust the "Blur Amount" value (e.g., "5px")
3. Changes will apply immediately if blur is enabled

## Installation

### From Obsidian Community Plugins


### Manual Installation

1. Download the latest release
2. Extract the files to your vault's `.obsidian/plugins/obsidian-blur` folder
3. Reload Obsidian
4. Enable the plugin in Community Plugins settings

## Development

This plugin is built using TypeScript and the Obsidian API.

### Prerequisites

- Node.js
- npm or yarn
- Basic knowledge of TypeScript and Obsidian API

### Building

1. Clone this repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Build the plugin
   ```bash
   npm run build
   ```

### Development Commands

- `npm run dev` - Start development build with hot reload
- `npm run build` - Create production build

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yourusername/obsidian-blur/issues) on GitHub.

## Acknowledgments

- Thanks to the Obsidian team for their excellent API
- Inspired by privacy needs in note-taking

## Changelog

### 1.0.0
- Initial release
- Basic blur functionality
- Preset management
- Customizable blur amount

## Future Plans

- [ ] Multiple preset support
- [ ] Keyboard shortcuts
- [ ] More customization options
- [ ] Export/Import presets

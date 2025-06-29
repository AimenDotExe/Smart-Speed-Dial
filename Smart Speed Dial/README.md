# Speed Dial - Custom New Tab Extension

A beautiful, customizable speed dial new tab page for Chrome with drag & drop functionality, bookmark import, and web search capabilities.

## Features

### 🎨 **Customizable Design**
- **Custom Gradients**: Choose from preset gradients or create your own with dual-color picker
- **Responsive Grid**: Adjustable grid layout (5-9 columns) that adapts to your screen
- **Dynamic Font Sizing**: Intelligent font scaling based on grid density
- **Custom Site Colors**: Personalize each site with custom accent colors

### 🔍 **Smart Search**
- **Integrated Web Search**: Toggle-able search bar for quick web searches
- **Auto-focus**: Start typing anywhere to automatically focus the search bar
- **Clean Interface**: Sleek, glassmorphic search design that blends with your theme

### 📚 **Bookmark Integration**
- **Selective Import**: Choose specific bookmark folders to import
- **Smart Merging**: Add bookmarks to existing sites or replace entirely
- **Favicon Support**: Automatic favicon loading with elegant fallbacks

### 🎯 **Intuitive Management**
- **Drag & Drop Reordering**: Smooth, visual reordering of your sites
- **Right-click Context Menu**: Quick access to edit, delete, and open options
- **Recent Site Suggestions**: Optional suggestions from your browsing history
- **Bulk Operations**: Export/import your entire site collection

### ⚡ **Performance & UX**
- **Instant Loading**: Optimized for fast new tab opening
- **Keyboard Shortcuts**: ESC to close popups, auto-focus search
- **Responsive Design**: Perfect on any screen size
- **Smooth Animations**: Polished micro-interactions throughout

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will automatically replace your new tab page

## Usage

### Adding Sites
- Click the "+" card to add a new site
- Enter the site name and URL
- Choose a custom color for visual organization
- Optionally use recent site suggestions

### Customizing Appearance
- Click the settings gear (⚙️) in the bottom right
- Adjust grid columns, font size, and background gradients
- Choose from preset themes or create custom color combinations
- Toggle search bar and site suggestions

### Managing Sites
- **Reorder**: Drag and drop cards to rearrange
- **Edit**: Right-click any site and select "Edit"
- **Delete**: Right-click and select "Delete"
- **Bulk Import**: Import from Chrome bookmarks or JSON files

### Search Functionality
- Enable search bar in settings
- Type anywhere on the page to auto-focus search
- Press Enter to search the web
- Clear search with the × button

## Technical Details

### Built With
- **Vanilla JavaScript**: No frameworks, pure performance
- **CSS3**: Modern features including backdrop-filter, CSS Grid, and custom properties
- **Chrome Extension APIs**: Storage, Bookmarks, and History integration
- **Responsive Design**: CSS Grid with dynamic column adjustment

### Browser Compatibility
- Chrome 88+ (required for manifest v3)
- Chromium-based browsers (Edge, Brave, etc.)

## Author

**Aimen Zaied**  
🔗 [linktr.ee/AimenZaied](https://linktr.ee/AimenZaied)

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### Version 1.0.0
- Initial release
- Full feature set with customizable grid, themes, and bookmark import
- Drag & drop reordering
- Web search integration
- Context menu actions
- Settings persistence
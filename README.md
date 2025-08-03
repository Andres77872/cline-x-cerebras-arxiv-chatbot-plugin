# ArXiv Reader - AI-Powered Academic Paper Chatbot

A Chrome extension that enhances your research experience by providing an intelligent chatbot to discuss and analyze academic papers from ArXiv and other academic sites.

## 🚀 Features

- **Smart Paper Detection**: Automatically extracts paper information (title, authors, abstract, ArXiv ID) from academic websites
- **AI-Powered Chatbot**: Interactive chatbot to discuss papers, ask questions, and get insights
- **Floating Interface**: Non-intrusive floating button and embedded chatbot interface
- **Multi-Site Support**: Works on ArXiv.org and other academic paper sites
- **Podcast Generation**: Convert paper discussions into podcast format
- **Resume Feature**: Save and resume conversations about papers
- **Responsive Design**: Adapts to different screen sizes and devices

## 📋 Prerequisites

Before installing the extension, you need to have a local API server running:

- **Production API Server**: The extension connects to `https://col.arz.ai`
- Ensure your API server supports the chatbot endpoints used by this extension

## 🔧 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the extension folder
5. The extension will appear in your extensions list and toolbar

### Method 2: Chrome Web Store (If Published)

*This extension is currently in development. Check back for Chrome Web Store availability.*

## 🎯 Usage

### Getting Started

1. **Start your local API server** on port 8051
2. **Visit an academic paper** on ArXiv.org or another supported site
3. **Look for the floating button** that appears on the page
4. **Click the button** to open the chatbot interface

### Main Features

#### 📖 Paper Analysis
- The extension automatically detects and extracts paper information
- View extracted details in the popup or chatbot interface

#### 💬 Chat with Papers
- Ask questions about the paper's methodology, results, or implications
- Get explanations of complex concepts
- Request summaries or key insights

#### 🎧 Podcast Mode
- Convert your paper discussions into podcast format
- Perfect for listening while commuting or multitasking

#### 💾 Save & Resume
- Save your conversations for later reference
- Resume discussions where you left off

### Interface Elements

- **Floating Button**: Appears on academic paper pages for quick access
- **Embedded Chatbot**: Full-featured chat interface with the AI
- **Popup Interface**: Access settings and features from the extension icon
- **Navigation Tabs**: Switch between different features and settings

## ⚙️ Configuration

### Extension Settings

Access settings through the extension popup:

- **API Configuration**: Verify connection to local server
- **Feature Toggles**: Enable/disable specific features
- **Display Options**: Customize the interface appearance

### Supported Sites

The extension works on:
- **ArXiv.org** (full feature support)
- **Generic academic sites** (basic paper extraction)
- **Custom academic platforms** (with manual configuration)

## 🛠️ Development

### Project Structure

```
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup interface
│   ├── popup.html
│   └── popup.js
├── content/               # Content scripts and modules
│   ├── content.js         # Main content script
│   └── modules/           # Modular components
│       ├── utilities.js
│       ├── paper-info.js
│       ├── embedded-chatbot.js
│       ├── floating-button.js
│       ├── floating-menu.js
│       ├── chat-logic.js
│       ├── podcast.js
│       └── resume.js
├── background/            # Background script
└── assets/               # Icons and static assets
```

### Key Components

- **Content Script**: Manages the main extension functionality on web pages
- **Paper Info Extractor**: Identifies and extracts academic paper metadata
- **Chatbot Interface**: Embedded chat UI with AI conversation capabilities
- **API Client**: Handles communication with the local server
- **Modular Architecture**: Clean separation of concerns across features

### Building and Testing

1. **Make changes** to the source code
2. **Reload the extension** in `chrome://extensions/`
3. **Test on ArXiv papers** or supported academic sites
4. **Check the console** for debugging information

## 🔧 Troubleshooting

### Common Issues

**Extension not working on a page:**
- Verify the site is supported (ArXiv.org works best)
- Check if the page has finished loading completely
- Refresh the page and try again

**Chatbot not responding:**
- Ensure your local API server is running on port 8051
- Check the browser console for connection errors
- Verify the API server endpoints are accessible

**Floating button not appearing:**
- The extension may not have detected a valid paper
- Try refreshing the page
- Check if the page URL contains recognizable academic content

### Debug Mode

Enable Chrome Developer Tools to view extension logs:
1. Right-click on the extension icon → "Inspect popup"
2. On the paper page, right-click → "Inspect" → "Console" tab
3. Look for messages starting with "Cline content script" or "ArXiv Reader"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup

1. Fork this repository
2. Make your changes
3. Test thoroughly on various academic sites
4. Submit a pull request with a clear description

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Andres77872**

## 🔄 Version History

- **v0.1.8** - Current version with enhanced modular architecture
- Previous versions focused on core chatbot functionality

## 🆘 Support

For support, please:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Create an issue in the project repository with detailed information

---

*Happy researching! 🎓*

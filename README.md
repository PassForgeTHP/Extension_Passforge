# PassForge Extension

A secure and modern password manager browser extension built with React and WXT framework.

## Overview

PassForge is a browser extension designed to help users securely manage their passwords across different websites. It provides password generation, secure storage, and auto-fill capabilities to enhance online security and user convenience.

## Features

- **Secure Password Storage**: Store passwords encrypted locally
- **Password Generator**: Create strong, random passwords
- **Auto-fill**: Automatically fill login forms on websites
- **Password Detection**: Detect and capture new passwords when you log in
- **Cross-browser Support**: Works on Chrome, Brave, Edge, Opera, and other Chromium-based browsers
- **Modern UI**: Clean and intuitive interface built with React

## Technology Stack

- **WXT Framework**: Modern extension development framework
- **React 18**: User interface library
- **Vite**: Fast build tool and dev server
- **Chrome Extension Manifest V3**: Latest extension API standard

## Installation

### For Development

1. Clone the repository:

```bash
git clone https://github.com/PassForgeTHP/Extension_Passforge.git
cd Extension_Passforge
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Load the extension in your browser:
   - Open your browser and navigate to `chrome://extensions/` (or `brave://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the `.output/chrome-mv3` folder

## Development

### Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run dev:firefox` - Start development server for Firefox
- `npm run build` - Build for production (Chrome)
- `npm run build:firefox` - Build for production (Firefox)
- `npm run zip` - Create distribution package

### Project Structure

```
Extension_Passforge/
├── entrypoints/
│   ├── popup/              # Extension popup UI (React)
│   │   ├── index.html
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── style.css
│   ├── content.js          # Content script (injected into web pages)
│   └── background.js       # Background service worker
├── wxt.config.js           # WXT configuration
├── package.json            # Project dependencies
└── .gitignore              # Git ignore rules
```

## Permissions

The extension requires the following permissions:

- **storage**: To store encrypted passwords locally
- **activeTab**: To access the current tab for auto-fill
- **tabs**: To manage tabs and detect login forms

## Security

PassForge is designed with security as a top priority:

- Passwords are encrypted before storage
- No data is sent to external servers
- All processing happens locally in your browser
- Uses industry-standard encryption algorithms

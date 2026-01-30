# 🎨 KDT - DEMO

**Core Library for Visual Editors based on Konva.js & Vue 3**

[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Konva](https://img.shields.io/badge/Konva-9.x-0D61F2?style=flat-square)](https://konvajs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

[简体中文](./README_CN.md](https://github.com/liganghui/kdt-demo/blob/main/README_CN.md) | [English](./README.md)

---

## 📖 Introduction

**KDT-DEMO** is a graphics processing library encapsulated around **Konva.js** and built within the **Vue 3** ecosystem.

**The Core Solution**: The standout feature of this project is the **simultaneous manipulation of DOM elements within the Canvas**. It is not just a standard Canvas drawing tool; it seamlessly integrates HTML DOM components (such as ECharts, Iframes, etc.) with Canvas graphics. This effectively solves the limitations traditional Canvas editors face when rendering complex Web components.

This project is the **Open Source Simplified Version** of our commercial product. It is ready out-of-the-box, designed to help developers quickly integrate visualization features into their business logic or serve as a foundational reference for custom component development.

---

## ✨ Key Features

This project includes most of the core capabilities required for a professional large-screen/dashboard editor:

### 1. Canvas & Interaction

* **Hybrid Rendering**: Supports same-level interaction between Canvas graphics and DOM elements (Charts, Iframes).
* **Canvas Controls**: Hand (Pan) mode, Ruler display, Zoom controls, and Canvas size configuration.
* **Mobile Support**: Includes a mobile preview mode.
* **Auxiliary Tools**: Rulers and Grid background.

### 2. Components & Layer Management

* **Layer Management**: Full layer operations (Focus, Bring to Front, Send to Back, Lock, Hide).
* **Component System**: Built-in common components (Text, Image, Button, Switch, etc.) with support for custom property panels.
* **Asset Management**: Supports image uploads and **GIF animation** rendering.
* **Context Menu**: Right-click to Group/Ungroup, Lock, Adjust Z-Index, Copy/Cut/Paste, and Focus.

### 3. Workflow & System

* **Data Flow**: Import / Export / Save / Preview / Publish.
* **History**: robust Undo/Redo mechanism.
* **Shortcuts**: Support for standard hotkeys (Ctrl+C, Ctrl+V, Ctrl+Z, etc.).
* **Personalization**: Editor theme color switching.

---

## 📸 Screenshots

### Editor Interface

<img src="https://github.com/liganghui/kdt-demo/blob/main/doc_img/main_en_one.png" alt="Main Interface"/>

### Components & Context Menu

<img src="https://github.com/liganghui/kdt-demo/blob/main/doc_img/main_en_two.png" alt="Context Menu"/>

---

## 🚀 Setup and Build

### 1. Frontend Project

```bash
# 1. Install dependencies
npm install

# 2. Start development server (Node.js >= v18 required)
npm run dev

# 3. Build for production
npm run build

# 4. Lint code
npm run lint

```

### 2. Local Test Server

To fully experience the **Image Upload** and **Save Canvas** features, you must start the local backend server.

```bash
# 1. Enter the server directory
cd server

# 2. Install server dependencies
npm install

# 3. Start the server
npm run server

```

## 📦 Tech Stack

| Module | Technology | Description |
| --- | --- | --- |
| **JS Core** | Vue 3 | Composition API |
| **UI** | Element-plus | UI Component Library |
| **2D Engine** | Konva.js | Core Canvas Rendering Engine |
| **Store** | Vuex | State Management |
| **Router** | Vue-router | Routing |
| **Build** | Vite | Build Tool |

---

## 📂 Directory Structure

<details>
<summary><b>Click to expand detailed structure</b></summary>

```bash
│  ├─ api               // Backend API definitions
│  ├─ assets            // Static assets (SVG icons and images)
│  ├─ core              // ★ KDT Core Module (Canvas Logic)
│  │  ├─ align          // Alignment algorithms
│  │  ├─ dom            // DOM Parsing & Handling (Key Feature)
│  │  ├─ event          // Event handling
│  │  ├─ history        // History (Undo/Redo)
│  │  ├─ layer          // Layer management
│  │  ├─ modules        // Component Class Definitions (Image, Text, Button...)
│  │  ├─ stage          // Stage/Canvas instance
│  │  ├─ transformer    // Transformer logic (Resize/Rotate box)
│  │  └─ utils          // Core utility functions
│  ├─ router            // Router configuration
│  ├─ stores            // State management (Vuex)
│  ├─ views             // Page Views
│  │  ├─ home           // Project Homepage
│  │  └─ stage          // ★ Main Editor View
│  │     ├─ composables // Composition API Hooks
│  │     ├─ domComponents // DOM components rendered in Canvas (Echarts, Iframe...)
│  │     ├─ leftPanels  // Left Sidebar (Assets, Layer Tree)
│  │     ├─ rightPanels // Right Sidebar (Properties, Alignment)
│  │     └─ header.vue  // Top Toolbar
└─ vite.config.js

```

</details>

---

## 🤝 Contribution

Issues and Pull Requests are welcome!
If you like this project, please give it a ⭐️ Star.

## 📄 License

This project is licensed under the [MIT License](https://gs.jurieo.com/gemini/official/search?q=./LICENSE).

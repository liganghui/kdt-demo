# 🎨 KDT - DEMO

**基于 Konva.js & Vue 3 的大屏编辑器核心库**

[简体中文](./README_CN.md) | [English](./README.md)

[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Konva](https://img.shields.io/badge/Konva-9.x-0D61F2?style=flat-square)](https://konvajs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)


---

## 📖 项目简介

**KDT-DEMO** 是一个基于 **Konva.js** 封装的图形处理库，结合 **Vue 3** 生态构建。

**核心痛点解决**：本项目的最大特点是实现了 **Canvas 画布中同时操控 DOM 元素**。它不仅仅是一个 Canvas 绘图工具，更完美融合了 HTML DOM 组件（如 ECharts、Iframe 等）与 Canvas 图形的交互，解决了传统 Canvas 编辑器在渲染复杂 Web 组件时的局限性。

本项目是商用版本的**开源简化版**，开箱即用，旨在帮助开发者快速接入现有的可视化业务，或作为开发自定义业务组件的底层参考。

---

## 🌿 分支说明 (中文)

为了方便国内开发者阅读和理解源码，我特意准备了包含详细**中文注释**的代码分支。

* **master/main**: 主分支，代码保持最新。
* **demo_cn**: **中文注释分支**。如果你使用中文 建议切换到此分支。

```bash
# 切换到中文注释分支
git checkout demo_cn
```

---

## ✨ 核心功能

本项目已内置大屏编辑器所需的绝大部分核心能力：

### 1. 画布与交互

* **DOM/Canvas 混合渲染**：支持 Canvas 图形与 DOM 元素（图表、Iframe）同层级交互。
* **画布控制**：支持抓手模式、标尺显示、缩放控制、画布尺寸设置。
* **移动端适配**：支持移动端预览模式。
* **辅助工具**：标尺、网格背景。

### 2. 组件与图层管理

* **图层管理**：完整的图层操作（聚焦、置顶、置底、锁定、隐藏）。
* **组件体系**：内置常用组件（文本、图片、按钮、开关等），支持自定义组件属性面板。
* **素材管理**：支持图片上传，支持 **GIF 动图** 渲染。
* **右键菜单**：组合/解散、锁定、层级调整、复制/剪切/粘贴、聚焦。

### 3. 系统与工作流

* **数据流转**：支持 导入 / 导出 / 保存 / 预览 / 发布。
* **历史记录**：完善的撤销/恢复机制。
* **快捷键**：支持常用操作快捷键（Ctrl+C, Ctrl+V, Ctrl+Z 等）。
* **个性化**：支持编辑器主题色切换。

---

## 📸 功能演示

### 编辑器主界面
<img src="https://github.com/liganghui/kdt-demo/blob/main/doc_img/main_one_cn.png"/>

### 图层与右键菜单
<img src="https://github.com/liganghui/kdt-demo/blob/main/doc_img/main_two_cn.png"/>


---

## 🚀 运行和构建

### 1. 前端项目 (Client)

```bash
# 1. 安装依赖
npm install

# 2. 启动开发环境 (需 Node.js >= v18)
npm run dev

# 3. 构建生产包
npm run build

# 4. 代码检查
npm run lint

```

### 2. 本地测试服务 (Server)

为了完整体验 **上传图片** 和 **保存画布** 功能，请务必启动本地测试服务器。

```bash
# 1. 进入 server 文件夹
cd server

# 2. 安装服务端依赖
npm install

# 3. 启动服务
npm run server

```

## 📦 项目核心依赖

| 模块 | 技术栈 | 说明 |
| --- | --- | --- |
| **JS Core** | Vue 3 | 组合式 API 开发 |
| **UI** | Element-plus | 界面 UI 组件库 |
| **2D Engine** | Konva.js | 核心 Canvas 渲染引擎 |
| **Store** | Vuex | 状态管理 |
| **Router** | Vue-router | 路由管理 |
| **Build** | Vite | 构建工具 |

---

## 📂 目录结构

<details>
<summary><b>点击展开查看详细目录结构</b></summary>

```bash
│  ├─ api               // 后端接口定义
│  ├─ assets            // 静态资源 (SVG图标和图片)
│  ├─ core              // ★ KDT 核心模块 (画布逻辑)
│  │  ├─ align          // 对齐算法模块
│  │  ├─ dom            // DOM 解析与处理 (核心特色)
│  │  ├─ event          // 事件处理
│  │  ├─ history        // 历史记录 (撤销重做)
│  │  ├─ layer          // 图层管理
│  │  ├─ modules        // 组件类定义 (Image, Text, Button...)
│  │  ├─ stage          // 画布实例
│  │  ├─ transformer    // 变换框逻辑
│  │  └─ utils          // 核心工具类
│  ├─ router            // 路由配置
│  ├─ stores            // 状态管理 (Vuex)
│  ├─ views             // 页面视图
│  │  ├─ home           // 项目主页
│  │  └─ stage          // ★ 编辑器主视图
│  │     ├─ composables // 组合式函数 (Hooks)
│  │     ├─ domComponents // 画布内渲染的 DOM 组件 (Echarts, Iframe...)
│  │     ├─ leftPanels  // 左侧面板 (素材库, 图层树)
│  │     ├─ rightPanels // 右侧面板 (属性设置, 对齐)
│  │     └─ header.vue  // 顶部工具栏
└─ vite.config.js

```

</details>

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！
如果你喜欢这个项目，请给它一个 ⭐️ Star。

## 📄 开源协议

本项目采用 [MIT License](https://gs.jurieo.com/gemini/official/search?q=./LICENSE) 开源协议。

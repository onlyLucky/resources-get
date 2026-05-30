# 资源嗅探器 (Resource Sniffer)

一款浏览器资源嗅探插件，支持嗅探网页中的图片、媒体（视频/音频）、文档资源，并提供预览、定位、下载功能。

## 功能特性

- 🖼️ **图片嗅探**: 嗅探页面中的所有图片，包括 img 标签、背景图片、srcset 等
- 🎬 **媒体嗅探**: 嗅探视频和音频文件，支持 video、audio、iframe 等标签
- 📄 **文档嗅探**: 嗅探 PDF、Word、Excel 等文档文件
- 🔍 **搜索过滤**: 支持按文件名、URL 关键词过滤
- 📊 **排序功能**: 支持按文件名、大小、类型排序
- 🎯 **定位高亮**: 点击资源项可滚动到元素位置并显示红色边框
- 📦 **批量下载**: 支持逐个下载、批量下载、ZIP 打包下载
- 🔄 **自动嗅探**: 可选的自动嗅探功能

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式
- JSZip 打包库
- Chrome Extension Manifest V3

## 安装使用

### 开发环境

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 安装到浏览器

1. 运行 `npm run build` 构建项目
2. 打开 Chrome/Edge 浏览器，进入扩展管理页面 (`chrome://extensions/`)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `dist` 文件夹

## 使用说明

1. 安装插件后，在浏览器工具栏点击插件图标
2. 点击"嗅探"按钮扫描当前页面的资源
3. 使用 Tab 切换查看不同类型的资源
4. 点击资源项可滚动到页面中对应位置并高亮显示
5. 勾选需要下载的资源，点击下载按钮

## 项目结构

```
src/
├── popup/           # Popup 界面
│   ├── components/  # UI 组件
│   └── hooks/       # 自定义 Hooks
├── content/         # Content Script
│   └── extractors/  # 资源提取器
├── background/      # Service Worker
├── types/           # 类型定义
├── utils/           # 工具函数
└── styles/          # 样式文件
```

## 许可证

MIT License

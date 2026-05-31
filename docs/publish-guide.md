# 浏览器插件上架打包指南

## 目录

- [1. 准备工作](#1-准备工作)
- [2. 生成插件图标](#2-生成插件图标)
- [3. 打包 ZIP 文件](#3-打包-zip-文件)
- [4. 生成 CRX 文件（本地分发）](#4-生成-crx-文件本地分发)
- [5. Chrome Web Store 上架](#5-chrome-web-store-上架)
- [6. Edge Add-ons 上架](#6-edge-add-ons-上架)
- [7. 常见问题](#7-常见问题)

---

## 1. 准备工作

### 1.1 检查 manifest.json

确保 `manifest.json` 包含以下必要字段：

```json
{
  "manifest_version": 3,
  "name": "资源嗅探器",
  "version": "1.0.0",
  "description": "嗅探网页中的图片、媒体、文档资源，支持预览、定位、下载",
  "permissions": [
    "activeTab",
    "scripting",
    "downloads",
    "storage"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 1.2 权限说明

| 权限 | 用途 | 是否必需 |
|------|------|----------|
| `activeTab` | 访问当前活动标签页 | ✅ 是 |
| `scripting` | 注入 Content Script | ✅ 是 |
| `downloads` | 下载文件 | ✅ 是 |
| `storage` | 存储设置和缓存 | ✅ 是 |
| `sidePanel` | 侧边栏功能 | ❌ 可选 |

### 1.3 准备材料清单

- [ ] 插件图标（16x16, 48x48, 128x128）
- [ ] 商店图标（128x128 必需）
- [ ] 截图（至少 1 张，建议 3-5 张）
- [ ] 详细描述（支持中英文）
- [ ] 隐私政策 URL（如使用 storage）

---

## 2. 生成插件图标

### 2.1 使用在线工具

推荐工具：
- [Figma](https://figma.com) - 专业设计工具
- [Canva](https://canva.com) - 简单易用
- [IconFinder](https://iconfinder.com) - 图标素材

### 2.2 使用 Node.js 脚本生成

创建 `scripts/generate-icons.js`：

```javascript
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 48, 128];
const inputIcon = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon${size}.png`));

    console.log(`Generated icon${size}.png`);
  }
}

generateIcons().catch(console.error);
```

运行脚本：

```bash
npm install sharp --save-dev
node scripts/generate-icons.js
```

### 2.3 图标要求

| 尺寸 | 用途 | 格式 |
|------|------|------|
| 16x16 | 浏览器工具栏小图标 | PNG |
| 48x48 | 扩展管理页面 | PNG |
| 128x128 | Chrome Web Store | PNG |

**设计建议：**
- 使用简洁明了的图形
- 避免过多细节（小尺寸会模糊）
- 使用鲜明的颜色对比
- 保持与品牌一致

---

## 3. 打包 ZIP 文件

### 3.1 手动打包

```bash
# 进入项目目录
cd /Users/feynman/Documents/code/2026/@IDEA/BrowserPlugin/ResourcesGet

# 构建项目
pnpm run build

# 打包 dist 目录
cd dist
zip -r ../resource-sniffer.zip .
cd ..
```

### 3.2 使用脚本打包

创建 `scripts/package.sh`：

```bash
#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始打包插件...${NC}"

# 清理旧的构建文件
echo "清理旧文件..."
rm -rf dist
rm -f resource-sniffer.zip

# 构建项目
echo "构建项目..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "构建失败！"
    exit 1
fi

# 打包 ZIP
echo "打包 ZIP 文件..."
cd dist
zip -r ../resource-sniffer.zip .
cd ..

# 检查文件大小
FILE_SIZE=$(stat -f%z resource-sniffer.zip 2>/dev/null || stat -c%s resource-sniffer.zip)
FILE_SIZE_KB=$((FILE_SIZE / 1024))

echo -e "${GREEN}打包完成！${NC}"
echo -e "文件: ${GREEN}resource-sniffer.zip${NC}"
echo -e "大小: ${GREEN}${FILE_SIZE_KB} KB${NC}"

# 检查是否超过 Chrome Web Store 限制
if [ $FILE_SIZE -gt 10485760 ]; then
    echo -e "${YELLOW}警告: 文件超过 10MB，Chrome Web Store 可能拒绝上传${NC}"
fi
```

运行脚本：

```bash
chmod +x scripts/package.sh
./scripts/package.sh
```

### 3.3 添加到 package.json

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "package": "pnpm run build && cd dist && zip -r ../resource-sniffer.zip . && cd ..",
    "package:crx": "pnpm run build && chrome --pack-extension=dist --pack-extension-key=key.pem"
  }
}
```

使用：

```bash
pnpm run package
```

---

## 4. 生成 CRX 文件（本地分发）

### 4.1 使用 Chrome 命令行

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --pack-extension=/path/to/dist \
  --pack-extension-key=/path/to/key.pem

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --pack-extension=C:\path\to\dist \
  --pack-extension-key=C:\path\to\key.pem

# Linux
google-chrome \
  --pack-extension=/path/to/dist \
  --pack-extension-key=/path/to/key.pem
```

### 4.2 说明

- 如果不提供 `key.pem`，Chrome 会自动生成
- `key.pem` 文件要妥善保管，用于后续更新
- CRX 文件用于内部分发，不需要上架商店

### 4.3 安装 CRX 文件

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启「开发者模式」
3. 将 CRX 文件拖放到浏览器窗口
4. 点击「添加扩展程序」

---

## 5. Chrome Web Store 上架

### 5.1 注册开发者账号

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 使用 Google 账号登录
3. 支付一次性注册费 **$5 USD**
4. 同意开发者协议

### 5.2 上传插件

1. 登录 [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 点击「**New Item**」按钮
3. 上传 `resource-sniffer.zip` 文件
4. 等待上传完成

### 5.3 填写商品信息

#### 基本信息

| 字段 | 说明 | 必填 |
|------|------|------|
| 商品名称 | 资源嗅探器 | ✅ |
| 详细描述 | 插件功能说明 | ✅ |
| 版本说明 | 更新内容 | ❌ |
| 类别 | 工具 / 效率 | ✅ |
| 语言 | 中文 / 英文 | ✅ |

#### 图片资源

| 类型 | 尺寸 | 数量 | 必填 |
|------|------|------|------|
| 商店图标 | 128x128 | 1 | ✅ |
| 截图 | 1280x800 或 640x400 | 1-5 | ✅ |
| 宣传图 | 1400x560 | 1 | ❌ |
| 小宣传图 | 440x280 | 1 | ❌ |

#### 描述示例

```
资源嗅探器 - 一键嗅探网页资源

功能特点：
• 智能嗅探：自动识别网页中的图片、视频、音频、文档
• 分类浏览：按资源类型分类显示，支持搜索过滤
• 一键下载：支持单个下载、批量下载、ZIP 打包下载
• 精准定位：点击资源可快速滚动到页面中的位置
• 资源预览：图片缩略图预览，文件信息显示

使用方法：
1. 点击浏览器工具栏的插件图标
2. 点击「嗅探」按钮扫描当前页面
3. 选择需要的资源进行下载

支持的资源类型：
• 图片：JPG、PNG、GIF、WebP、SVG 等
• 视频：MP4、WebM、AVI、MOV 等
• 音频：MP3、WAV、AAC、FLAC 等
• 文档：PDF、DOC、XLS、PPT 等
```

### 5.4 隐私政策

如果插件使用 `storage` 权限，需要提供隐私政策。

**隐私政策模板：**

```markdown
# 隐私政策

最后更新日期：2024年1月1日

## 数据收集

资源嗅探器不会收集、存储或传输任何个人数据。

## 本地存储

插件使用浏览器本地存储保存以下信息：
- 用户设置（如自动嗅探开关）
- 嗅探缓存（仅在本地，不会上传）

## 权限使用

- activeTab：仅访问用户主动使用的标签页
- scripting：仅在用户点击嗅探时注入脚本
- downloads：仅用于用户主动触发的下载
- storage：仅用于保存本地设置

## 联系方式

如有问题，请联系：[your-email@example.com]
```

### 5.5 提交审核

1. 检查所有信息是否正确
2. 点击「**Publish**」按钮
3. 等待审核（通常 1-3 个工作日）

### 5.6 审核状态

| 状态 | 说明 |
|------|------|
| Pending Review | 等待审核 |
| In Review | 审核中 |
| Published | 已发布 |
| Rejected | 被拒绝（需修改后重新提交） |

### 5.7 常见拒绝原因

1. **权限过多**：只申请必要的权限
2. **缺少隐私政策**：使用 storage 需要提供
3. **描述不清晰**：详细说明插件功能
4. **图标质量差**：使用高清图标
5. **代码混淆**：Chrome 要求代码可读

---

## 6. Edge Add-ons 上架

### 6.1 注册开发者账号

1. 访问 [Microsoft Partner Center](https://partner.microsoft.com)
2. 使用 Microsoft 账号登录
3. 注册开发者账号（**免费**）

### 6.2 上传插件

1. 登录 [Partner Center](https://partner.microsoft.com)
2. 进入「Microsoft Edge Add-ons」
3. 点击「+ New extension」
4. 上传 ZIP 文件

### 6.3 填写信息

与 Chrome Web Store 类似，填写：
- 插件名称
- 描述
- 截图
- 隐私政策

### 6.4 提交审核

1. 检查信息
2. 点击「Publish」
3. 等待审核（通常 1-5 个工作日）

### 6.5 Chrome vs Edge 对比

| 项目 | Chrome Web Store | Edge Add-ons |
|------|------------------|--------------|
| 注册费 | $5 | 免费 |
| 审核时间 | 1-3 天 | 1-5 天 |
| ZIP 格式 | ✅ | ✅ |
| Manifest V3 | ✅ | ✅ |

---

## 7. 常见问题

### Q1: ZIP 文件太大怎么办？

**A:** 检查以下几点：
- 移除不必要的文件（如 `.map` 文件）
- 压缩图片资源
- 移除 `node_modules` 和源代码

### Q2: 审核被拒绝怎么办？

**A:** 
1. 查看拒绝邮件中的具体原因
2. 根据原因修改插件
3. 重新打包上传
4. 再次提交审核

### Q3: 如何更新已发布的插件？

**A:**
1. 更新 `manifest.json` 中的版本号
2. 重新打包 ZIP
3. 在 Developer Dashboard 中上传新版本
4. 提交审核

### Q4: 如何查看插件统计数据？

**A:**
- Chrome: 在 Developer Dashboard 中查看
- Edge: 在 Partner Center 中查看

### Q5: 插件可以同时上架 Chrome 和 Edge 吗？

**A:** 可以，使用同一个 ZIP 文件即可。两个平台都支持 Manifest V3。

---

## 附录：快速打包脚本

创建 `scripts/release.sh`：

```bash
#!/bin/bash

set -e

echo "🚀 开始发布流程..."

# 1. 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 工作目录不干净，请先提交代码"
    exit 1
fi

# 2. 运行测试（如果有）
# pnpm test

# 3. 构建项目
echo "📦 构建项目..."
pnpm run build

# 4. 打包 ZIP
echo "📁 打包 ZIP..."
cd dist
zip -r ../resource-sniffer.zip .
cd ..

# 5. 显示文件信息
echo ""
echo "✅ 打包完成！"
echo "📄 文件: resource-sniffer.zip"
echo "📊 大小: $(du -h resource-sniffer.zip | cut -f1)"
echo ""
echo "📋 下一步："
echo "  1. 访问 https://chrome.google.com/webstore/devconsole"
echo "  2. 上传 resource-sniffer.zip"
echo "  3. 填写商品信息"
echo "  4. 提交审核"
```

使用：

```bash
chmod +x scripts/release.sh
./scripts/release.sh
```

---

## 参考链接

- [Chrome Web Store 开发者文档](https://developer.chrome.com/docs/webstore/)
- [Edge Add-ons 开发者文档](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome Web Store 审核指南](https://developer.chrome.com/docs/webstore/review-process/)

---

*文档版本：v1.0*
*最后更新：2024年*

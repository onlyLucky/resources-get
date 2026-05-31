#!/bin/bash

# 资源嗅探器打包脚本
# 使用方法: ./scripts/package.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}    资源嗅探器 - 打包脚本${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 1. 检查依赖
echo -e "${YELLOW}[1/4] 检查依赖...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}错误: 未找到 pnpm，请先安装 pnpm${NC}"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    echo -e "${RED}错误: 未找到 zip 命令${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 依赖检查通过${NC}"

# 2. 清理旧文件
echo -e "${YELLOW}[2/4] 清理旧文件...${NC}"
rm -rf dist
rm -f resource-sniffer.zip
rm -f resource-sniffer.crx
echo -e "${GREEN}✓ 清理完成${NC}"

# 3. 构建项目
echo -e "${YELLOW}[3/4] 构建项目...${NC}"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 构建失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 构建成功${NC}"

# 4. 打包 ZIP
echo -e "${YELLOW}[4/4] 打包 ZIP 文件...${NC}"
cd dist
zip -r ../resource-sniffer.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

# 获取文件大小
if [[ "$OSTYPE" == "darwin"* ]]; then
    FILE_SIZE=$(stat -f%z resource-sniffer.zip)
else
    FILE_SIZE=$(stat -c%s resource-sniffer.zip)
fi

FILE_SIZE_KB=$((FILE_SIZE / 1024))
FILE_SIZE_MB=$((FILE_SIZE_KB / 1024))

echo -e "${GREEN}✓ 打包完成${NC}"

# 显示结果
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📄 文件: ${GREEN}resource-sniffer.zip${NC}"

if [ $FILE_SIZE_MB -gt 0 ]; then
    echo -e "📊 大小: ${GREEN}${FILE_SIZE_MB} MB${NC}"
else
    echo -e "📊 大小: ${GREEN}${FILE_SIZE_KB} KB${NC}"
fi

# 检查文件大小限制
if [ $FILE_SIZE -gt 10485760 ]; then
    echo ""
    echo -e "${YELLOW}⚠ 警告: 文件超过 10MB，Chrome Web Store 可能拒绝上传${NC}"
fi

echo ""
echo -e "📋 下一步:"
echo -e "  1. 访问 ${GREEN}https://chrome.google.com/webstore/devconsole${NC}"
echo -e "  2. 上传 resource-sniffer.zip"
echo -e "  3. 填写商品信息"
echo -e "  4. 提交审核"
echo ""

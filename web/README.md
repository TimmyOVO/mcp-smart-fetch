# MCP Smart Fetch - 项目介绍网页

这是一个为MCP Smart Fetch项目创建的响应式介绍网页，使用React + TypeScript + Vite构建。

## 功能特性

- 🎨 **现代化设计**: 紫色渐变主题，响应式布局
- ✨ **流畅动画**: 使用Framer Motion实现丰富的动画效果
- 🌟 **粒子背景**: 动态Canvas粒子动画系统
- 📱 **移动端友好**: 完全响应式设计，适配各种屏幕尺寸
- 🎯 **代码高亮**: 使用react-syntax-highlighter美化代码显示
- ⚡ **性能优化**: 代码分割、压缩、Gzip/Brotli压缩
- 🔍 **SEO友好**: 完整的元标签和结构化数据

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **代码高亮**: react-syntax-highlighter

## 本地开发

### 环境要求

- Node.js 20.19+ 或 22.12+
- npm 或 yarn

### 安装依赖

```bash
cd web
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看网页。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署到GitHub Pages

### 自动部署

项目已配置GitHub Actions工作流，当推送到`master`分支时会自动构建并部署到GitHub Pages。

### 手动部署

1. 在GitHub仓库设置中启用Pages功能
2. 选择"GitHub Actions"作为部署源
3. 推送代码到master分支

### 部署配置

- **基础路径**: `/mcp-smart-fetch/` (生产环境)
- **输出目录**: `dist`
- **构建命令**: `npm run build`

## 项目结构

```
web/
├── src/
│   ├── components/          # React组件
│   │   ├── Hero.tsx        # 英雄区域
│   │   ├── Features.tsx    # 功能展示
│   │   ├── Architecture.tsx # 技术架构
│   │   ├── QuickStart.tsx  # 快速开始
│   │   ├── Deployment.tsx  # 部署指南
│   │   └── Footer.tsx      # 页脚
│   ├── animations/         # 动画配置
│   │   ├── particles.ts    # 粒子动画
│   │   └── transitions.ts  # 过渡动画
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
├── public/                # 静态资源
├── index.html            # HTML模板
└── package.json          # 依赖配置
```

## 自定义配置

### 主题颜色

在 `src/index.css` 中修改CSS变量来自定义主题颜色：

```css
:root {
  --primary-50: #faf5ff;
  --primary-500: #8b5cf6;
  --primary-900: #4c1d95;
  /* ... 其他颜色变量 */
}
```

### 动画配置

在 `src/animations/` 目录下修改动画配置：

- `transitions.ts`: 页面过渡动画
- `particles.ts`: 粒子动画系统

### SEO配置

在 `index.html` 中修改SEO相关的元标签。

## 性能优化

项目已配置以下性能优化：

- **代码分割**: 按vendor、animation、ui、syntax分组
- **压缩**: 生产环境移除console和debugger
- **Gzip/Brotli压缩**: 自动生成压缩版本
- **资源预加载**: 关键资源预连接

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License

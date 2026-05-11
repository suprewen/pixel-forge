# Pixel Forge

一个参考 PixelMe 交互思路的免费静态站：图片转像素风，全程在浏览器本地处理，不上传服务器。

## 功能

- 图片上传 / 拖拽
- 头像模式、风景/宠物/物体模式
- 自适应、PICO-8、Game Boy、NES-ish 调色板
- 像素块、颜色数、对比度、饱和度、亮度调节
- Floyd-Steinberg 抖动
- 多档像素粒度预览
- PNG 下载

## 技术栈

- Vite + TypeScript
- Canvas 2D
- 静态部署，适合 Cloudflare Pages / GitHub Pages / Netlify 免费层

## 开发

```bash
npm install
npm run dev
npm run build
```

## 复刻边界

PixelMe 网页版的核心转换在后端 API。这个项目先实现一个低成本、可免费部署的纯前端版本；后续如果要更接近 PixelMe 的 AI 效果，可以增加 Cloudflare Workers + 后端图像模型服务。

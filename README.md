# Pixel Forge

一个参考 PixelMe 交互思路的图片转像素风工具。默认浏览器本地 Canvas 处理，也新增了可选的 Cloudflare Workers + R2 + SD/LoRA 后端增强路径。

## 功能

- 图片上传 / 拖拽
- 头像模式、风景/宠物/物体模式
- 自适应、PICO-8、Game Boy、NES-ish 调色板
- 像素块、颜色数、对比度、饱和度、亮度调节
- Floyd-Steinberg 抖动
- 多档像素粒度预览
- PNG 下载
- 可选后端增强：
  - Cloudflare Pages Functions API
  - R2 临时图片存储
  - 浏览器 FaceDetector 人脸检测 + Worker 自动裁剪兜底
  - SD / LoRA 图像后端适配层
  - GitHub Actions 构建 / 部署工作流

## 技术栈

- Vite + TypeScript
- Canvas 2D
- Cloudflare Pages Functions
- Cloudflare R2
- GitHub Actions

## 开发

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

## Cloudflare 配置

`wrangler.toml` 需要一个 R2 bucket：

```toml
[[r2_buckets]]
binding = "PIXEL_FORGE_UPLOADS"
bucket_name = "pixel-forge-temp"
```

SD / LoRA 转换通过 Worker 环境变量接入：

- `AI_IMAGE_ENDPOINT`：图像转换后端地址
- `AI_IMAGE_TOKEN`：可选，Bearer token

未配置时，前端会显示“AI 后端尚未配置”，本地 Canvas 像素化仍可正常使用。

## 复刻边界

PixelMe 网页版的核心转换在后端 API。Pixel Forge 已经接入类似架构的 API 壳：上传、检测裁剪、转换；真正的 SD / LoRA 效果取决于后续接入的图像模型服务。

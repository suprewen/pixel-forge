# Pixel Forge

Pixel Forge 是一个像素风头像生成器。上传一张人物照后，应用会自动裁剪头像，生成多种像素风版本，并支持 PNG 下载。

## 功能

- 图片上传 / 拖拽
- 自动头像裁剪
- 多种像素风格：经典、柔和、复古、粗颗粒
- 多档版本预览：清晰、标准、粗粒
- 颜色、颗粒、对比度、饱和度、亮度微调
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

未配置时，本地 Canvas 像素化仍可正常使用。

## 实现边界

当前版本已经接入上传、头像裁剪和本地像素化流程。真正的 SD / LoRA 风格转换取决于后续接入的图像模型服务。

import { isAllowedImageType, jsonResponse, makeUploadKey } from '../../src/shared/server'

type Env = {
  PIXEL_FORGE_UPLOADS: R2Bucket
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData()
  const file = form.get('image')

  if (typeof file !== 'object' || file === null || !('stream' in file)) {
    return jsonResponse({ error: 'IMAGE_REQUIRED', message: '请上传 image 文件字段。' }, 400)
  }

  const image = file as File
  if (!isAllowedImageType(image.type)) {
    return jsonResponse({ error: 'UNSUPPORTED_IMAGE_TYPE', message: '只支持 PNG / JPEG / WebP。' }, 415)
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: 'IMAGE_TOO_LARGE', message: '临时上传限制为 8MB。' }, 413)
  }

  const key = makeUploadKey(image.name)
  await env.PIXEL_FORGE_UPLOADS.put(key, image.stream(), {
    httpMetadata: { contentType: image.type },
    customMetadata: {
      originalName: image.name,
      uploadedAt: new Date().toISOString(),
    },
  })

  return jsonResponse({
    key,
    url: `/api/image?key=${encodeURIComponent(key)}`,
    contentType: image.type,
    size: image.size,
  })
}

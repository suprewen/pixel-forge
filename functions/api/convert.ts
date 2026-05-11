import { jsonResponse, readJson, stripDataUrlPrefix, type CropRect } from '../../src/shared/server'

type Env = {
  PIXEL_FORGE_UPLOADS: R2Bucket
  AI_IMAGE_ENDPOINT?: string
  AI_IMAGE_TOKEN?: string
}

type ConvertBody = {
  key?: string
  crop?: CropRect
  prompt?: string
  strength?: number
  model?: string
}

type AiResponse = {
  image?: string
  url?: string
  output?: string | string[]
  images?: Array<string | { url?: string; b64_json?: string; image?: string }>
  data?: Array<{ url?: string; b64_json?: string }>
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AI_IMAGE_ENDPOINT) {
    return jsonResponse({
      error: 'AI_BACKEND_NOT_CONFIGURED',
      message: '已接好 SD/LoRA 转换接口适配层，但还没有配置 AI_IMAGE_ENDPOINT / AI_IMAGE_TOKEN。',
    }, 501)
  }

  const body = await readJson<ConvertBody>(request)
  if (!body.key) return jsonResponse({ error: 'KEY_REQUIRED' }, 400)

  const object = await env.PIXEL_FORGE_UPLOADS.get(body.key)
  if (!object) return jsonResponse({ error: 'SOURCE_NOT_FOUND' }, 404)

  const imageBase64 = arrayBufferToBase64(await object.arrayBuffer())
  const aiResponse = await fetch(env.AI_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(env.AI_IMAGE_TOKEN ? { authorization: `Bearer ${env.AI_IMAGE_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      image: imageBase64,
      crop: body.crop,
      prompt: body.prompt ?? 'pixel art portrait, crisp 16-bit game sprite, clean color palette, sharp edges',
      strength: body.strength ?? 0.58,
      model: body.model ?? 'pixel-art-lora',
    }),
  })

  if (!aiResponse.ok) {
    return jsonResponse({ error: 'AI_BACKEND_FAILED', status: aiResponse.status }, 502)
  }

  const payload = await aiResponse.json<AiResponse>()
  const result = pickImage(payload)
  if (!result) return jsonResponse({ error: 'AI_BACKEND_EMPTY_IMAGE' }, 502)

  if (result.startsWith('http://') || result.startsWith('https://')) {
    return jsonResponse({ url: result, storage: 'external' })
  }

  const cleanBase64 = stripDataUrlPrefix(result)
  const bytes = Uint8Array.from(atob(cleanBase64), (char) => char.charCodeAt(0))
  const resultKey = body.key.replace(/^uploads\//, 'results/').replace(/\.[^.]+$/, '-ai.png')
  await env.PIXEL_FORGE_UPLOADS.put(resultKey, bytes, {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { sourceKey: body.key, generatedAt: new Date().toISOString() },
  })

  return jsonResponse({
    key: resultKey,
    url: `/api/image?key=${encodeURIComponent(resultKey)}`,
    storage: 'r2',
  })
}

function pickImage(payload: AiResponse): string | undefined {
  if (payload.image) return payload.image
  if (payload.url) return payload.url
  if (typeof payload.output === 'string') return payload.output
  if (Array.isArray(payload.output)) return payload.output[0]
  const firstImage = payload.images?.[0]
  if (typeof firstImage === 'string') return firstImage
  if (firstImage?.url) return firstImage.url
  if (firstImage?.b64_json) return firstImage.b64_json
  if (firstImage?.image) return firstImage.image
  const firstData = payload.data?.[0]
  return firstData?.url ?? firstData?.b64_json
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

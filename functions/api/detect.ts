import { buildCropFromFaceBox, jsonResponse, readJson, smartPortraitCrop, type FaceBox } from '../../src/shared/server'

type DetectBody = {
  key?: string
  width?: number
  height?: number
  faceBox?: FaceBox | null
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await readJson<DetectBody>(request)
  const width = Math.round(Number(body.width))
  const height = Math.round(Number(body.height))

  if (!body.key) return jsonResponse({ error: 'KEY_REQUIRED' }, 400)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return jsonResponse({ error: 'IMAGE_DIMENSIONS_REQUIRED' }, 400)
  }

  const crop = body.faceBox
    ? buildCropFromFaceBox(body.faceBox, width, height)
    : smartPortraitCrop(width, height)

  return jsonResponse({
    key: body.key,
    crop,
    detected: Boolean(body.faceBox),
    source: body.faceBox ? 'browser-face-detector' : 'smart-portrait-fallback',
  })
}

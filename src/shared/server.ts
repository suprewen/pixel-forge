export type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

export type FaceBox = CropRect

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function isAllowedImageType(contentType: string | null | undefined) {
  if (!contentType) return false
  return ALLOWED_IMAGE_TYPES.has(contentType.split(';')[0].trim().toLowerCase())
}

export function makeUploadKey(fileName: string, id: string = crypto.randomUUID()) {
  const day = new Date().toISOString().slice(0, 10)
  const safeName = fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'image'
  const ext = fileName.toLowerCase().match(/\.(png|jpe?g|webp)$/)?.[1]?.replace('jpeg', 'jpg') ?? 'png'
  return `uploads/${day}/${id}-${safeName}.${ext}`
}

export function clampCrop(crop: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const x = Math.max(0, Math.min(Math.round(crop.x), imageWidth - 1))
  const y = Math.max(0, Math.min(Math.round(crop.y), imageHeight - 1))
  const width = Math.max(1, Math.min(Math.round(crop.width), imageWidth - x))
  const height = Math.max(1, Math.min(Math.round(crop.height), imageHeight - y))
  return { x, y, width, height }
}

export function smartPortraitCrop(imageWidth: number, imageHeight: number): CropRect {
  const side = Math.min(imageWidth, imageHeight)
  const x = Math.round((imageWidth - side) / 2)
  const y = imageHeight > imageWidth ? Math.round((imageHeight - side) * 0.35) : 0
  return clampCrop({ x, y, width: side, height: side }, imageWidth, imageHeight)
}

export function buildCropFromFaceBox(face: FaceBox, imageWidth: number, imageHeight: number): CropRect {
  const centerX = face.x + face.width / 2
  const centerY = face.y + face.height * 0.48
  const side = Math.max(face.width, face.height) * 2.15
  return squareAround(centerX, centerY, side, imageWidth, imageHeight)
}

export function squareAround(centerX: number, centerY: number, side: number, imageWidth: number, imageHeight: number): CropRect {
  const maxSide = Math.min(imageWidth, imageHeight)
  const finalSide = Math.max(1, Math.min(Math.round(side), maxSide))
  const x = Math.round(Math.max(0, Math.min(centerX - finalSide / 2, imageWidth - finalSide)))
  const y = Math.round(Math.max(0, Math.min(centerY - finalSide / 2, imageHeight - finalSide)))
  return { x, y, width: finalSide, height: finalSide }
}

export function stripDataUrlPrefix(value: string) {
  return value.replace(/^data:[^,]+,/, '')
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T
  } catch {
    throw new Error('INVALID_JSON')
  }
}

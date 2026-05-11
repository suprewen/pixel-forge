import { describe, expect, it } from 'vitest'
import {
  buildCropFromFaceBox,
  clampCrop,
  isAllowedImageType,
  makeUploadKey,
  smartPortraitCrop,
  stripDataUrlPrefix,
} from './server'

describe('server image helpers', () => {
  it('accepts only common web image mime types', () => {
    expect(isAllowedImageType('image/png')).toBe(true)
    expect(isAllowedImageType('image/jpeg')).toBe(true)
    expect(isAllowedImageType('image/webp')).toBe(true)
    expect(isAllowedImageType('image/gif')).toBe(false)
    expect(isAllowedImageType('text/plain')).toBe(false)
  })

  it('creates path-safe temporary upload keys', () => {
    const key = makeUploadKey('A Cute Cat.png', 'abc123')
    expect(key).toMatch(/^uploads\/\d{4}-\d{2}-\d{2}\/abc123-a-cute-cat\.png$/)
  })

  it('clamps crop rectangles into image bounds', () => {
    expect(clampCrop({ x: -10, y: 20, width: 500, height: 500 }, 320, 240)).toEqual({
      x: 0,
      y: 20,
      width: 320,
      height: 220,
    })
  })

  it('builds a square portrait crop around a detected face', () => {
    const crop = buildCropFromFaceBox({ x: 260, y: 120, width: 180, height: 180 }, 800, 600)
    expect(crop.width).toBe(crop.height)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(800)
    expect(crop.y + crop.height).toBeLessThanOrEqual(600)
    expect(crop.x).toBeLessThan(260)
    expect(crop.y).toBeLessThan(120)
  })

  it('falls back to upper-centered portrait crop without a face box', () => {
    expect(smartPortraitCrop(1600, 900)).toEqual({ x: 350, y: 0, width: 900, height: 900 })
    expect(smartPortraitCrop(900, 1600)).toEqual({ x: 0, y: 245, width: 900, height: 900 })
  })

  it('strips data URL prefixes before storage', () => {
    expect(stripDataUrlPrefix('data:image/png;base64,abcd')).toBe('abcd')
    expect(stripDataUrlPrefix('abcd')).toBe('abcd')
  })
})

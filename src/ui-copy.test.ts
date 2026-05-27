import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const mainSource = readFileSync(join(root, 'src/main.ts'), 'utf8')
const cssSource = readFileSync(join(root, 'src/style.css'), 'utf8')

describe('Pixel Forge interface direction', () => {
  it('uses a calmer portrait-studio product copy', () => {
    expect(mainSource).toContain('把照片做成像素头像')
    expect(mainSource).toContain('上传照片')
    expect(mainSource).toContain('使用示例')
    expect(mainSource).toContain('头像工作室')
    expect(mainSource).toContain('先裁脸，再调像素风格。')
  })

  it('keeps visible copy free of common AI design tells and public competitor mentions', () => {
    expect(mainSource).not.toMatch(/[—–]/)
    expect(mainSource).not.toMatch(/PixelMe/i)
    expect(mainSource).not.toMatch(/BETA|ALPHA|v\d/i)
    expect(mainSource).not.toMatch(/Quietly|Acme|John Doe|Sarah Chan/i)
    expect(mainSource).not.toMatch(/Elevate|Seamless|Unleash|Next-Gen|Revolutionize/i)
  })

  it('locks the refined studio visual system', () => {
    expect(cssSource).toContain('--accent: #2f6bff')
    expect(cssSource).toContain('--surface: #f6f7f2')
    expect(cssSource).toContain('font-family: "Avenir Next"')
    expect(cssSource).toContain('.portrait-stage')
    expect(cssSource).toContain('border-radius: 28px')
    expect(cssSource).not.toContain('--hot: #ff3d7f')
    expect(cssSource).not.toContain('font-family: "Arial Narrow"')
    expect(cssSource).not.toContain('.console-grid')
    expect(cssSource).not.toContain('clip-path: polygon')
  })
})

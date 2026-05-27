import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const mainSource = readFileSync(join(root, 'src/main.ts'), 'utf8')
const cssSource = readFileSync(join(root, 'src/style.css'), 'utf8')

describe('Pixel Forge interface direction', () => {
  it('uses the bolder portrait-console copy', () => {
    expect(mainSource).toContain('把正脸照片压进 8-bit 身份牌')
    expect(mainSource).toContain('开始锻造')
    expect(mainSource).toContain('试试样张')
    expect(mainSource).toContain('像素工作台')
    expect(mainSource).toContain('调颗粒、调颜色，然后下载方形 PNG。')
  })

  it('keeps visible copy free of common AI design tells and public competitor mentions', () => {
    expect(mainSource).not.toMatch(/[—–]/)
    expect(mainSource).not.toMatch(/PixelMe/i)
    expect(mainSource).not.toMatch(/BETA|ALPHA|v\d/i)
    expect(mainSource).not.toMatch(/Quietly|Acme|John Doe|Sarah Chan/i)
    expect(mainSource).not.toMatch(/Elevate|Seamless|Unleash|Next-Gen|Revolutionize/i)
  })

  it('locks the new arcade-console visual system', () => {
    expect(cssSource).toContain('--accent: #b7ff2a')
    expect(cssSource).toContain('--hot: #ff3d7f')
    expect(cssSource).toContain('font-family: "Arial Narrow"')
    expect(cssSource).toContain('.console-grid')
    expect(cssSource).toContain('clip-path: polygon')
    expect(cssSource).not.toContain('--accent: #3f7cff')
    expect(cssSource).not.toContain('font-family: Avenir Next')
    expect(cssSource).not.toContain('#fbf7ef')
    expect(cssSource).not.toContain('#ff6a3d')
  })
})

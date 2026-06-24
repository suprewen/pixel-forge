import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const mainSource = readFileSync(join(root, 'src/main.ts'), 'utf8')
const cssSource = readFileSync(join(root, 'src/style.css'), 'utf8')
const packageSource = readFileSync(join(root, 'package.json'), 'utf8')
const designSource = readFileSync(join(root, 'DESIGN.md'), 'utf8')

describe('Pixel Forge product design workflow redesign direction', () => {
  it('uses concise pixel avatar product copy', () => {
    expect(mainSource).toContain('把真人照片变成清晰像素头像')
    expect(mainSource).toContain('Pixel Forge 不是简单打马赛克')
    expect(mainSource).toContain('上传照片')
    const removedSampleCta = ['试试', '示例'].join('')
    const removedDemoAsset = ['demo', '-portrait'].join('')
    expect(mainSource).not.toContain(removedSampleCta)
    expect(mainSource).not.toContain(removedDemoAsset)
    expect(cssSource).not.toContain(removedDemoAsset)
    expect(mainSource).toContain('选择头像手感')
    expect(mainSource).toContain('做一张能马上使用的像素头像')
  })

  it('keeps visible copy free of common AI design tells and public competitor mentions', () => {
    expect(mainSource).not.toMatch(/[—–]/)
    expect(mainSource).not.toMatch(/PixelMe/i)
    expect(mainSource).not.toMatch(/BETA|ALPHA|v\d/i)
    expect(mainSource).not.toMatch(/Quietly|Acme|John Doe|Sarah Chan/i)
    expect(mainSource).not.toMatch(/Elevate|Seamless|Unleash|Next-Gen|Revolutionize/i)
  })

  it('locks the product design workflow visual and motion system', () => {
    expect(packageSource).toContain('"gsap"')
    expect(mainSource).toContain("import { gsap } from 'gsap'")
    expect(mainSource).toContain("import { ScrollTrigger } from 'gsap/ScrollTrigger'")
    expect(cssSource).toContain('--accent: #ff9f1c')
    expect(cssSource).toContain('--surface: #f6f4ef')
    expect(cssSource).toContain('font-family: "Avenir Next"')
    expect(cssSource).toContain('.brand-mark')
    expect(cssSource).toContain('.sample-strip')
    expect(cssSource).toContain('.placeholder-face')
    expect(cssSource).toContain('image-rendering: pixelated')
    expect(cssSource).not.toContain('--hot: #ff3d7f')
    expect(cssSource).not.toContain('font-family: "Arial Narrow"')
    expect(cssSource).not.toContain('.console-grid')
    expect(cssSource).not.toContain('clip-path: polygon')
  })

  it('documents a project-level design system', () => {
    expect(designSource).toContain('Pixel Forge Design System')
    expect(designSource).toContain('Face first')
    expect(designSource).toContain('#ff9f1c')
    expect(designSource).not.toMatch(/PixelMe/i)
  })
})

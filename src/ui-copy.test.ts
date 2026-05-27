import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const mainSource = readFileSync(join(root, 'src/main.ts'), 'utf8')
const cssSource = readFileSync(join(root, 'src/style.css'), 'utf8')

describe('Pixel Forge interface direction', () => {
  it('uses the avatar-forge design copy', () => {
    expect(mainSource).toContain('把人物照锻成像素头像')
    expect(mainSource).toContain('上传人物照')
    expect(mainSource).toContain('载入示例')
    expect(mainSource).toContain('四种风格，一张头像')
    expect(mainSource).toContain('生成后选择清晰、标准或粗粒版本，再下载 PNG。')
  })

  it('keeps visible copy free of common AI design tells', () => {
    expect(mainSource).not.toMatch(/[—–]/)
    expect(mainSource).not.toMatch(/PixelMe/i)
    expect(mainSource).not.toMatch(/BETA|ALPHA|v\d/i)
    expect(mainSource).not.toMatch(/Quietly|Acme|John Doe|Sarah Chan/i)
  })

  it('uses a locked visual system instead of the old warm craft default', () => {
    expect(cssSource).toContain('--accent: #3f7cff')
    expect(cssSource).toContain('font-family: Avenir Next')
    expect(cssSource).not.toContain('font-family: Inter')
    expect(cssSource).not.toContain('#fbf7ef')
    expect(cssSource).not.toContain('#ff6a3d')
  })
})

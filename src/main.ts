import './style.css'

type PaletteName = 'adaptive' | 'pico8' | 'gameboy' | 'nesish'

type Settings = {
  block: number
  colors: number
  contrast: number
  saturation: number
  brightness: number
  dither: boolean
  mode: 'portrait' | 'landscape'
  palette: PaletteName
}

type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

type BackendUpload = {
  key: string
  url: string
}

const PALETTES: Record<Exclude<PaletteName, 'adaptive'>, number[][]> = {
  pico8: [
    [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
    [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
    [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170],
  ],
  gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  nesish: [
    [124, 124, 124], [0, 0, 252], [0, 0, 188], [68, 40, 188], [148, 0, 132],
    [168, 0, 32], [168, 16, 0], [136, 20, 0], [80, 48, 0], [0, 120, 0],
    [0, 104, 0], [0, 88, 0], [0, 64, 88], [0, 0, 0], [188, 188, 188],
    [0, 120, 248], [0, 88, 248], [104, 68, 252], [216, 0, 204], [228, 0, 88],
    [248, 56, 0], [228, 92, 16], [172, 124, 0], [0, 184, 0], [0, 168, 0],
    [0, 168, 68], [0, 136, 136], [248, 248, 248], [60, 188, 252], [104, 136, 252],
    [152, 120, 248], [248, 120, 248], [248, 88, 152], [248, 120, 88], [252, 160, 68],
    [248, 184, 0], [184, 248, 24], [88, 216, 84], [88, 248, 152], [0, 232, 216],
  ],
}

const state: {
  source?: HTMLImageElement
  sourceName: string
  objectUrl?: string
  originalFile?: File
  upload?: BackendUpload
  crop?: CropRect
  settings: Settings
  variants: HTMLCanvasElement[]
  selected: number
} = {
  sourceName: '',
  selected: 1,
  variants: [],
  settings: {
    block: 8,
    colors: 18,
    contrast: 14,
    saturation: 14,
    brightness: 0,
    dither: true,
    mode: 'portrait',
    palette: 'adaptive',
  },
}

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="shell">
    <section class="hero-panel">
      <div class="eyebrow">Client-side pixel art converter</div>
      <h1>Pixel Forge</h1>
      <p class="lead">一个参考 PixelMe 交互思路的像素风工具：默认浏览器本地处理，也可启用 Workers + R2 + AI 后端。</p>
      <div class="hero-actions">
        <label class="primary-button" for="fileInput">选择图片</label>
        <button class="ghost-button" id="demoButton" type="button">生成示例</button>
      </div>
      <p class="note">实现路径：resize → 色彩增强 → 降色/调色板 → Floyd-Steinberg 抖动 → nearest-neighbor 放大。</p>
    </section>

    <section class="workspace">
      <aside class="controls card">
        <h2>控制台</h2>
        <input id="fileInput" type="file" accept="image/*" />
        <div id="dropZone" class="drop-zone">
          <strong>拖入图片</strong>
          <span>或点击上方按钮选择。最大边会压到 1024px 内。</span>
        </div>

        <label class="field">
          <span>模式</span>
          <select id="mode">
            <option value="portrait">头像 / 人像</option>
            <option value="landscape">风景 / 宠物 / 物体</option>
          </select>
        </label>

        <label class="field">
          <span>调色板</span>
          <select id="palette">
            <option value="adaptive">自适应</option>
            <option value="pico8">PICO-8</option>
            <option value="gameboy">Game Boy</option>
            <option value="nesish">NES-ish</option>
          </select>
        </label>

        <label class="field range"><span>像素块 <b id="blockValue">8</b></span><input id="block" type="range" min="3" max="18" value="8" /></label>
        <label class="field range"><span>颜色数 <b id="colorsValue">18</b></span><input id="colors" type="range" min="4" max="48" value="18" /></label>
        <label class="field range"><span>对比度 <b id="contrastValue">14</b></span><input id="contrast" type="range" min="-40" max="60" value="14" /></label>
        <label class="field range"><span>饱和度 <b id="saturationValue">14</b></span><input id="saturation" type="range" min="-80" max="80" value="14" /></label>
        <label class="field range"><span>亮度 <b id="brightnessValue">0</b></span><input id="brightness" type="range" min="-40" max="40" value="0" /></label>

        <label class="check"><input id="dither" type="checkbox" checked /> 启用抖动，让过渡更像老游戏机</label>
        <button id="downloadButton" class="primary-button full" type="button" disabled>下载 PNG</button>

        <div class="backend-panel">
          <h3>后端增强</h3>
          <p id="backendStatus">可选：临时上传到 Cloudflare R2，再做人脸裁剪或 AI 像素风转换。</p>
          <button id="uploadButton" class="ghost-button full" type="button" disabled>上传到 R2 临时区</button>
          <button id="detectButton" class="ghost-button full" type="button" disabled>人脸检测 / 自动裁剪</button>
          <button id="aiButton" class="primary-button full" type="button" disabled>SD / LoRA 像素风转换</button>
        </div>
      </aside>

      <section class="stage card">
        <div class="stage-head">
          <div>
            <h2>预览</h2>
            <p id="status">还没有图片。</p>
          </div>
          <div class="variant-tabs" id="variantTabs"></div>
        </div>
        <div class="preview-grid">
          <div class="preview-box"><canvas id="sourceCanvas" width="512" height="512"></canvas><span>原图预处理</span></div>
          <div class="preview-box result"><canvas id="resultCanvas" width="512" height="512"></canvas><span>像素风结果</span></div>
        </div>
      </section>
    </section>

    <section class="explain card">
      <h2>复刻说明</h2>
      <div class="steps">
        <p><strong>PixelMe 网页版：</strong>前端压缩图片，后端做人脸检测和转换。</p>
        <p><strong>当前版本：</strong>保留本地 Canvas 转换，同时加入 Cloudflare Workers API、R2 临时存储和 AI 转换适配层。</p>
        <p><strong>AI 转换：</strong>前端会调用 Workers，再由 Workers 转发到已配置的 SD / LoRA 图像后端；未配置时会明确提示。</p>
      </div>
    </section>
  </main>
`

const els = {
  fileInput: document.querySelector<HTMLInputElement>('#fileInput')!,
  dropZone: document.querySelector<HTMLDivElement>('#dropZone')!,
  demoButton: document.querySelector<HTMLButtonElement>('#demoButton')!,
  downloadButton: document.querySelector<HTMLButtonElement>('#downloadButton')!,
  uploadButton: document.querySelector<HTMLButtonElement>('#uploadButton')!,
  detectButton: document.querySelector<HTMLButtonElement>('#detectButton')!,
  aiButton: document.querySelector<HTMLButtonElement>('#aiButton')!,
  status: document.querySelector<HTMLParagraphElement>('#status')!,
  backendStatus: document.querySelector<HTMLParagraphElement>('#backendStatus')!,
  sourceCanvas: document.querySelector<HTMLCanvasElement>('#sourceCanvas')!,
  resultCanvas: document.querySelector<HTMLCanvasElement>('#resultCanvas')!,
  tabs: document.querySelector<HTMLDivElement>('#variantTabs')!,
  mode: document.querySelector<HTMLSelectElement>('#mode')!,
  palette: document.querySelector<HTMLSelectElement>('#palette')!,
  block: document.querySelector<HTMLInputElement>('#block')!,
  colors: document.querySelector<HTMLInputElement>('#colors')!,
  contrast: document.querySelector<HTMLInputElement>('#contrast')!,
  saturation: document.querySelector<HTMLInputElement>('#saturation')!,
  brightness: document.querySelector<HTMLInputElement>('#brightness')!,
  dither: document.querySelector<HTMLInputElement>('#dither')!,
}

const valueLabels = ['block', 'colors', 'contrast', 'saturation', 'brightness'] as const

function bindControls() {
  valueLabels.forEach((key) => {
    const input = els[key]
    const label = document.querySelector<HTMLElement>(`#${key}Value`)!
    input.addEventListener('input', () => {
      label.textContent = input.value
      ;(state.settings[key] as number) = Number(input.value)
      renderAll()
    })
  })

  els.mode.addEventListener('change', () => {
    state.settings.mode = els.mode.value as Settings['mode']
    if (state.settings.mode === 'portrait') {
      state.settings.block = 7
      state.settings.colors = 18
    } else {
      state.settings.block = 9
      state.settings.colors = 24
    }
    syncControls()
updateBackendControls()
    renderAll()
  })
  els.palette.addEventListener('change', () => {
    state.settings.palette = els.palette.value as PaletteName
    renderAll()
  })
  els.dither.addEventListener('change', () => {
    state.settings.dither = els.dither.checked
    renderAll()
  })
  els.fileInput.addEventListener('change', () => {
    const file = els.fileInput.files?.[0]
    if (file) loadFile(file)
  })
  els.demoButton.addEventListener('click', loadDemo)
  els.downloadButton.addEventListener('click', downloadCurrent)
  els.uploadButton.addEventListener('click', uploadForBackend)
  els.detectButton.addEventListener('click', runAutoCrop)
  els.aiButton.addEventListener('click', runAiConvert)
  ;['dragenter', 'dragover'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      els.dropZone.classList.add('dragging')
    })
  })
  ;['dragleave', 'drop'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      els.dropZone.classList.remove('dragging')
    })
  })
  els.dropZone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0]
    if (file) loadFile(file)
  })
}

function syncControls() {
  valueLabels.forEach((key) => {
    els[key].value = String(state.settings[key])
    document.querySelector<HTMLElement>(`#${key}Value`)!.textContent = String(state.settings[key])
  })
  els.mode.value = state.settings.mode
  els.palette.value = state.settings.palette
  els.dither.checked = state.settings.dither
}

async function loadFile(file: File) {
  if (!file.type.startsWith('image/')) return
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl)
  state.objectUrl = URL.createObjectURL(file)
  state.originalFile = file
  state.upload = undefined
  state.crop = undefined
  state.sourceName = file.name.replace(/\.[^.]+$/, '')
  const img = await loadImage(state.objectUrl)
  state.source = img
  els.status.textContent = `已载入 ${file.name}，正在转换…`
  updateBackendControls()
  renderAll()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function loadDemo() {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 640, 640)
  gradient.addColorStop(0, '#f9d1c8')
  gradient.addColorStop(1, '#3860d1')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 640, 640)
  ctx.fillStyle = '#ffe6bf'
  ctx.beginPath()
  ctx.arc(320, 280, 150, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2d1a18'
  ctx.fillRect(185, 150, 270, 95)
  ctx.fillRect(165, 230, 70, 155)
  ctx.fillRect(405, 230, 70, 155)
  ctx.fillStyle = '#141414'
  ctx.fillRect(255, 280, 32, 32)
  ctx.fillRect(360, 280, 32, 32)
  ctx.fillStyle = '#d75a6a'
  ctx.fillRect(290, 370, 70, 18)
  ctx.fillStyle = '#54c6eb'
  ctx.fillRect(180, 455, 280, 150)
  ctx.fillStyle = '#fff4b2'
  ctx.fillRect(110, 500, 420, 55)
  const img = new Image()
  img.onload = () => {
    state.source = img
    state.originalFile = undefined
    state.upload = undefined
    state.crop = undefined
    state.sourceName = 'pixel-forge-demo'
    els.status.textContent = '已载入示例图。'
    updateBackendControls()
    renderAll()
  }
  img.src = canvas.toDataURL('image/png')
}

function renderAll() {
  if (!state.source) return
  els.status.textContent = '转换中…'
  requestAnimationFrame(() => {
    const normalized = normalizeSource(state.source!, state.settings.mode, state.crop)
    drawCanvas(els.sourceCanvas, normalized, true)
    const variants = [state.settings.block - 2, state.settings.block, state.settings.block + 4]
      .map((block) => pixelate(normalized, { ...state.settings, block: Math.max(3, block) }))
    state.variants = variants
    state.selected = Math.min(state.selected, variants.length - 1)
    renderTabs()
    drawCanvas(els.resultCanvas, state.variants[state.selected], true)
    els.downloadButton.disabled = false
    els.status.textContent = '转换完成。可调参数或下载 PNG。'
  })
}

function normalizeSource(img: HTMLImageElement, mode: Settings['mode'], crop?: CropRect): HTMLCanvasElement {
  const max = 1024
  const sourceRatio = img.width / img.height
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height

  if (crop) {
    sx = crop.x
    sy = crop.y
    sw = crop.width
    sh = crop.height
  } else if (mode === 'portrait') {
    const targetRatio = 1
    if (sourceRatio > targetRatio) {
      sw = img.height * targetRatio
      sx = (img.width - sw) / 2
    } else {
      sh = img.width / targetRatio
      sy = Math.max(0, (img.height - sh) * 0.35)
    }
  }

  const scale = Math.min(1, max / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas
}

function pixelate(input: HTMLCanvasElement, settings: Settings): HTMLCanvasElement {
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(input.width / settings.block))
  small.height = Math.max(1, Math.round(input.height / settings.block))
  const sctx = small.getContext('2d', { willReadFrequently: true })!
  sctx.imageSmoothingEnabled = true
  sctx.imageSmoothingQuality = 'low'
  sctx.drawImage(input, 0, 0, small.width, small.height)

  const imageData = sctx.getImageData(0, 0, small.width, small.height)
  enhance(imageData, settings)
  const palette = settings.palette === 'adaptive'
    ? buildAdaptivePalette(imageData, settings.colors)
    : PALETTES[settings.palette]
  quantize(imageData, palette, settings.dither)
  sctx.putImageData(imageData, 0, 0)

  const out = document.createElement('canvas')
  out.width = input.width
  out.height = input.height
  const octx = out.getContext('2d')!
  octx.imageSmoothingEnabled = false
  octx.drawImage(small, 0, 0, out.width, out.height)
  return out
}

function enhance(imageData: ImageData, settings: Settings) {
  const data = imageData.data
  const contrast = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
  const sat = 1 + settings.saturation / 100
  const bright = settings.brightness
  for (let i = 0; i < data.length; i += 4) {
    let r = contrast * (data[i] - 128) + 128 + bright
    let g = contrast * (data[i + 1] - 128) + 128 + bright
    let b = contrast * (data[i + 2] - 128) + 128 + bright
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = clamp(gray + (r - gray) * sat)
    data[i + 1] = clamp(gray + (g - gray) * sat)
    data[i + 2] = clamp(gray + (b - gray) * sat)
  }
}

function buildAdaptivePalette(imageData: ImageData, colorCount: number): number[][] {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>()
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`
    const item = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 }
    item.r += data[i]
    item.g += data[i + 1]
    item.b += data[i + 2]
    item.count += 1
    buckets.set(key, item)
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount)
    .map((item) => [item.r / item.count, item.g / item.count, item.b / item.count])
}

function quantize(imageData: ImageData, palette: number[][], dither: boolean) {
  const { data, width, height } = imageData
  const work = new Float32Array(data.length)
  for (let i = 0; i < data.length; i++) work[i] = data[i]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const old = [work[idx], work[idx + 1], work[idx + 2]]
      const next = nearestColor(old, palette)
      data[idx] = next[0]
      data[idx + 1] = next[1]
      data[idx + 2] = next[2]
      if (!dither) continue
      const err = [old[0] - next[0], old[1] - next[1], old[2] - next[2]]
      distribute(work, width, height, x + 1, y, err, 7 / 16)
      distribute(work, width, height, x - 1, y + 1, err, 3 / 16)
      distribute(work, width, height, x, y + 1, err, 5 / 16)
      distribute(work, width, height, x + 1, y + 1, err, 1 / 16)
    }
  }
}

function distribute(work: Float32Array, width: number, height: number, x: number, y: number, err: number[], factor: number) {
  if (x < 0 || x >= width || y < 0 || y >= height) return
  const idx = (y * width + x) * 4
  work[idx] = clamp(work[idx] + err[0] * factor)
  work[idx + 1] = clamp(work[idx + 1] + err[1] * factor)
  work[idx + 2] = clamp(work[idx + 2] + err[2] * factor)
}

function nearestColor(rgb: number[], palette: number[][]): number[] {
  let best = palette[0]
  let bestDistance = Infinity
  for (const color of palette) {
    const dr = rgb[0] - color[0]
    const dg = rgb[1] - color[1]
    const db = rgb[2] - color[2]
    const distance = dr * dr + dg * dg + db * db
    if (distance < bestDistance) {
      bestDistance = distance
      best = color
    }
  }
  return best.map(clamp)
}

function drawCanvas(target: HTMLCanvasElement, source: HTMLCanvasElement, contain = false) {
  const ctx = target.getContext('2d')!
  ctx.clearRect(0, 0, target.width, target.height)
  ctx.fillStyle = '#f8f0dd'
  ctx.fillRect(0, 0, target.width, target.height)
  ctx.imageSmoothingEnabled = false
  if (!contain) {
    ctx.drawImage(source, 0, 0, target.width, target.height)
    return
  }
  const scale = Math.min(target.width / source.width, target.height / source.height)
  const w = Math.round(source.width * scale)
  const h = Math.round(source.height * scale)
  const x = Math.round((target.width - w) / 2)
  const y = Math.round((target.height - h) / 2)
  ctx.drawImage(source, x, y, w, h)
}

function renderTabs() {
  els.tabs.innerHTML = ''
  state.variants.forEach((_, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = ['细', '中', '粗'][index]
    button.className = index === state.selected ? 'active' : ''
    button.addEventListener('click', () => {
      state.selected = index
      renderTabs()
      drawCanvas(els.resultCanvas, state.variants[state.selected], true)
    })
    els.tabs.append(button)
  })
}


function updateBackendControls() {
  els.uploadButton.disabled = !state.originalFile
  els.detectButton.disabled = !state.upload
  els.aiButton.disabled = !state.upload
}

async function uploadForBackend() {
  if (!state.originalFile) return
  els.backendStatus.textContent = '正在上传到 R2 临时区…'
  const form = new FormData()
  form.append('image', state.originalFile)
  const response = await fetch('/api/upload', { method: 'POST', body: form })
  const payload = await response.json() as BackendUpload & { message?: string }
  if (!response.ok) {
    els.backendStatus.textContent = payload.message ?? '上传失败。'
    return
  }
  state.upload = payload
  els.backendStatus.textContent = '已临时上传。可继续做人脸裁剪或 AI 转换。'
  updateBackendControls()
}

async function runAutoCrop() {
  if (!state.upload || !state.source) return
  els.backendStatus.textContent = '正在检测人脸 / 计算裁剪区域…'
  const faceBox = await detectFaceInBrowser()
  const response = await fetch('/api/detect', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      key: state.upload.key,
      width: state.source.naturalWidth || state.source.width,
      height: state.source.naturalHeight || state.source.height,
      faceBox,
    }),
  })
  const payload = await response.json() as { crop?: CropRect; detected?: boolean; source?: string }
  if (!response.ok || !payload.crop) {
    els.backendStatus.textContent = '裁剪失败。'
    return
  }
  state.crop = payload.crop
  els.backendStatus.textContent = payload.detected ? '检测到人脸，已自动裁剪。' : '未检测到人脸，已使用居中智能裁剪。'
  renderAll()
}

async function runAiConvert() {
  if (!state.upload) return
  els.backendStatus.textContent = '正在请求 SD / LoRA 像素风转换…'
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: state.upload.key, crop: state.crop }),
  })
  const payload = await response.json() as { url?: string; message?: string }
  if (!response.ok || !payload.url) {
    els.backendStatus.textContent = payload.message ?? 'AI 后端尚未配置或转换失败。'
    return
  }
  const img = await loadImage(payload.url)
  state.source = img
  state.crop = undefined
  state.sourceName = `${state.sourceName || 'pixel-forge'}-ai`
  els.backendStatus.textContent = 'AI 像素风结果已载入，可继续微调或下载。'
  renderAll()
}

async function detectFaceInBrowser(): Promise<CropRect | null> {
  if (!state.originalFile) return null
  const detectorCtor = (window as unknown as {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect(input: ImageBitmapSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>>
    }
  }).FaceDetector
  if (!detectorCtor) return null
  const bitmap = await createImageBitmap(state.originalFile)
  try {
    const faces = await new detectorCtor({ fastMode: true, maxDetectedFaces: 1 }).detect(bitmap)
    const box = faces[0]?.boundingBox
    return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null
  } finally {
    bitmap.close()
  }
}

function downloadCurrent() {
  const source = state.variants[state.selected]
  if (!source) return
  const link = document.createElement('a')
  link.download = `${state.sourceName || 'pixel-forge'}-${state.settings.block}px.png`
  link.href = source.toDataURL('image/png')
  link.click()
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

bindControls()
syncControls()
updateBackendControls()

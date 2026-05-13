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
    <input id="fileInput" type="file" accept="image/*" />

    <section class="hero">
      <div class="brand">Pixel Forge</div>
      <h1>一键生成像素风头像</h1>
      <p>上传一张人物照，自动裁剪头像，并生成多种像素风版本。</p>
      <div class="hero-actions">
        <label class="primary-button" for="fileInput">上传照片</label>
        <button class="ghost-button" id="demoButton" type="button">试试示例</button>
      </div>
    </section>

    <section class="generator card">
      <div id="emptyState" class="upload-panel">
        <label class="drop-zone" id="dropZone" for="fileInput">
          <span class="avatar-mark" aria-hidden="true"></span>
          <strong>拖入人物照</strong>
          <small>或点击上传</small>
        </label>
        <button class="ghost-button compact" id="emptyDemoButton" type="button">用示例</button>
      </div>

      <section class="result-view" aria-live="polite">
        <div class="canvas-frame">
          <canvas id="resultCanvas" width="512" height="512"></canvas>
        </div>
        <div class="result-meta">
          <p id="status">选择一张人物照开始生成。</p>
          <div class="stage-dots" aria-label="生成状态">
            <span>自动裁剪</span>
            <span>选择版本</span>
            <span>下载 PNG</span>
          </div>
        </div>
      </section>

      <section class="quick-controls">
        <div class="control-row">
          <span class="control-label">风格</span>
          <div class="pill-group preset-grid" aria-label="风格">
            <button type="button" class="preset-button active" data-preset="clean">经典</button>
            <button type="button" class="preset-button" data-preset="soft">柔和</button>
            <button type="button" class="preset-button" data-preset="retro">复古</button>
            <button type="button" class="preset-button" data-preset="chunky">粗颗粒</button>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">版本</span>
          <div class="variant-tabs" id="variantTabs" aria-label="颗粒大小"></div>
        </div>

        <button id="downloadButton" class="primary-button download" type="button" disabled>下载 PNG</button>
      </section>
    </section>

    <section class="details-bar">
      <details class="advanced-panel">
        <summary>微调</summary>
        <div class="advanced-grid">
          <label class="field palette-field">
            <span>颜色</span>
            <select id="palette">
              <option value="adaptive">自动</option>
              <option value="pico8">PICO-8</option>
              <option value="gameboy">Game Boy</option>
              <option value="nesish">NES</option>
            </select>
          </label>
          <select id="mode" class="visually-hidden" aria-hidden="true" tabindex="-1">
            <option value="portrait">头像</option>
            <option value="landscape">原图</option>
          </select>
          <label class="field range"><span>颗粒 <b id="blockValue">8</b></span><input id="block" type="range" min="3" max="18" value="8" /></label>
          <label class="field range"><span>颜色数 <b id="colorsValue">18</b></span><input id="colors" type="range" min="4" max="48" value="18" /></label>
          <label class="field range"><span>对比 <b id="contrastValue">14</b></span><input id="contrast" type="range" min="-40" max="60" value="14" /></label>
          <label class="field range"><span>饱和 <b id="saturationValue">14</b></span><input id="saturation" type="range" min="-80" max="80" value="14" /></label>
          <label class="field range"><span>亮度 <b id="brightnessValue">0</b></span><input id="brightness" type="range" min="-40" max="40" value="0" /></label>
          <label class="check"><input id="dither" type="checkbox" checked /> 复古颗粒</label>
        </div>
      </details>

      <details class="backend-panel">
        <summary>调试信息</summary>
        <p id="backendStatus">上传和头像裁剪接口已接入。</p>
        <div class="backend-actions">
          <button id="uploadButton" class="ghost-button" type="button" disabled>上传</button>
          <button id="detectButton" class="ghost-button" type="button" disabled>裁剪</button>
          <button id="aiButton" class="ghost-button" type="button" disabled>AI 转换</button>
        </div>
        <canvas id="sourceCanvas" width="512" height="512"></canvas>
        <details class="dev-details">
          <summary>状态说明</summary>
          <p>接口状态只在这里显示，不影响主流程。</p>
        </details>
      </details>
    </section>
  </main>
`

const els = {
  fileInput: document.querySelector<HTMLInputElement>('#fileInput')!,
  dropZone: document.querySelector<HTMLDivElement>('#dropZone')!,
  demoButton: document.querySelector<HTMLButtonElement>('#demoButton')!,
  emptyDemoButton: document.querySelector<HTMLButtonElement>('#emptyDemoButton')!,
  emptyState: document.querySelector<HTMLDivElement>('#emptyState')!,
  presetButtons: [...document.querySelectorAll<HTMLButtonElement>('[data-preset]')],
  modeButtons: [...document.querySelectorAll<HTMLButtonElement>('[data-mode]')],
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
  els.emptyDemoButton.addEventListener('click', loadDemo)
  els.presetButtons.forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset ?? 'clean'))
  })
  els.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.settings.mode = button.dataset.mode as Settings['mode']
      syncControls()
      updateBackendControls()
      renderAll()
    })
  })
  els.downloadButton.addEventListener('click', downloadCurrent)
  els.uploadButton.addEventListener('click', () => uploadForBackend())
  els.detectButton.addEventListener('click', () => runAutoCrop())
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
  updateActiveControls()
}


function applyPreset(name: string) {
  const presets: Record<string, Partial<Settings>> = {
    clean: { mode: 'portrait', palette: 'adaptive', block: 7, colors: 18, contrast: 14, saturation: 12, brightness: 0, dither: true },
    soft: { mode: 'portrait', palette: 'adaptive', block: 5, colors: 28, contrast: 6, saturation: 8, brightness: 2, dither: false },
    retro: { mode: 'portrait', palette: 'pico8', block: 8, colors: 16, contrast: 18, saturation: 18, brightness: 0, dither: true },
    chunky: { mode: 'portrait', palette: 'nesish', block: 12, colors: 12, contrast: 24, saturation: 16, brightness: 0, dither: true },
  }
  Object.assign(state.settings, presets[name] ?? presets.clean)
  syncControls()
  renderAll()
}

function updateActiveControls() {
  els.modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.settings.mode)
  })
  els.presetButtons.forEach((button) => {
    const name = button.dataset.preset ?? 'clean'
    const isActive =
      (name === 'clean' && state.settings.palette === 'adaptive' && state.settings.block === 7 && state.settings.colors === 18) ||
      (name === 'soft' && state.settings.block === 5 && !state.settings.dither) ||
      (name === 'retro' && state.settings.palette === 'pico8') ||
      (name === 'chunky' && state.settings.block >= 12)
    button.classList.toggle('active', isActive)
  })
}

function updateScreenState(hasImage = Boolean(state.source)) {
  app.classList.toggle('has-image', hasImage)
  els.emptyState.hidden = hasImage
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
  els.status.textContent = '正在生成头像…'
  updateBackendControls()
  renderAll()
  void prepareUploadedAvatar()
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
  const img = new Image()
  img.onload = () => {
    state.source = img
    state.originalFile = undefined
    state.upload = undefined
    state.crop = undefined
    state.sourceName = 'demo-portrait'
    els.status.textContent = '正在生成头像…'
    updateBackendControls()
    renderAll()
  }
  img.onerror = () => {
    els.status.textContent = '示例加载失败。'
  }
  img.src = `/demo-portrait.jpg?v=${Date.now()}`
}

function renderAll() {
  updateScreenState()
  updateActiveControls()
  if (!state.source) return
  els.status.textContent = '正在生成头像…'
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
    els.status.textContent = '完成，可下载。'
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
    button.textContent = ['清晰', '标准', '粗粒'][index]
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

async function prepareUploadedAvatar() {
  if (!state.originalFile) return
  try {
    els.status.textContent = '正在裁剪头像…'
    const uploaded = await uploadForBackend(true)
    if (uploaded) await runAutoCrop(true)
  } catch {
    els.backendStatus.textContent = '自动裁剪暂时不可用。你仍然可以下载当前头像。'
    els.status.textContent = '完成，可下载。'
  }
}

async function uploadForBackend(auto = false): Promise<boolean> {
  if (!state.originalFile) return false
  if (!auto) els.backendStatus.textContent = '正在准备图片…'
  const form = new FormData()
  form.append('image', state.originalFile)
  const response = await fetch('/api/upload', { method: 'POST', body: form })
  const payload = await response.json() as BackendUpload & { message?: string }
  if (!response.ok) {
    els.backendStatus.textContent = payload.message ?? '上传失败。'
    return false
  }
  state.upload = payload
  els.backendStatus.textContent = '图片已上传。'
  updateBackendControls()
  return true
}

async function runAutoCrop(auto = false): Promise<boolean> {
  if (!state.upload || !state.source) return false
  if (auto) els.status.textContent = '正在裁剪头像…'
  els.backendStatus.textContent = '正在裁剪头像…'
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
    els.backendStatus.textContent = '暂时没裁好。你仍然可以使用当前预览。'
    return false
  }
  state.crop = payload.crop
  els.backendStatus.textContent = payload.detected ? '已根据人脸重新裁剪。' : '没有识别到明确人脸，已按画面中心裁剪。'
  renderAll()
  return true
}

async function runAiConvert() {
  if (!state.upload) return
  els.backendStatus.textContent = '正在尝试 AI 像素风转换…'
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: state.upload.key, crop: state.crop }),
  })
  const payload = await response.json() as { url?: string; message?: string }
  if (!response.ok || !payload.url) {
    els.backendStatus.textContent = 'AI 转换还没开放。当前可以先使用本地像素效果。'
    return
  }
  const img = await loadImage(payload.url)
  state.source = img
  state.crop = undefined
  state.sourceName = `${state.sourceName || 'pixel-forge'}-ai`
  els.backendStatus.textContent = 'AI 结果已载入。可以继续微调或下载。'
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
updateScreenState(false)

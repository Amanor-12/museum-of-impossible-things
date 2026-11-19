import { useEffect, useRef } from 'react'
import { fragment, vertex } from './shaders'

function compile(gl: WebGLRenderingContext, kind: number, source: string) {
  const shader = gl.createShader(kind)
  if (!shader) throw new Error('Could not allocate shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  const reason = gl.getShaderInfoLog(shader)
  gl.deleteShader(shader)
  throw new Error(reason ?? 'Could not compile shader')
}

function createScene(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, vertex)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()
  const triangle = gl.createBuffer()
  if (!program || !triangle) throw new Error('Could not allocate the scene')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Could not link the scene')
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const location = (name: string) => gl.getUniformLocation(program, name)
  return {
    gl, program, triangle,
    size: location('uSize'), opening: location('uOpening'), quality: location('uQuality'),
    chapter: location('uChapter'), joint: location('uJoint'), gravity: location('uGravity'), light: location('uLight'),
  }
}

type SceneState = { opening: number; chapter: number; motion: boolean; changing: boolean; gravity: boolean; light: number }

export default function Chamber({ opening, chapter, motion, changing, gravity, light }: SceneState) {
  const element = useRef<HTMLCanvasElement>(null)
  const update = useRef<((state: SceneState) => void) | null>(null)
  const initial = useRef({ opening, chapter, motion, changing, gravity, light })

  useEffect(() => {
    const node = element.current
    if (!node || new URLSearchParams(location.search).has('flat')) return
    const canvas = node
    let scene: ReturnType<typeof createScene>
    try { scene = createScene(canvas) } catch (error) {
      if (import.meta.env.DEV) console.warn(error)
      return
    }
    if (!scene) return

    let state = initial.current
    let currentOpening = state.opening
    let currentChapter = state.chapter
    let currentGravity = Number(state.gravity)
    let currentLight = state.light
    let frame = 0, previous = 0, refineTimer = 0
    let resize = true, disabled = false, moving = false
    let detailReady = false
    const { gl } = scene
    const rendererInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = rendererInfo ? String(gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL)) : ''
    const software = /swiftshader|llvmpipe|software rasterizer/i.test(renderer)
    let movingBudget = software ? 56000 : 144000
    const minimumBudget = software ? 44000 : 66000
    const schedule = () => {
      if (!frame && !disabled && !document.hidden) frame = requestAnimationFrame(render)
    }
    const observer = new ResizeObserver(() => { resize = true; schedule() })
    const lost = () => {
      disabled = true
      delete canvas.dataset.rendered
    }
    function render(time: number) {
      frame = 0
      if (disabled || document.hidden || !scene) return
      const interval = time - previous
      const targetGravity = state.chapter === 3 ? Number(state.gravity) : 0
      const live = state.changing || (state.motion && (currentChapter !== state.chapter ||
        currentOpening !== state.opening || currentGravity !== targetGravity || currentLight !== state.light))
      if (live && moving && interval > 30 && interval < 500 && movingBudget > minimumBudget) {
        movingBudget = Math.max(minimumBudget, Math.round(movingBudget * .78))
        resize = true
      }
      if (moving && !live && !detailReady) {
        clearTimeout(refineTimer)
        refineTimer = window.setTimeout(() => { detailReady = true; schedule() }, 120)
        return
      }
      if (live) {
        clearTimeout(refineTimer)
        detailReady = false
      }
      if (resize || live !== moving) {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        const pixelBudget = live ? movingBudget : 470000
        const ratio = Math.min(devicePixelRatio, 1, Math.sqrt(pixelBudget / (width * height)))
        canvas.width = Math.max(1, Math.round(width * ratio))
        canvas.height = Math.max(1, Math.round(height * ratio))
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.uniform2f(scene.size, canvas.width, canvas.height)
        gl.uniform1f(scene.joint, width <= 700 ? .62 : .64)
        gl.uniform1f(scene.quality, live ? 0 : 1)
        canvas.dataset.quality = live ? 'interactive' : 'still'
        resize = false
      }
      moving = live
      const dt = !moving && interval > 150 ? .017 : Math.min(.085, interval * .001)
      previous = time
      const approach = (from: number, to: number, rate: number) =>
        !state.motion || Math.abs(to - from) < .006 ? to : from + (to - from) * (1 - Math.exp(-dt * rate))
      currentOpening = state.changing ? state.opening : approach(currentOpening, state.opening, 13)
      currentChapter = approach(currentChapter, state.chapter, 8.2)
      currentGravity = approach(currentGravity, targetGravity, 7.5)
      currentLight = approach(currentLight, state.light, 9)
      gl.uniform1f(scene.opening, currentOpening)
      gl.uniform1f(scene.chapter, currentChapter)
      gl.uniform1f(scene.gravity, currentGravity)
      gl.uniform1f(scene.light, currentLight)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      canvas.dataset.rendered = 'true'
      if (!state.changing && live) schedule()
    }
    update.current = next => {
      state = next
      schedule()
    }
    observer.observe(canvas)
    document.addEventListener('visibilitychange', schedule)
    canvas.addEventListener('webglcontextlost', lost)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(refineTimer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', schedule)
      canvas.removeEventListener('webglcontextlost', lost)
      gl.deleteBuffer(scene.triangle)
      gl.deleteProgram(scene.program)
      update.current = null
    }
  }, [])

  useEffect(() => { update.current?.({ opening, chapter, motion, changing, gravity, light }) }, [opening, chapter, motion, changing, gravity, light])

  return <canvas className="threshold-canvas" ref={element} aria-hidden="true" />
}

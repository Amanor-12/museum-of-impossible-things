import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { materials, type Material, type Room } from './catalog'

export type Gesture = { x: number; y: number; aimX: number; aimY: number }
type SceneProps = { room: Room; material: Material; motion: boolean; folded: boolean; visible: boolean; depth: number; gesture: RefObject<Gesture> }

const vertex = /* glsl */ `
uniform float uTime, uMode, uForce;
varying vec3 vNormal, vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  float flow = 1.0 - abs(uMode - 1.0);
  float wave = sin(uv.x * 25.1327 - uTime * 1.7 + uv.y * 6.2832)
    + .55 * sin(uv.x * 43.9823 + uTime * 1.1);
  vec3 p = position + normal * wave * (.125 * flow + .075 * uForce);
  p *= 1.0 + max(0.0, uMode - 1.0) * .065;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
}`

const fragment = /* glsl */ `
uniform float uMode;
varying vec3 vNormal, vWorld;
varying vec2 vUv;
float panel(vec3 r, vec3 axis, float width, float blur) {
  return smoothstep(width - blur, width + blur, dot(r, normalize(axis)));
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  vec3 r = reflect(-v, n);
  float rim = pow(1.0 - abs(dot(n, v)), 2.6);
  float bands = .5 + .5 * sin(vUv.y * 37.6991);
  vec3 c = vec3(.045,.050,.058);
  c += vec3(.78,.87,1.0) * panel(r, vec3(-.7,.83,.4), .78, .045);
  c += vec3(.97,.87,.67) * panel(r, vec3(.45,.75,-.15), .88, .035);
  c += vec3(.28,.36,.67) * panel(r, vec3(.7,-.42,.4), .73, .13);
  c += vec3(.41,.51,.27) * panel(r, vec3(-.6,-.64,-.47), .77, .07);
  c += vec3(.36,.39,.43) * smoothstep(.08,.21,abs(r.y + .16 * r.x));
  c *= .63 + .37 * bands;
  c += rim * vec3(.17,.21,.24);
  float ghost = smoothstep(1.0, 2.0, uMode);
  vec3 spectrum = mix(vec3(.22,.45,.76), vec3(.7,.79,.47), .5 + .5 * sin(vUv.x * 18.85));
  c = mix(c, spectrum * (.13 + rim * .9 + bands * .16), ghost);
  gl_FragColor = vec4(c, mix(1.0, .16 + rim * .73 + bands * .09, ghost));
}`

// Three nested bands follow a closed, asymmetrical trefoil. Each band uses a rounded rectangular cross-section.
function makeRibbon(segments: number, offset: number) {
  const sides = 24
  const point = (t: number) => {
    const radius = 1.43 + .53 * Math.cos(3 * t + .25)
    return new THREE.Vector3(radius * Math.cos(2 * t), radius * Math.sin(2 * t), .69 * Math.sin(3 * t) + .12 * Math.sin(5 * t))
  }
  const positions = [], uv = [], indices = []
  const up = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2
    const center = point(t)
    const tangent = point(t + .001).sub(point(t - .001)).normalize()
    const across = tangent.clone().cross(up).normalize().applyAxisAngle(tangent, .55 + .44 * Math.sin(t * 3))
    const normal = tangent.clone().cross(across)
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2
      const a = Math.cos(angle), b = Math.sin(angle)
      const p = center.clone()
        .addScaledVector(across, offset + .123 * Math.sign(a) * Math.pow(Math.abs(a), .59))
        .addScaledVector(normal, .089 * Math.sign(b) * Math.pow(Math.abs(b), .59))
      positions.push(p.x, p.y, p.z)
      uv.push(i / segments, j / sides)
      if (i < segments && j < sides) {
        const k = i * (sides + 1) + j
        indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function Sculpture({ gesture, motion, material, room }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const { size } = useThree()
  const segments = size.width < 680 ? 128 : 224
  const ribbons = useMemo(() => [-.265, 0, .265].map(offset => makeRibbon(segments, offset)), [segments])
  const shaders = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uMode: { value: 0 }, uForce: { value: 0 }, uTime: { value: 0 } },
    vertexShader: vertex, fragmentShader: fragment, transparent: true, side: THREE.DoubleSide,
  }), [])
  useEffect(() => () => { ribbons.forEach(geometry => geometry.dispose()) }, [ribbons])
  useEffect(() => () => shaders.dispose(), [shaders])
  useFrame((_, delta) => {
    const mesh = group.current
    if (!mesh) return
    const step = Math.min(delta, .05)
    const damp = (from: number, to: number) => motion ? THREE.MathUtils.damp(from, to, 5, step) : to
    const firstRibbon = mesh.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
    const uniforms = firstRibbon.material.uniforms
    if (motion) uniforms.uTime.value += step
    const time = uniforms.uTime.value
    uniforms.uMode.value = damp(uniforms.uMode.value, materials.indexOf(material))
    uniforms.uForce.value = damp(uniforms.uForce.value, Math.hypot(gesture.current.aimX, gesture.current.aimY) * .45)
    mesh.rotation.x = damp(mesh.rotation.x, -.21 + gesture.current.y + gesture.current.aimY * .14)
    mesh.rotation.y = damp(mesh.rotation.y, -.36 + gesture.current.x + gesture.current.aimX * .18 + (motion ? Math.sin(time * .39) * .14 : 0))
    mesh.rotation.z = damp(mesh.rotation.z, -.43 + (motion ? Math.sin(time * .33) * .065 : 0))
    mesh.position.y = motion ? Math.sin(time * .65) * .10 : 0
  })
  return <group ref={group} scale={room === 'closing' ? .73 : 1} rotation={[-.21, -.36, -.43]}>
    {ribbons.map((geometry, i) => <mesh key={i} geometry={geometry} material={shaders} />)}
  </group>
}

function Architecture({ motion, gesture, depth, folded, room }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const phase = useRef(0)
  const tunnel = useMemo(() => new THREE.RingGeometry(2.16, 4.25, 6, 1, Math.PI / 6), [])
  const line = useMemo(() => new THREE.RingGeometry(2.16, 2.18, 6, 1, Math.PI / 6), [])
  const reveal = useMemo(() => new THREE.CylinderGeometry(2.16, 2.02, 1.32, 6, 1, true, Math.PI * 2 / 3), [])
  useEffect(() => () => { tunnel.dispose(); line.dispose(); reveal.dispose() }, [tunnel, line, reveal])
  useFrame(({ camera }, delta) => {
    const step = Math.min(delta, .05)
    if (motion) phase.current += step
    const damp = (from: number, to: number) => motion ? THREE.MathUtils.damp(from, to, 3, step) : to
    camera.position.x = damp(camera.position.x, gesture.current.aimX * .64 + Math.sin(gesture.current.x) * .44)
    camera.position.y = damp(camera.position.y, -gesture.current.aimY * .45)
    camera.position.z = damp(camera.position.z, (room === 'threshold' ? .6 : 2.5) - depth * 7)
    camera.lookAt(0, 0, -20)
    group.current?.children.forEach((rib, i) => {
      const breath = motion ? Math.sin(phase.current * 1.34 - i * .39) * .065 : 0
      rib.scale.setScalar(1 + breath)
      rib.rotation.z = damp(rib.rotation.z, i * (folded ? .235 : .049) + breath)
      rib.position.x = damp(rib.position.x, folded ? Math.sin(i * .3) * (i * .13) : 0)
      rib.position.y = damp(rib.position.y, folded ? -i * .13 : 0)
    })
  })
  return <>
    <fogExp2 attach="fog" args={['#0b0d0d', .056]} />
    <ambientLight intensity={.86} />
    <pointLight position={[-1, 1, 3]} intensity={41} color="#c7d4c1" />
    <pointLight position={[1, 0, -12]} intensity={29} color="#c3fc77" />
    <group ref={group}>
      {Array.from({ length: 16 }, (_, i) => <group key={i} position={[0, 0, -i * 1.74 - 1]} rotation-z={i * .05}>
        <mesh geometry={tunnel}><meshStandardMaterial color={i % 2 ? '#414743' : '#565c57'} metalness={.47} roughness={.62} side={THREE.DoubleSide} /></mesh>
        <mesh position-z={-.66} rotation-x={Math.PI / 2} geometry={reveal}><meshStandardMaterial color={i % 2 ? "#474e49" : "#636b65"} roughness={.81} side={THREE.DoubleSide} /></mesh>
        <mesh position-z={.018} geometry={line}><meshBasicMaterial color={i % 3 === 0 ? '#c8ef98' : '#68776b'} side={THREE.DoubleSide} /></mesh>
      </group>)}
    </group>
    <mesh position={[0, -.15, -29]} rotation={[.3, .42, .5]}>
      <octahedronGeometry args={[.57]} />
      <meshBasicMaterial color="#d7f78b" fog={false} />
    </mesh>
  </>
}

export default function GalleryCanvas(props: SceneProps) {
  const architectural = props.room === 'threshold' || props.room === 'room'
  const portrait = matchMedia('(max-width: 680px)').matches
  return <Canvas key={String(architectural)} frameloop={props.visible ? 'always' : 'never'} dpr={[1, portrait ? 1.25 : 1.6]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
    <PerspectiveCamera makeDefault position={[0, 0, architectural ? 2.5 : 8.4]} fov={architectural ? 57 : portrait ? 42 : 38} near={.05} far={75} />
    {architectural ? <Architecture {...props} /> : <Sculpture {...props} />}
  </Canvas>
}



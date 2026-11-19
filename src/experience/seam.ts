// A Gaussian envelope concentrates a signed wave around the moving seam.
const span = 8
const frequency = 1.85
const attenuation = .72
const start = .07
const travel = .86
const wake = .16

export const seamCenter = (position: number) => start + position * travel

export function seamStrain(coordinate: number, position: number) {
  const x = (coordinate - seamCenter(position)) * span
  return Math.min(position / wake, 1) * Math.sin(x * frequency) * Math.exp(-x * x * attenuation)
}

export const seamShader = /* glsl */ `
float seamStrain(float coordinate, float position) {
  float x = (coordinate - (${start} + position * ${travel})) * ${span.toFixed(1)};
  return min(position / ${wake}, 1.0) * sin(x * ${frequency}) * exp(-x * x * ${attenuation});
}
`

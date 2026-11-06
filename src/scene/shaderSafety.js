import * as THREE from 'three'

// Guard on every built-in material's final colour. By day the window sun is
// strong, and a glossy highlight (the glazed mug, the brass flag poles, the
// cockatiel's eye...) can come out enormous or as NaN on some mobile GPUs
// (seen as the whole screen flashing on a Galaxy S23 in the office). The
// bloom pass then smears that one pixel over the full frame. Clamping here,
// before post-processing, keeps a stray value to a single pixel; the range is
// far above anything tone mapping shows, so nothing visible changes.
const FINAL = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'
if (THREE.ShaderChunk.opaque_fragment.includes(FINAL)) {
  THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace(
    FINAL,
    `if ( any( isnan( outgoingLight ) ) || any( isinf( outgoingLight ) ) ) outgoingLight = vec3( 0.0 );
outgoingLight = clamp( outgoingLight, 0.0, 32.0 );
${FINAL}`,
  )
}

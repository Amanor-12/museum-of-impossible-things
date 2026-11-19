export const vertex = /* glsl */ `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`

export const fragment = /* glsl */ `
precision highp float;
uniform vec2 uSize;
uniform float uOpening;
uniform float uChapter;
uniform float uJoint;
uniform float uGravity;
uniform float uQuality;
uniform float uLight;

#define FAR 45.0
#define EPS .004

float hash(vec3 p) {
  p = fract(p * .3183099 + vec3(.1,.17,.23));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}

float box(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

vec2 nearest(vec2 a, vec2 b) { return a.x < b.x ? a : b; }
mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float fault(float y) {
  return .28 * clamp((y-3.25)*.9, -.85, .85)
    - .21 * clamp((y-1.44)*3.4, -1.0, 1.0)
    + .075 * sin(y*3.0) + .055 * sin(y*6.35 + .5);
}

float gap() { return .086 + uOpening * 1.24; }

vec2 scene(vec3 p) {
  vec2 hit = vec2(p.y, 1.0);
  hit = nearest(hit, vec2(6.45-p.y, 2.0));
  hit = nearest(hit, vec2(7.4-abs(p.x), 2.0));
  hit = nearest(hit, vec2(12.2-p.z, 2.0));

  // The two monoliths bound opposite sides of a piecewise fault.
  float s = p.x - fault(p.y);
  float left = max(box(p-vec3(-3.35,3.0,-.10), vec3(4.0,3.35,.69)), s+gap());
  vec3 rightP = p-vec3(.0,uOpening*.17,-uOpening*.51);
  float right = max(box(rightP-vec3(3.37,3.05,-.12), vec3(3.98,3.25,.74)), -rightP.x+fault(rightP.y)+gap());
  hit = nearest(hit, vec2(left, 3.0));
  hit = nearest(hit, vec2(right, 4.0));

  // A second passage behind the split has an offset rhythm and a visible end wall.
  if (p.z < -.5) {
    float t = max(0.0,-p.z-2.9);
    float ribZ = mod(t + .92, 2.38) - 1.19;
    float corridorX = .19 + t*.052 - uOpening*.43*exp(-t*.12);
    float width = 2.48 - min(.58,t*.038);
    vec2 jamb = turn(.034 * sin(floor((t+.92)/2.38)*1.2)) * vec2(p.x-corridorX,p.y-2.75);
    vec3 rib = vec3(abs(jamb.x)-width, jamb.y, ribZ);
    hit = nearest(hit, vec2(box(rib,vec3(.27,2.89,.23)),5.0));
    hit = nearest(hit, vec2(box(vec3(jamb.x,jamb.y-2.6,ribZ),vec3(width,.34,.23)),5.0));
    hit = nearest(hit, vec2(box(p-vec3(.7,2.64,-20.0),vec3(6.0,2.9,.45)),6.0));
    vec3 foil = p-vec3(.38-uOpening*.64,2.23,-9.55);
    foil.xy = turn(-.31-uOpening*.22) * foil.xy;
    foil.xz = turn(foil.y*.49-uOpening*.85) * foil.xz;
    float cut = abs(foil.x+.13*sin(foil.y*1.6))-(.38-abs(foil.y)*.14);
    hit = nearest(hit, vec2(max(max(cut,abs(foil.y)-1.42),abs(foil.z)-.062),7.0));
    hit = nearest(hit, vec2(box(foil-vec3(.32,.02,-.12),vec3(.027,1.27,.034)),7.0));
  }
  return hit;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(.012,0.0);
  if (uQuality<.5) {
    float d=scene(p).x;
    return normalize(vec3(scene(p+e.xyy).x-d,scene(p+e.yxy).x-d,scene(p+e.yyx).x-d));
  }
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x, scene(p+e.yyx).x-scene(p-e.yyx).x));
}

vec3 lightScene(vec3 p, vec3 n, float id, vec3 rd) {
  vec3 graphite = vec3(.105,.112,.119);
  float localLight = smoothstep(.35,.94,uChapter)*(1.0-smoothstep(3.1,3.9,uChapter));
  float cold = smoothstep(.4,1.0,uLight)*localLight;
  vec3 amber = mix(vec3(1.0,.63,.32),vec3(.42,.72,1.0),cold);
  vec3 bone = mix(vec3(1.0,.83,.62),vec3(.59,.83,1.0),cold);
  vec3 l = normalize(vec3(mix(-.74,.82,uLight*localLight),.78,.48));
  float slab = step(2.5,id)*step(id,4.5);
  float broad = noise(p*1.4);
  float grain = uQuality>.5 ? noise(p*vec3(137.,26.,103.)) : .5;
  float aggregate = uQuality>.5 ? noise(p*vec3(24.,.78,24.)) : .5;
  float hand = uQuality>.5 ? noise(p*vec3(.67,5.2,.77)) : .5;
  float horizontal = smoothstep(.48,.51,abs(fract(p.y*.64+.17)-.5));
  float vertical = smoothstep(.488,.5,abs(fract(p.x*.31+.62)-.5));
  vec3 base = graphite*(.76+.27*broad+.17*aggregate+.10*hand+.14*grain);
  base *= 1.0 - (.24*horizontal+.18*vertical)*slab;
  if(id<1.5) base = vec3(.075,.076,.077)*(.63+.52*broad+.19*grain);
  if(id>4.5) base = mix(graphite,vec3(.22,.185,.143),.63)*(.7+.31*broad+.18*grain);
  if(id>6.5) base = mix(base,bone,.42);
  float NdotL = max(0.0,dot(n,l));
  float recess = clamp(scene(p+n*.18).x/.18,0.0,1.0);
  float sideLight = exp(-pow((p.x+2.25+p.y*.61-p.z*.46)*.42,2.0));
  float edge = exp(-abs(abs(p.x-fault(p.y))-gap())*2.9)*slab;
  vec3 color = base*(.26+.34*recess + NdotL*sideLight*.86);
  color += vec3(.09,.105,.113)*NdotL*max(0.0,.7-p.x*.064);
  if(p.z>-.85) {
    float path = abs(p.x+.035-p.z*.19);
    float lamp = clamp(1.0-path/(gap()*.72+.07),0.0,1.0);
    float penumbra = exp(-pow(path/(gap()*1.8+.10),2.0));
    float floorMask = 1.0-step(1.5,id);
    float spill = exp(-p.z*.115)*floorMask;
    color += amber*(lamp*.44+penumbra*.068)*spill;
    color += amber*edge*(abs(n.x)*.47+.043);
    float reflection = pow(max(0.0,1.0-abs(dot(n,-rd))),3.5);
    color += bone*reflection*penumbra*spill*.17;
    if(p.z>12.15) {
      float afterimage = exp(-abs(p.x-fault(p.y)) * 17.0);
      color += bone*afterimage*.74;
    }
  } else {
    vec3 source=vec3(-.28,3.9,-8.8)-p;
    float falloff=1.0/(1.0+.097*dot(source,source));
    color += bone*base*falloff*(.45+max(0.0,dot(n,normalize(source)))*2.2);
    float lightBand = 1.0-smoothstep(.025,.10,abs(p.x-.6));
    color += bone*lightBand*(id>5.5 && id<6.5 ? 1.48 : .06);
    color += amber*pow(broad,2.0)*.04;
    color += bone*localLight*(1.0-abs(uLight-.5)*1.85)*.057;
    if(id>6.5) {
      vec3 reflected = reflect(rd,n);
      color += bone*pow(max(0.0,dot(reflected,normalize(vec3(-.8,.6,.31)))),7.0)*.52;
    }
  }
  return color;
}

void main() {
  vec2 uv = (2.0*gl_FragCoord.xy-uSize)/uSize.y;
  float aspect = uSize.x/uSize.y;
  uv.x -= (uJoint-.5)*2.0*aspect;
  float inside = smoothstep(.0,1.0,uChapter);
  float inscription = smoothstep(1.0,2.0,uChapter);
  float inversion = smoothstep(2.0,3.0,uChapter);
  float exitShot = smoothstep(3.0,4.0,uChapter);
  float mobile = 1.0-smoothstep(.63,1.0,aspect);
  vec3 ro = vec3(mix(-1.46,.27,inside)+inscription*.76-inversion*.86+exitShot*.32, 1.78+mobile*.24+inversion*.72-exitShot*.29, mix(8.1,-2.38,inside)-inscription*1.88-inversion*.66-exitShot*.17);
  vec3 target = vec3(.0,2.52+mobile*.19,mix(-.18,-18.0,inside));
  vec3 fwd = normalize(target-ro);
  fwd.xz = turn(3.15*exitShot) * fwd.xz;
  vec3 side = normalize(cross(fwd,vec3(0,1,0)));
  vec3 up = cross(side,fwd);
  uv = turn(3.14159*uGravity) * uv;
  vec3 rd = normalize(fwd*(1.78+mobile*.23)+side*uv.x+up*uv.y);
  float t=.03, id=0.0;
  for(int i=0;i<112;i++){
    if(uQuality<.5 && i==60) break;
    vec2 h=scene(ro+rd*t);
    if(h.x<EPS || t>FAR){id=h.y;break;}
    t+=clamp(h.x*.87, .003, 3.0);
  }
  vec3 p=ro+rd*t;
  vec3 color=vec3(.016,.016,.019);
  if(t<FAR && id>0.0){
    vec3 n=normalAt(p);
    color=lightScene(p,n,id,rd);
    float fog=1.0-exp(-t*.017);
    color=mix(color,vec3(.094,.073,.054),fog*.54);
    if(p.z < -1.1) color+=vec3(.16,.103,.054)*exp(-abs(p.x)*.41)*fog;
    float beam=0.0;
    for(int i=1;i<=12;i++) {
      if(uQuality<.5) break;
      vec3 at=ro+rd*(t*float(i)/13.0);
      float envelope=exp(-pow((at.x-at.z*.19+.02)/(gap()*.45+.08),2.0));
      beam+=envelope*exp(-abs(at.z+.4)*.16)*smoothstep(-.1,2.0,at.y)*.006;
    }
    color+=vec3(1.0,.62,.33)*beam;
  }
  float vignette=1.0-.39*smoothstep(.35,1.58,length(uv*vec2(.58,.84)));
  color=color/(color+vec3(.66));
  color=pow(max(color,0.0),vec3(.91));
  color*=vignette;
  float dither = hash(vec3(gl_FragCoord.xy,1.0)) - .5;
  gl_FragColor=vec4(color+dither*.029,1.0);
}
`

// Liquid glass: a physically based transparent material (transmission) on a sphere whose surface
// is pushed in and out by 3D noise inside the vertex shader. Time t is a uniform, so it stays pure.
import { view3d, orbit, gradientTexture, THREE } from '../ui/three.js';
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){ const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0)); vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }
float disp(vec3 p){ return 0.13*snoise(p*1.1+vec3(0.0,uTime*0.35,0.0)) + 0.025*snoise(p*2.2-vec3(uTime*0.2)); }`;  // two smooth octaves: a slow swell plus a little ripple
export async function mount(stage) {
  try { await document.fonts.load('400 200px Anton'); } catch (e) { /* draw with the fallback font */ }
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1.05 });
  v.scene.background = gradientTexture(['#2C78D2', '#93CBFF', '#F4FBFF']);
  // colourful things behind the glass, so refraction has something to bend
  const ringMat = new THREE.MeshStandardMaterial({ color: '#FF8F3A', roughness: 0.35, metalness: 0.1, emissive: '#F56B49', emissiveIntensity: 0.25 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.16, 32, 160), ringMat); ring.position.z = -1.6; v.scene.add(ring);
  const balls = ['#FFC74E', '#12163F', '#F56B49', '#5EA9F2', '#D74270'].map((c, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22 + (i % 2) * 0.08, 48, 32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.2 })); v.scene.add(m); return m; });
  const label = (() => { const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const x = c.getContext('2d'); x.font = '400 400px Anton'; const fg = x.createLinearGradient(0, 0, 2048, 0); fg.addColorStop(0, '#FFC74E'); fg.addColorStop(0.5, '#FF8F3A'); fg.addColorStop(1, '#F56B49'); x.fillStyle = fg; /* warm letters refract into warm swirls */ x.textAlign = 'center'; x.fillText('YUV.AI', 1024, 420); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    // alphaTest instead of transparent: opaque objects are what the glass refracts (transmission pass)
    return new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5 })); })();
  label.position.set(0, 0, -2.4); v.scene.add(label);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: 0.04, transmission: 1, thickness: 1.4, ior: 1.42, iridescence: 0.55, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new THREE.Color('#FFE2B8'), attenuationDistance: 3 });
  const uTime = { value: 0 };
  glass.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + NOISE + '\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec3 p0 = position; vec3 nrm = normalize(normal);
        vec3 tng = normalize(cross(nrm, abs(nrm.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0))); vec3 btg = cross(nrm, tng);
        float e = 0.01; vec3 pA = p0 + nrm*disp(p0); vec3 pB = (p0+tng*e) + nrm*disp(p0+tng*e); vec3 pC = (p0+btg*e) + nrm*disp(p0+btg*e);
        vec3 objectNormal = normalize(cross(pB - pA, pC - pA));
        if (dot(objectNormal, nrm) < 0.0) objectNormal = -objectNormal;`)
      .replace('#include <begin_vertex>', 'vec3 transformed = pA;');
  };
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 48), glass); v.scene.add(orb);
  v.scene.add(new THREE.DirectionalLight('#FFFFFF', 2.2).translateX(3).translateY(4).translateZ(5));
  const target = new THREE.Vector3(0, 0, 0);
  const render = t => {
    uTime.value = t;
    orb.rotation.y = t * 0.25; ring.rotation.z = t * 0.18; ring.rotation.x = 0.3 * Math.sin(t * 0.4);
    balls.forEach((b, i) => { const a = t * (0.5 + i * 0.08) + i * 1.25, r = 1.9 + 0.25 * Math.sin(t + i); b.position.set(Math.cos(a) * r, Math.sin(a * 1.3) * 0.9, -0.9 + Math.sin(a) * 0.6); });
    orbit(v.camera, target, 5.4, v.user.yaw, 0.08 + v.user.pitch);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: 12, render: t => { last = t; render(t); }, resize: v.size };
}

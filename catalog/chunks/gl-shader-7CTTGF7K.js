import{a as b,b as u,c as w}from"./chunk-Q3A6M5XP.js";import"./chunk-KUFADR53.js";var m=[{id:"sunset",he:"\u05E9\u05E7\u05D9\u05E2\u05D4",en:"Sunset",code:`vec3 sunset(vec2 p, float t) {
  float sunY = 0.55 - 0.5 * smoothstep(0.0, 1.0, t / 8.0);   // the sun goes down with t
  vec3 top = mix(vec3(0.37,0.66,0.95), vec3(0.18,0.12,0.38), 1.0 - smoothstep(0.1, 0.55, sunY));
  vec3 low = mix(vec3(0.86,0.94,1.0), vec3(1.0,0.56,0.23), 1.0 - smoothstep(0.1, 0.55, sunY));
  vec3 sky = mix(low, top, smoothstep(0.0, 0.9, p.y));
  float d = length(p - vec2(0.5 * u_aspect, sunY));
  sky += vec3(1.0,0.78,0.31) * (1.0 - smoothstep(0.065, 0.07, d) + 0.35 * exp(-d * 6.0));
  return sky;
}`},{id:"sea",he:"\u05D9\u05DD",en:"Sea",code:`vec3 sea(vec2 p, float t) {
  float h = 0.45;                                          // the horizon line
  vec3 sky = mix(vec3(1.0,0.72,0.45), vec3(0.37,0.66,0.95), smoothstep(h, 1.0, p.y));
  if (p.y > h) return sky;
  float depth = h - p.y;                                   // 0 at the horizon, bigger closer to us
  float z = 1.0 / (depth + 0.02);                          // perspective: rows near the horizon are far away
  float x = (p.x - 0.5 * u_aspect) * z;                    // sideways position on the water surface
  float w = 0.5 * sin(x * 1.3 + z * 0.9 - t * 1.6) + 0.5 * sin(x * 0.7 - z * 1.7 + t * 1.1);
  w *= smoothstep(0.0, 0.12, depth);                       // far waves melt into one colour instead of flickering
  float glitter = smoothstep(0.55, 1.0, w) * exp(-pow((p.x - 0.5 * u_aspect) * 3.0, 2.0));
  vec3 water = mix(vec3(0.55,0.62,0.78), vec3(0.07,0.09,0.25), smoothstep(0.0, 0.45, depth)) + 0.05 * w;
  return mix(water, sky, exp(-depth * 40.0) * 0.6) + vec3(1.0,0.85,0.55) * glitter;
}`},{id:"marble",he:"\u05E9\u05D9\u05E9",en:"Marble",code:`vec3 marble(vec2 p, float t) {
  vec2 q = vec2(fbm(p * 3.0 + t * 0.05), fbm(p * 3.0 + 5.2));   // domain warping: noise moves noise
  float v = fbm(p * 3.0 + 4.0 * q);
  float vein = 1.0 - smoothstep(0.0, 0.02, abs(sin((p.x + v * 1.6) * 9.0)) * 0.08);
  vec3 stone = mix(vec3(0.93,0.95,0.98), vec3(0.69,0.80,0.94), v);
  return mix(stone, vec3(0.07,0.09,0.25), vein * 0.8);
}`},{id:"gradient",he:"\u05D2\u05E8\u05D3\u05D9\u05D0\u05E0\u05D8 \u05E0\u05D5\u05D6\u05DC\u05D9",en:"Liquid gradient",code:`vec3 gradient(vec2 p, float t) {
  vec2 q = p + 0.25 * vec2(fbm(p * 1.5 + t * 0.12), fbm(p * 1.5 - t * 0.1 + 3.0));
  vec3 a = vec3(1.0,0.78,0.31), b = vec3(1.0,0.56,0.23), c = vec3(0.37,0.66,0.95), d = vec3(0.07,0.09,0.25);
  vec3 col = mix(mix(a, b, smoothstep(0.1, 0.7, q.x / u_aspect)), mix(c, d, smoothstep(0.2, 0.9, q.x / u_aspect)), smoothstep(0.25, 0.85, q.y));
  return col + (hash(p * 900.0 + t) - 0.5) * 0.035;          // grain, so it never bands
}`},{id:"paper",he:"\u05E0\u05D9\u05D9\u05E8 \u05D5\u05D2\u05E8\u05E2\u05D9\u05DF",en:"Paper and grain",code:`vec3 paper(vec2 p, float t) {
  float fibers = fbm(vec2(p.x * 60.0, p.y * 6.0)) * 0.5 + fbm(p * 140.0) * 0.5;
  float grain = hash(p * 1200.0 + floor(t * 24.0));        // new grain 24 times a second, like film
  vec3 col = vec3(0.965,0.955,0.93) - fibers * 0.07 - (grain - 0.5) * 0.06;
  float ink = 1.0 - smoothstep(0.0, 0.012, abs(p.y - 0.5 - 0.03 * sin(p.x * 6.0 + t)) - 0.004);
  return mix(col, vec3(0.07,0.09,0.25), ink * smoothstep(0.0, 1.0, t / 2.0 - p.x / u_aspect));
}`}],L=`#version 300 es
precision highp float;
uniform vec2 u_res; uniform float u_t; uniform float u_aspect; uniform int u_preset;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
`,R=L+m.map(n=>n.code).join(`
`)+`
void main() {
  vec2 p = gl_FragCoord.xy / u_res.y;            // y from 0 (bottom) to 1 (top), x from 0 to the aspect ratio
  vec3 c = u_preset == 0 ? sunset(p, u_t) : u_preset == 1 ? sea(p, u_t) : u_preset == 2 ? marble(p, u_t) : u_preset == 3 ? gradient(p, u_t) : paper(p, u_t);
  o = vec4(c, 1.0);
}`,T=`#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;function P(n){n.classList.add("gls");let t=document.createElement("canvas");t.width=960,t.height=540,t.className="gls-c",n.appendChild(t);let i=document.createElement("div");i.className="seg gls-seg",i.dir=w,i.innerHTML=m.map((o,r)=>`<button type="button" data-i="${r}"${r?"":' class="on"'}>${b?o.en:o.he}</button>`).join(""),n.appendChild(i);let c=document.createElement("details");c.className="gls-code",c.innerHTML=`<summary>${u("\u05D4\u05E7\u05D5\u05D3 \u05E9\u05DE\u05E6\u05D9\u05D9\u05E8 \u05DB\u05DC \u05E4\u05D9\u05E7\u05E1\u05DC (GLSL)","The code that paints every pixel (GLSL)")}</summary><pre dir="ltr"></pre>`,n.appendChild(c);let h=0,d=()=>{c.querySelector("pre").textContent=m[h].code};d();let e=t.getContext("webgl2",{antialias:!1,preserveDrawingBuffer:!0});if(!e)return n.insertAdjacentHTML("afterbegin",`<p class="gls-no">${u("\u05D4\u05D3\u05E4\u05D3\u05E4\u05DF \u05D4\u05D6\u05D4 \u05DC\u05D0 \u05EA\u05D5\u05DE\u05DA \u05D1-WebGL2.","This browser does not support WebGL2.")}</p>`),null;let v=(o,r)=>{let a=e.createShader(o);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(a));return a},s=e.createProgram();if(e.attachShader(s,v(e.VERTEX_SHADER,T)),e.attachShader(s,v(e.FRAGMENT_SHADER,R)),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(s));e.useProgram(s);let _=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,_),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let g=e.getAttribLocation(s,"a");e.enableVertexAttribArray(g),e.vertexAttribPointer(g,2,e.FLOAT,!1,0,0);let p=o=>e.getUniformLocation(s,o),y=p("u_res"),A=p("u_t"),S=p("u_aspect"),E=p("u_preset"),l=0,x=()=>{let o=Math.min(2,window.devicePixelRatio||1),r=Math.round((t.clientWidth||960)*o);t.width=r,t.height=Math.round(r*9/16)},f=o=>{l=o,e.viewport(0,0,t.width,t.height),e.uniform2f(y,t.width,t.height),e.uniform1f(A,o),e.uniform1f(S,t.width/t.height),e.uniform1i(E,h),e.drawArrays(e.TRIANGLES,0,3)};return i.addEventListener("click",o=>{let r=o.target.closest("button");r&&(h=+r.dataset.i,i.querySelectorAll("button").forEach(a=>a.classList.toggle("on",a===r)),d(),f(l))}),x(),{dur:10,render:f,resize:()=>{x(),f(l)},poster:6}}export{P as mount};

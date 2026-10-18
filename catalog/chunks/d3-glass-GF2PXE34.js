import{b as m,c as d,d as y}from"./chunk-GQN55EWZ.js";import{Ja as o}from"./chunk-63TPIQ5C.js";import"./chunk-KUFADR53.js";var g=`
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
float disp(vec3 p){ return 0.13*snoise(p*1.1+vec3(0.0,uTime*0.35,0.0)) + 0.025*snoise(p*2.2-vec3(uTime*0.2)); }`;async function b(u){try{await document.fonts.load("400 200px Anton")}catch{}let t=m(u,{aspect:16/9,exposure:1.05});t.scene.background=y(["#2C78D2","#93CBFF","#F4FBFF"]);let h=new o.MeshStandardMaterial({color:"#FF8F3A",roughness:.35,metalness:.1,emissive:"#F56B49",emissiveIntensity:.25}),s=new o.Mesh(new o.TorusGeometry(1.75,.16,32,160),h);s.position.z=-1.6,t.scene.add(s);let F=["#FFC74E","#12163F","#F56B49","#5EA9F2","#D74270"].map((e,r)=>{let n=new o.Mesh(new o.SphereGeometry(.22+r%2*.08,48,32),new o.MeshStandardMaterial({color:e,roughness:.3,metalness:.2}));return t.scene.add(n),n}),a=(()=>{let e=document.createElement("canvas");e.width=2048,e.height=512;let r=e.getContext("2d");r.font="400 400px Anton";let n=r.createLinearGradient(0,0,2048,0);n.addColorStop(0,"#FFC74E"),n.addColorStop(.5,"#FF8F3A"),n.addColorStop(1,"#F56B49"),r.fillStyle=n,r.textAlign="center",r.fillText("YUV.AI",1024,420);let c=new o.CanvasTexture(e);return c.colorSpace=o.SRGBColorSpace,new o.Mesh(new o.PlaneGeometry(10,2.5),new o.MeshBasicMaterial({map:c,alphaTest:.5}))})();a.position.set(0,0,-2.4),t.scene.add(a);let i=new o.MeshPhysicalMaterial({color:"#FFFFFF",metalness:0,roughness:.04,transmission:1,thickness:1.4,ior:1.42,iridescence:.55,iridescenceIOR:1.3,clearcoat:1,clearcoatRoughness:.05,attenuationColor:new o.Color("#FFE2B8"),attenuationDistance:3}),v={value:0};i.onBeforeCompile=e=>{e.uniforms.uTime=v,e.vertexShader=`uniform float uTime;
`+g+`
`+e.vertexShader.replace("#include <beginnormal_vertex>",`
        vec3 p0 = position; vec3 nrm = normalize(normal);
        vec3 tng = normalize(cross(nrm, abs(nrm.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0))); vec3 btg = cross(nrm, tng);
        float e = 0.01; vec3 pA = p0 + nrm*disp(p0); vec3 pB = (p0+tng*e) + nrm*disp(p0+tng*e); vec3 pC = (p0+btg*e) + nrm*disp(p0+btg*e);
        vec3 objectNormal = normalize(cross(pB - pA, pC - pA));
        if (dot(objectNormal, nrm) < 0.0) objectNormal = -objectNormal;`).replace("#include <begin_vertex>","vec3 transformed = pA;")};let x=new o.Mesh(new o.IcosahedronGeometry(1.15,48),i);t.scene.add(x),t.scene.add(new o.DirectionalLight("#FFFFFF",2.2).translateX(3).translateY(4).translateZ(5));let w=new o.Vector3(0,0,0),l=e=>{v.value=e,x.rotation.y=e*.25,s.rotation.z=e*.18,s.rotation.x=.3*Math.sin(e*.4),F.forEach((r,n)=>{let c=e*(.5+n*.08)+n*1.25,z=1.9+.25*Math.sin(e+n);r.position.set(Math.cos(c)*z,Math.sin(c*1.3)*.9,-.9+Math.sin(c)*.6)}),d(t.camera,w,5.4,t.user.yaw,.08+t.user.pitch),t.render()},p=0;return t.setOnDrag(()=>l(p)),{dur:12,render:e=>{p=e,l(e)},resize:t.size}}export{b as mount};

import{A as N,B as le,Ca as Ee,D as w,Fa as xe,G as j,I as D,K,M as ce,O as y,P as O,Q as I,R as G,S as ue,T as me,U as ve,V as Q,X as de,Y as W,_ as fe,a as ie,b as Z,e as re,ma as ee,na as pe,oa as $,pa as B,qa as he,ra as ge,sa as A,u as se,w as J}from"./chunk-63TPIQ5C.js";var X=class extends y{constructor(a,e={}){super(a),this.isWater=!0;let n=this,i=e.textureWidth!==void 0?e.textureWidth:512,o=e.textureHeight!==void 0?e.textureHeight:512,E=e.clipBias!==void 0?e.clipBias:0,p=e.alpha!==void 0?e.alpha:1,d=e.time!==void 0?e.time:0,c=e.waterNormals!==void 0?e.waterNormals:null,l=e.sunDirection!==void 0?e.sunDirection:new w(.70707,.70707,0),m=new D(e.sunColor!==void 0?e.sunColor:16777215),f=new D(e.waterColor!==void 0?e.waterColor:8355711),r=e.eye!==void 0?e.eye:new w(0,0,0),v=e.distortionScale!==void 0?e.distortionScale:20,h=e.side!==void 0?e.side:ie,M=e.fog!==void 0?e.fog:!1,u=new me,s=new w,g=new w,F=new w,S=new j,x=new w(0,0,-1),T=new N,z=new w,_=new w,L=new N,V=new j,H=new ue,ae=new le(i,o),U={name:"MirrorShader",uniforms:I.merge([Q.fog,Q.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new j},sunColor:{value:new D(8355711)},sunDirection:{value:new w(.70707,.70707,0)},eye:{value:new w},waterColor:{value:new D(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},C=new G({name:U.name,uniforms:I.clone(U.uniforms),vertexShader:U.vertexShader,fragmentShader:U.fragmentShader,lights:!0,side:h,fog:M});C.uniforms.mirrorSampler.value=ae.texture,C.uniforms.textureMatrix.value=V,C.uniforms.alpha.value=p,C.uniforms.time.value=d,C.uniforms.normalSampler.value=c,C.uniforms.sunColor.value=m,C.uniforms.waterColor.value=f,C.uniforms.sunDirection.value=l,C.uniforms.distortionScale.value=v,C.uniforms.eye.value=r,n.material=C,n.onBeforeRender=function(R,we,k){if(g.setFromMatrixPosition(n.matrixWorld),F.setFromMatrixPosition(k.matrixWorld),S.extractRotation(n.matrixWorld),s.set(0,0,1),s.applyMatrix4(S),z.subVectors(g,F),z.dot(s)>0)return;z.reflect(s).negate(),z.add(g),S.extractRotation(k.matrixWorld),x.set(0,0,-1),x.applyMatrix4(S),x.add(F),_.subVectors(g,x),_.reflect(s).negate(),_.add(g),H.position.copy(z),H.up.set(0,1,0),H.up.applyMatrix4(S),H.up.reflect(s),H.lookAt(_),H.far=k.far,H.updateMatrixWorld(),H.projectionMatrix.copy(k.projectionMatrix),V.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),V.multiply(H.projectionMatrix),V.multiply(H.matrixWorldInverse),u.setFromNormalAndCoplanarPoint(s,g),u.applyMatrix4(H.matrixWorldInverse),T.set(u.normal.x,u.normal.y,u.normal.z,u.constant);let b=H.projectionMatrix;L.x=(Math.sign(T.x)+b.elements[8])/b.elements[0],L.y=(Math.sign(T.y)+b.elements[9])/b.elements[5],L.z=-1,L.w=(1+b.elements[10])/b.elements[14],T.multiplyScalar(2/T.dot(L)),b.elements[2]=T.x,b.elements[6]=T.y,b.elements[10]=T.z+1-E,b.elements[14]=T.w,r.setFromMatrixPosition(k.matrixWorld);let ye=R.getRenderTarget(),Te=R.xr.enabled,Me=R.shadowMap.autoUpdate;n.visible=!1,R.xr.enabled=!1,R.shadowMap.autoUpdate=!1,R.setRenderTarget(ae),R.state.buffers.depth.setMask(!0),R.autoClear===!1&&R.clear(),R.render(we,H),n.visible=!0,R.xr.enabled=Te,R.shadowMap.autoUpdate=Me,R.setRenderTarget(ye);let ne=k.viewport;ne!==void 0&&R.state.viewport(ne)}}};var Y=class t extends y{constructor(){let a=t.SkyShader,e=new G({name:a.name,uniforms:I.clone(a.uniforms),vertexShader:a.vertexShader,fragmentShader:a.fragmentShader,side:Z,depthWrite:!1});super(new O(1,1,1),e),this.isSky=!0}};Y.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new w},up:{value:new w(0,1,0)}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorbtion + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function P(t,a,e){let n=new pe,i=-t/2,o=-a/2;return n.moveTo(i+e,o),n.lineTo(i+t-e,o),n.absarc(i+t-e,o+e,e,-Math.PI/2,0,!1),n.lineTo(i+t,o+a-e),n.absarc(i+t-e,o+a-e,e,0,Math.PI/2,!1),n.lineTo(i+e,o+a),n.absarc(i+e,o+a-e,e,Math.PI/2,Math.PI,!1),n.lineTo(i,o+e),n.absarc(i+e,o+e,e,Math.PI,1.5*Math.PI,!1),n}function oe(t,a,e){let n=t.attributes.position,i=new Float32Array(n.count*2);for(let o=0;o<n.count;o++)i[o*2]=(n.getX(o)+a/2)/a,i[o*2+1]=(n.getY(o)+e/2)/e;return t.setAttribute("uv",new ce(i,2)),t}function Se(t=512,a=7){let e=(c,l,m)=>{c=(c%m+m)%m,l=(l%m+m)%m;let f=Math.sin(c*127.1+l*311.7+m*74.7)*43758.5453;return f-Math.floor(f)},n=(c,l,m)=>{let f=Math.floor(c),r=Math.floor(l),v=c-f,h=l-r,M=v*v*(3-2*v),u=h*h*(3-2*h),s=e(f,r,m),g=e(f+1,r,m),F=e(f,r+1,m),S=e(f+1,r+1,m);return s+(g-s)*M+(F-s)*u+(s-g-F+S)*M*u},i=new Float32Array(t*t);for(let c=0;c<t;c++)for(let l=0;l<t;l++){let m=0,f=1,r=6;for(let v=0;v<5;v++)m+=f*n(l/t*r,c/t*r,r),f*=.5,r*=2;i[c*t+l]=m}let o=document.createElement("canvas");o.width=o.height=t;let E=o.getContext("2d"),p=E.createImageData(t,t);for(let c=0;c<t;c++)for(let l=0;l<t;l++){let m=i[c*t+(l+1)%t]-i[c*t+(l-1+t)%t],f=i[(c+1)%t*t+l]-i[(c-1+t)%t*t+l],r=-m*a,v=-f*a,h=1,M=Math.hypot(r,v,h);r/=M,v/=M,h/=M;let u=(c*t+l)*4;p.data[u]=(r*.5+.5)*255,p.data[u+1]=(v*.5+.5)*255,p.data[u+2]=(h*.5+.5)*255,p.data[u+3]=255}E.putImageData(p,0,0);let d=new ee(o);return d.wrapS=d.wrapT=re,d}function ke({w:t=.76,h:a=1.58,d:e=.085,r:n=.125,bezel:i=.03,bodyColor:o="#2B3263",screenTex:E}){let p=new W,d=.022,c=new A({color:o,metalness:1,roughness:.3,clearcoat:.7,clearcoatRoughness:.18}),l=new $(P(t-2*d,a-2*d,n-d),{depth:e-2*d,bevelEnabled:!0,bevelThickness:d,bevelSize:d,bevelSegments:10,curveSegments:36});l.translate(0,0,-(e-2*d)/2),p.add(new y(l,c));let m=new A({color:"#04050A",metalness:0,roughness:.06,clearcoat:1,clearcoatRoughness:.03}),f=t-.016,r=a-.016,v=new y(new B(P(f,r,n-.008),36),m);v.position.z=e/2+8e-4,p.add(v);let h=t-2*i,M=a-2*i,u=n-i*.9,s=new K({map:E||null,color:E?"#FFFFFF":"#000000",toneMapped:!1}),g=new y(oe(new B(P(h,M,u),36),h,M),s);g.position.z=e/2+.0016,p.add(g);let F=new O(.012,.16,.03);return[[t/2+.004,.32],[-t/2-.004,.42],[-t/2-.004,.2]].forEach(([S,x])=>{let T=new y(F,c);T.position.set(S,x,0),p.add(T)}),p.userData={w:t,h:a,d:e,screen:g,screenMat:s,sw:h,sh:M,sr:u,screenZ:e/2+.0016},p}var q={day:{cH:"#F4FBFF",c1:"#DDF0FF",c2:"#BDE1FF",c3:"#93CBFF",c4:"#5EA9F2",cZ:"#2C78D2",sunCol:"#FFF4D6",cloudLit:"#FFFFFF",cloudShade:"#AFC6E6",elev:38,azim:160,water:"#1E6FB8",sunWater:"#FFFFFF",exposure:.85,cover:.47},dusk:{cH:"#FFD27A",c1:"#FF9A44",c2:"#F56B49",c3:"#D74270",c4:"#603689",cZ:"#12163F",sunCol:"#FFE3A8",cloudLit:"#FFB067",cloudShade:"#9E3F78",elev:1.8,azim:192,water:"#081033",sunWater:"#FFE2B8",exposure:.6,cover:.5}},te=["cH","c1","c2","c3","c4","cZ","sunCol","cloudLit","cloudShade"];function Fe(){let t={sunDir:{value:new w(0,1,0)},time:{value:0},tod:{value:0},cover:{value:.47}};te.forEach(o=>{t[o+"A"]={value:new D(q.day[o])},t[o+"B"]={value:new D(q.dusk[o])}});let a=te.map(o=>`uniform vec3 ${o}A, ${o}B;`).join(`
`),e=te.map(o=>`vec3 ${o} = mix(${o}A, ${o}B, tod);`).join(`
`),n=new G({side:Z,depthWrite:!1,toneMapped:!1,uniforms:t,vertexShader:"varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",fragmentShader:`
      ${a}
      uniform vec3 sunDir; uniform float time, tod, cover; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }
      void main(){
        ${e}
        vec3 d = normalize(vDir); float e = d.y, h = max(e, 0.0);
        vec3 g = mix(cH, c1, smoothstep(0.0, 0.04, h));
        g = mix(g, c2, smoothstep(0.04, 0.10, h));
        g = mix(g, c3, smoothstep(0.10, 0.22, h));
        g = mix(g, c4, smoothstep(0.22, 0.42, h));
        g = mix(g, cZ, smoothstep(0.42, 0.85, h));
        vec3 sd = normalize(sunDir); float s = max(dot(d, sd), 0.0);
        g += sunCol * (pow(s, 5.0) * mix(0.12, 0.28, tod) + pow(s, 48.0) * 0.55 + pow(s, 1400.0) * 4.0);
        if (e > 0.0) {
          vec2 p = d.xz / (e + 0.06) * 1.25 + vec2(time * 0.02, time * 0.006);
          float n = fbm(p);
          float n2 = fbm(p + sd.xz * 0.06);
          float c = smoothstep(cover, cover + 0.27, n) * smoothstep(0.0, 0.03, e) * (1.0 - smoothstep(0.32, 0.6, e));
          float light = clamp((n - n2) * 5.0 + 0.55, 0.0, 1.0);
          vec3 cl = mix(cloudShade, cloudLit, light);
          cl += sunCol * pow(s, 3.0) * 0.35 * light;
          g = mix(g, cl, c * 0.92);
        } else {
          g = mix(cH * 0.7, cZ, smoothstep(0.0, -0.08, e));
        }
        gl_FragColor = vec4(g, 1.0);
        #include <colorspace_fragment>
      }`});return{dome:new y(new he(5e3,64,32),n),mat:n}}var Re=(t,a)=>new w().setFromSphericalCoords(1,J.degToRad(90-t),J.degToRad(a));function Ge(t,a,{waterY:e=-4.5,size:n=4.5,distortion:i=4.5}={}){let o=Fe();a.add(o.dome);let E=new de(t),p=new fe,d=new X(new ve(1e4,1e4),{textureWidth:1024,textureHeight:1024,waterNormals:Se(),sunDirection:new w(0,1,0),sunColor:16777215,waterColor:1003404,distortionScale:i,fog:!1});d.rotation.x=-Math.PI/2,d.position.y=e,d.material.uniforms.size.value=n,a.add(d);let c=new xe("#FFFFFF",2);a.add(c);let l=new Ee("#CFE6FF","#0F2A55",.7);a.add(l);let m=-1,f=null,r=q.day,v=q.dusk,h=(u,s,g)=>new D(u).lerp(new D(s),g);function M(u,s){let g=r.elev+(v.elev-r.elev)*s,F=r.azim+(v.azim-r.azim)*s,S=Re(g,F),x=o.mat.uniforms;x.sunDir.value.copy(S),x.time.value=u,x.tod.value=s,x.cover.value=r.cover+(v.cover-r.cover)*s;let T=d.material.uniforms;T.time.value=u*.55,T.sunDirection.value.copy(S),T.sunColor.value.copy(h(r.sunWater,v.sunWater,s)),T.waterColor.value.copy(h(r.water,v.water,s)),c.position.copy(S).multiplyScalar(50),c.color.copy(h("#FFFFFF","#FFB37A",s)),c.intensity=2+.4*s,l.color.copy(h("#CFE6FF","#FFB98A",s)),l.groundColor.copy(h("#0F2A55","#0B1440",s)),t.toneMappingExposure=r.exposure+(v.exposure-r.exposure)*s;let z=Math.round(s/.025)*.025;if(z!==m||!f){x.tod.value=z,x.time.value=0,p.add(o.dome);let _=E.fromScene(p,0,.1,1e4);a.add(o.dome),x.tod.value=s,x.time.value=u,f&&f.dispose(),f=_,a.environment=_.texture,m=z}}return{sky:o,water:d,update:M}}function We({w:t=1.5,dpt:a=1.02,bodyColor:e="#C7D2E4",screenTex:n}){let i=new W,o=new A({color:e,metalness:1,roughness:.32,clearcoat:.4,clearcoatRoughness:.25}),E=.045,p=new $(P(t-.02,a-.02,.06),{depth:E-.02,bevelEnabled:!0,bevelThickness:.01,bevelSize:.01,bevelSegments:4,curveSegments:18});p.rotateX(-Math.PI/2);let d=new y(p,o);i.add(d);let c=new ge({color:"#1B2033",roughness:.6,metalness:.2}),l=new y(new B(P(t*.86,a*.42,.02),8),c);l.rotation.x=-Math.PI/2,l.position.set(0,E+.0015,-a*.12),i.add(l);let m=new y(new B(P(t*.36,a*.26,.025),8),new A({color:e,metalness:1,roughness:.18}));m.rotation.x=-Math.PI/2,m.position.set(0,E+.0015,a*.27),i.add(m);let f=new W;f.position.set(0,E,-a/2+.01),i.add(f);let r=a-.04,v=.02,h=new $(P(t-.02,r,.05),{depth:v-.01,bevelEnabled:!0,bevelThickness:.005,bevelSize:.008,bevelSegments:3,curveSegments:18});h.translate(0,r/2,-v/2);let M=new y(h,o),u=new W;u.add(M),f.add(u);let s=new y(new B(P(t-.05,r-.03,.04),16),new A({color:"#04050A",roughness:.05,clearcoat:1}));s.position.set(0,r/2,v/2+.001),u.add(s);let g=t-.12,F=r-.12,S=new K({map:n||null,color:n?"#FFFFFF":"#000000",toneMapped:!1}),x=new y(oe(new B(P(g,F,.012),8),g,F),S);return x.position.set(0,r/2+.01,v/2+.0018),u.add(x),i.userData={lid:u,screenMat:S,sw:g,sh:F},i}function Le(t,{w:a=1,h:e=1.25,r:n=.08,back:i="#1E2357"}={}){let o=new ee(t);o.colorSpace=se,o.anisotropy=8;let E=new W,p=new y(oe(new B(P(a,e,n),16),a,e),new K({map:o,toneMapped:!1})),d=new y(new B(P(a,e,n),16),new A({color:i,metalness:.3,roughness:.35,clearcoat:.6}));return d.rotation.y=Math.PI,d.position.z=-.006,E.add(p,d),E.userData={tex:o,w:a,h:e,r:n},E}export{ke as a,Ge as b,We as c,Le as d};

import{f as o}from"./chunk-O7TN5GLK.js";import{a as b,h as u,i as g}from"./chunk-Z45KSPZB.js";import"./chunk-KUFADR53.js";var h={html:'<button id="go">\u05D4\u05EA\u05D7\u05DC \u05D0\u05D9\u05DE\u05D5\u05DF</button>',css:`#go {
  background: #FF8F3A;      /* \u05DB\u05EA\u05D5\u05DD \u05E4\u05E0\u05D9\u05E7\u05E1 */
  color: #12163F;           /* \u05E0\u05D9\u05D9\u05D1\u05D9 */
  border: 0;
  border-radius: 999px;     /* \u05D2\u05DC\u05D5\u05DC\u05D4 */
  padding: 16px 34px;
  font: 700 30px Karantina;
}`,js:"window.seek = (t) => {\n  const s = spring(t - 0.6);            // \u05E7\u05E4\u05D9\u05E5 \u05E9\u05DE\u05EA\u05D7\u05D9\u05DC \u05D1-0.6 \u05E9\u05E0\u05F3\n  go.style.transform = `scale(${0.4 + 0.6 * s})`;\n  go.style.rotate = `${(1 - s) * -8}deg`;\n};"};function x(a){a.classList.add("layers");let l=o("div",{class:"seg-row",role:"group","aria-label":"\u05E9\u05DB\u05D1\u05D5\u05EA"},`
    <label class="chk"><input type="checkbox" data-l="html" checked disabled> HTML</label>
    <label class="chk"><input type="checkbox" data-l="css" checked> CSS</label>
    <label class="chk"><input type="checkbox" data-l="js" checked> JS</label>`),r=o("div",{class:"layers-view"},'<button type="button" class="layers-btn" tabindex="-1">\u05D4\u05EA\u05D7\u05DC \u05D0\u05D9\u05DE\u05D5\u05DF</button>'),c=o("pre",{class:"layers-code",dir:"ltr"});a.append(l,r,c);let e=r.querySelector("button"),s={html:!0,css:!0,js:!0},n=()=>{c.textContent=["html","css","js"].filter(t=>s[t]).map(t=>`/* ${t.toUpperCase()} */
${h[t]}`).join(`

`)},d=0,i=t=>{if(d=t,e.classList.toggle("styled",s.css),!s.js){e.style.transform="",e.style.rotate="";return}let p=u(t-.6,11,.55),y=g(t,[[0,1],[2.4,.9],[2.55,1]],34,.6);e.style.transform=`scale(${(.4+.6*b(p,0,1.4))*y})`,e.style.rotate=`${(1-p)*-8}deg`};return l.addEventListener("change",t=>{s[t.target.dataset.l]=t.target.checked,n(),i(d)}),n(),{dur:4,render:i}}export{x as mount};

import{f as o}from"./chunk-IGBYREXX.js";import{a as g,h as y,i as h}from"./chunk-WBFZVAMR.js";import{a as u,b as e}from"./chunk-Q3A6M5XP.js";import"./chunk-KUFADR53.js";var k={html:`<button id="go">${e("\u05D4\u05EA\u05D7\u05DC \u05D0\u05D9\u05DE\u05D5\u05DF","Start workout")}</button>`,css:`#go {
  background: #FF8F3A;      /* ${e("\u05DB\u05EA\u05D5\u05DD \u05E4\u05E0\u05D9\u05E7\u05E1","phoenix orange")} */
  color: #12163F;           /* ${e("\u05E0\u05D9\u05D9\u05D1\u05D9","navy")} */
  border: 0;
  border-radius: 999px;     /* ${e("\u05D2\u05DC\u05D5\u05DC\u05D4","a pill")} */
  padding: 16px 34px;
  font: ${u?"400 30px Anton":"700 30px Karantina"};
}`,js:`window.seek = (t) => {
  const s = spring(t - 0.6);            // ${e("\u05E7\u05E4\u05D9\u05E5 \u05E9\u05DE\u05EA\u05D7\u05D9\u05DC \u05D1-0.6 \u05E9\u05E0\u05F3","a spring that starts at 0.6 s")}
  go.style.transform = \`scale(\${0.4 + 0.6 * s})\`;
  go.style.rotate = \`\${(1 - s) * -8}deg\`;
};`};function j(r){r.classList.add("layers");let l=o("div",{class:"seg-row",role:"group","aria-label":e("\u05E9\u05DB\u05D1\u05D5\u05EA","Layers")},`
    <label class="chk"><input type="checkbox" data-l="html" checked disabled> HTML</label>
    <label class="chk"><input type="checkbox" data-l="css" checked> CSS</label>
    <label class="chk"><input type="checkbox" data-l="js" checked> JS</label>`),n=o("div",{class:"layers-view"},`<button type="button" class="layers-btn" tabindex="-1">${e("\u05D4\u05EA\u05D7\u05DC \u05D0\u05D9\u05DE\u05D5\u05DF","Start workout")}</button>`),c=o("pre",{class:"layers-code",dir:"ltr"});r.append(l,n,c);let s=n.querySelector("button"),a={html:!0,css:!0,js:!0},d=()=>{c.textContent=["html","css","js"].filter(t=>a[t]).map(t=>`/* ${t.toUpperCase()} */
${k[t]}`).join(`

`)},i=0,p=t=>{if(i=t,s.classList.toggle("styled",a.css),!a.js){s.style.transform="",s.style.rotate="";return}let b=y(t-.6,11,.55),m=h(t,[[0,1],[2.4,.9],[2.55,1]],34,.6);s.style.transform=`scale(${(.4+.6*g(b,0,1.4))*m})`,s.style.rotate=`${(1-b)*-8}deg`};return l.addEventListener("change",t=>{a[t.target.dataset.l]=t.target.checked,d(),p(i)}),d(),{dur:4,render:p}}export{j as mount};

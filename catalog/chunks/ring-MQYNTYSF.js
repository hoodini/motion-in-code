import{a as c,h as d}from"./chunk-WBFZVAMR.js";import{b as i}from"./chunk-Q3A6M5XP.js";import"./chunk-KUFADR53.js";var t=92,e=2*Math.PI*t;function x(r){r.classList.add("ring"),r.innerHTML=`<div class="ring-wrap"><svg viewBox="0 0 240 240" class="ring-svg" aria-hidden="true">
      <defs><linearGradient id="rgF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC74E"/><stop offset=".5" stop-color="#FF8F3A"/><stop offset="1" stop-color="#F56B49"/></linearGradient></defs>
      <circle cx="120" cy="120" r="${t}" fill="none" stroke="rgba(18,22,63,.1)" stroke-width="22"/>
      <circle class="ring-guide" cx="120" cy="120" r="${t}" fill="none" stroke="#2C78D2" stroke-width="2" stroke-dasharray="6 8"/>
      <circle class="ring-arc" cx="120" cy="120" r="${t}" fill="none" stroke="url(#rgF)" stroke-width="22" stroke-linecap="round" transform="rotate(-90 120 120)" stroke-dasharray="${e.toFixed(1)}" stroke-dashoffset="${e.toFixed(1)}"/>
    </svg><div class="ring-mid"><b>0%</b><span>${i("\u05DE\u05D4\u05D9\u05E2\u05D3 \u05D4\u05E9\u05D1\u05D5\u05E2\u05D9","of weekly goal")}</span></div></div>
    <pre class="ring-read" dir="ltr"></pre>
    <div class="ctrl-row"><label class="chk"><input type="checkbox" class="ring-show"> ${i("\u05D4\u05E8\u05D0\u05D5 \u05D0\u05EA \u05E7\u05D5 \u05D4\u05DE\u05EA\u05D0\u05E8 \u05D4\u05DE\u05DC\u05D0","Show the full outline")}</label></div>`;let a=r.querySelector(".ring-arc"),l=r.querySelector(".ring-mid b"),f=r.querySelector(".ring-read");return r.querySelector(".ring-show").addEventListener("change",o=>r.classList.toggle("guide",o.target.checked)),{dur:4,render(o){let s=.78*c(d(o-.4,6,.85),0,1.02),n=e*(1-s);a.setAttribute("stroke-dashoffset",n.toFixed(1)),l.textContent=Math.round(s*100)+"%",f.textContent=`circumference = 2\u03C0 \xD7 ${t} = ${e.toFixed(1)} px
stroke-dasharray  = ${e.toFixed(1)}
stroke-dashoffset = ${e.toFixed(1)} \xD7 (1 \u2212 ${s.toFixed(2)}) = ${n.toFixed(1)}`}}}export{x as mount};

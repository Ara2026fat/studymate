/* StudyMate — مدرّس MATH 105: محرك التمارين + واجهة تُركَّب داخل أي مضيف.
   المصدر الوحيد لكلا النسختين (داخل التطبيق والمستقلة). */
window.Math105=(function(){
'use strict';

/* ================= محرك التمارين: لا يعتمد على الصفحة ================= */
const tex=String.raw;
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[ri(0,a.length-1)];
const nz=(a,b)=>{let v;do v=ri(a,b);while(v===0);return v};
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const V=v=>a=>(a===1?'':a)+v;
const K=a=>String(a);
const P=n=>n<0?`(${n})`:`${n}`;
function poly(ts){let s='';for(const [c,f] of ts){if(!c)continue;const body=f(Math.abs(c));if(s==='')s=(c<0?'-':'')+body;else s+=(c<0?' - ':' + ')+body;}return s||'0';}
function fr(n,d){const g=gcd(n,d)||1;n/=g;d/=g;if(d<0){n=-n;d=-d}return {n,d,str:d===1?`${n}`:`${n}/${d}`,tex:d===1?`${n}`:`${n<0?'-':''}\\frac{${Math.abs(n)}}{${d}}`};}
const W=o=>/[\u0600-\u06FF$]/.test(o)?o:'$'+o+'$';
function mcq(opts,ci){const idx=opts.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=ri(0,i);[idx[i],idx[j]]=[idx[j],idx[i]];}return {opts:idx.map(i=>W(opts[i])),ci:idx.indexOf(ci),map:idx};}
const sg=n=>n<0?`-${-n}`:`+${n}`;

/* ---------- مفسّر التعابير ---------- */
const FUNCS={sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),
  ln:Math.log,exp:Math.exp,sqrt:Math.sqrt,abs:Math.abs,atan:Math.atan,asin:Math.asin,acos:Math.acos,arctan:Math.atan,arcsin:Math.asin,arccos:Math.acos};
const WORDS=['arctan','arcsin','arccos','sqrt','atan','asin','acos','sin','cos','tan','sec','csc','cot','exp','abs','inf','pi','ln','x','e'];
function normalize(s){
  return String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/²/g,'^2').replace(/³/g,'^3')
   .replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/∞/g,'inf').replace(/[،؛;]/g,',').replace(/π/g,'pi')
   .replace(/√\s*\(/g,'sqrt(').replace(/√\s*([a-zA-Z0-9.]+)/g,'sqrt($1)').trim();
}
function tokenize(s){
  const out=[];const re=/\s*(?:(\d+\.?\d*|\.\d+)|([a-zA-Z]+)|(.))/gy;let m;
  while(re.lastIndex<s.length&&(m=re.exec(s))){
    if(m[1]!==undefined)out.push({t:'n',v:parseFloat(m[1])});
    else if(m[2]){let w=m[2];while(w){const hit=WORDS.find(k=>w.startsWith(k));if(!hit)throw new Error('رمز غير مفهوم: '+m[2]);out.push({t:'i',v:hit});w=w.slice(hit.length);}}
    else if(m[3]!==undefined){if(/\s/.test(m[3]))continue;out.push({t:'o',v:m[3]});}
  }
  return out;
}
function compile(src){
  const tk=tokenize(normalize(src));let p=0;
  const peek=()=>tk[p];const eat=()=>tk[p++];
  const isOp=c=>peek()&&peek().t==='o'&&peek().v===c;
  function expr(){let l=term();while(isOp('+')||isOp('-')){const o=eat().v;const r=term();const a=l;l=o==='+'?x=>a(x)+r(x):x=>a(x)-r(x);}return l;}
  function startsAtom(){const t=peek();return t&&(t.t==='n'||t.t==='i'||(t.t==='o'&&t.v==='('));}
  function term(){let l=unary();for(;;){if(isOp('*')){eat();const r=unary();const a=l;l=x=>a(x)*r(x);}else if(isOp('/')){eat();const r=unary();const a=l;l=x=>a(x)/r(x);}else if(startsAtom()){const r=unary();const a=l;l=x=>a(x)*r(x);}else break;}return l;}
  function unary(){if(isOp('-')){eat();const u=unary();return x=>-u(x);}if(isOp('+')){eat();return unary();}return power();}
  function power(){const b=atom();if(isOp('^')){eat();const e=unary();return x=>Math.pow(b(x),e(x));}return b;}
  function atom(){const t=eat();if(!t)throw new Error('التعبير ناقص');
    if(t.t==='n'){const v=t.v;return()=>v;}
    if(t.t==='o'&&t.v==='('){const e=expr();if(!isOp(')'))throw new Error('قوس ناقص');eat();return e;}
    if(t.t==='i'){
      if(FUNCS[t.v]){if(!isOp('('))throw new Error('اكتب '+t.v+' مع أقواس مثل '+t.v+'(x)');eat();const e=expr();if(!isOp(')'))throw new Error('قوس ناقص');eat();const f=FUNCS[t.v];return x=>f(e(x));}
      if(t.v==='x')return x=>x;if(t.v==='e')return()=>Math.E;if(t.v==='pi')return()=>Math.PI;if(t.v==='inf')return()=>Infinity;
    }
    throw new Error('رمز غير متوقع');}
  const f=expr();if(p<tk.length)throw new Error('جزء زائد في الكتابة');return f;
}
const DEF=[0.37,0.81,1.29,1.77,2.31,-0.44,-1.16];
const POS=[0.4,0.9,1.4,2.1,2.9];
const close=(a,b,t=1e-6)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));

function grade(p,raw){
  const r=grade0(p,raw);
  if(!r||r.ok!==false||r.err)return r;
  if(p.kind==='mcq'){const t=p.mtrap&&p.mtrap[raw];return t?{ok:false,trap:t}:r}
  for(const t of p.traps||[]){
    let hit=false;
    try{ if(p.kind==='list')hit=grade0({...p,list:t.list},raw).ok; else if(p.kind==='num'){const v=compile(raw)(0),a=compile(t.ans)(0);hit=v===a||(isFinite(a)&&isFinite(v)&&close(a,v))} else hit=grade0({...p,ans:t.ans,traps:null},raw).ok }catch(e){}
    if(hit)return {ok:false,trap:t.msg};
  }
  return r;
}
function grade0(p,raw){
  if(p.kind==='mcq')return {ok:raw===p.ci};
  if(p.kind==='list'){return gradeList(p,raw)}
  let F;try{F=compile(raw)}catch(e){return {err:e.message}}
  const A=p.kind==='expr'?compile(p.ans):null;
  if(p.kind==='num'){const a=compile(p.ans)(0),v=F(0);if(Number.isNaN(v))return {err:'لا يمكن حساب ما كتبته'};return {ok:(a===v)||(isFinite(a)&&isFinite(v)&&close(a,v))};}
  return gradeExpr(p,F,A);
}
function gradeList(p,raw){
  {
    const parts=normalize(raw).split(/[,\s]+و?\s*/).filter(Boolean);let vals;
    try{vals=parts.map(s=>compile(s)(0))}catch(e){return {err:e.message}}
    if(vals.some(Number.isNaN))return {err:'اكتب الأعداد مفصولة بفواصل'};
    const want=p.list.slice().sort((a,b)=>a-b);vals.sort((a,b)=>a-b);
    return {ok:want.length===vals.length&&want.every((w,i)=>close(w,vals[i]))};
  }
}
function gradeExpr(p,F,A){
  const pts=(p.pts||DEF).filter(x=>{const a=A(x);return isFinite(a)&&Math.abs(a)<1e7});
  if(pts.length<3)return {err:'تعذّر التحقق، حاول كتابة الجواب بصيغة أخرى'};
  const sv=pts.map(F);if(sv.some(v=>!isFinite(v)))return {ok:false};
  if(p.constant){const d=pts.map((x,i)=>sv[i]-A(x));return {ok:d.every(v=>close(v,d[0],1e-5))};}
  return {ok:pts.every((x,i)=>close(sv[i],A(x),1e-5))};
}

/* ---------- المولّدات ---------- */
const GENS={};
const def=(id,st,name,make)=>{GENS[id]={id,st,name,make};};
const dn=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);

/* المحطة 1: الدوال */
def('inv',1,'الدالة العكسية',L=>{
  const a=pick(L>1?[2,3,4,5,-2,-3]:[2,3,4]),b=nz(-9,9);const f=poly([[a,V('x')],[b,K]]);
  return {kind:'expr',q:tex`أوجد $f^{-1}(x)$ للدالة $f(x)=${f}$.`,ans:`(x-(${b}))/(${a})`,disp:tex`\frac{x${b<0?'+'+(-b):'-'+b}}{${a}}`,
   hints:['اكتب y=f(x) ثم حلّ المعادلة لإيجاد x بدلالة y.','بعد عزل x بدّل x و y.'],
   sol:tex`$y=${f}\Rightarrow x=\frac{y${b<0?'+'+(-b):'-'+b}}{${a}}$ ثم نبدّل: $f^{-1}(x)=\frac{x${b<0?'+'+(-b):'-'+b}}{${a}}$.`,
   truth:()=>{const g=compile(`(x-(${b}))/(${a})`);return [-2,0.5,3].every(t=>close(a*g(t)+b,t))}};});
def('comp',1,'تركيب الدوال',L=>{
  const a=ri(-5,6),b=nz(-3,4),c=ri(-5,5),k=ri(-2,3);const g=b*k-c,val=g*g+a;
  return {kind:'num',q:tex`إذا كانت $f(x)=${poly([[1,V('x^2')],[a,K]])}$ و$g(x)=${poly([[b,V('x')],[-c,K]])}$ فاحسب $f(g(${k}))$.`,ans:`${val}`,disp:`${val}`,
   hints:['ابدأ من الداخل: احسب g أولًا.',`$g(${k})=${g}$`],sol:tex`$g(${k})=${g}$ ثم $f(${g})=${P(g)}^2${a<0?'-':'+'}${Math.abs(a)}=${val}$.`,
   truth:()=>((b*k-c)**2+a)===val};});
def('shift',1,'الإزاحة والتمدد',L=>{
  const h=nz(-5,5),k=nz(-5,5);const o=[tex`(${h},${k})`,tex`(${-h},${k})`,tex`(${h},${-k})`,tex`(${-h},${-k})`];const m=mcq(o,0);
  return {kind:'mcq',q:tex`رأس القطع المكافئ $y=(x${h<0?'+'+(-h):'-'+h})^2${k<0?'-'+(-k):'+'+k}$ هو:`,opts:m.opts,ci:m.ci,mtrap:{[m.map.indexOf(1)]:'الإشارة داخل القوس تعاكس اتجاه الإزاحة: (x−h) تعني h موجبة.'},disp:o[0],
   hints:['الصورة (x−h)²+k ترفع المنحنى k وحدة وتحرّكه h يمينًا.','الإزاحة الأفقية تعاكس الإشارة داخل القوس.'],
   sol:tex`$(x-h)^2+k$ رأسه $(h,k)$. الإشارة داخل القوس تعاكس الاتجاه، فالرأس $${o[0]}$.`,
   truth:()=>{const f=x=>(x-h)**2+k;return f(h)===k&&f(h+1)>k&&f(h-1)>k}};});
const REF={sin:{30:['1/2',tex`\frac12`],45:['sqrt(2)/2',tex`\frac{\sqrt2}{2}`],60:['sqrt(3)/2',tex`\frac{\sqrt3}{2}`]},
 cos:{30:['sqrt(3)/2',tex`\frac{\sqrt3}{2}`],45:['sqrt(2)/2',tex`\frac{\sqrt2}{2}`],60:['1/2',tex`\frac12`]},
 tan:{30:['1/sqrt(3)',tex`\frac{1}{\sqrt3}`],45:['1',tex`1`],60:['sqrt(3)',tex`\sqrt3`]}};
def('trigval',1,'قيم الزوايا الخاصة',L=>{
  const fn=pick(L>1?['sin','cos','tan']:['sin','cos']),deg=pick(L>1?[120,135,150,210,225,240,300,315,330]:[30,45,60,120,135,150]);
  const r=deg%180<=90?deg%180:180-deg%180, ref=REF[fn][r];const val=Math[fn](deg*Math.PI/180);const neg=val<0;
  const g=gcd(deg,180);const ang=tex`\frac{${deg/g}\pi}{${180/g}}`;
  return {kind:'num',q:tex`احسب $${'\\'+fn}\left(${ang}\right)$ بالقيمة الدقيقة (مثل sqrt(3)/2).`,ans:(neg?'-':'')+'('+ref[0]+')',disp:(neg?'-':'')+ref[1],
   hints:[`الزاوية ${deg}° زاويتها المرجعية ${r}°.`,'حدّد إشارة الدالة من الربع (ASTC).'],
   sol:tex`المرجعية $${r}^\circ$ و$${'\\'+fn}${r}^\circ=${ref[1]}$، والإشارة ${neg?'سالبة':'موجبة'} في هذا الربع. الجواب $${neg?'-':''}${ref[1]}$.`,
   truth:()=>close(compile((neg?'-':'')+'('+ref[0]+')')(0),val)};});
def('loglaw',1,'قوانين اللوغاريتم',L=>{
  const b=pick([2,3,5]),p=ri(1,4),q=ri(1,4),r=ri(1,3);
  return {kind:'num',q:tex`احسب $\log_{${b}}${b**p}+\log_{${b}}${b**q}-\log_{${b}}${b**r}$.`,ans:`${p+q-r}`,disp:`${p+q-r}`,
   hints:[`اكتب كل عدد كقوة للعدد ${b}.`,tex`$\log_a a^k=k$`],sol:tex`$${p}+${q}-${r}=${p+q-r}$.`,truth:()=>b**p>0};});

/* المحطة 2: النهايات */
def('lim_factor',2,'نهايات بالتحليل',L=>{
  const m=nz(-6,6);let n;do n=nz(-6,6);while(n===m);const b=-(m+n),c=m*n;const f=x=>(x*x+b*x+c)/(x-m);
  return {kind:'num',q:tex`$\lim_{x\to ${m}}\dfrac{${poly([[1,V('x^2')],[b,V('x')],[c,K]])}}{${poly([[1,V('x')],[-m,K]])}}$`,ans:`${m-n}`,disp:`${m-n}`,
   hints:['بالتعويض يظهر 0/0، فحلّل البسط.',`البسط يساوي $(x-${P(m)})(x-${P(n)})$.`],
   sol:tex`$\frac{(x-${P(m)})(x-${P(n)})}{x-${P(m)}}=x-${P(n)}\to ${m}-${P(n)}=${m-n}$.`,truth:()=>close(f(m+1e-6),m-n,1e-4)&&close(f(m-1e-6),m-n,1e-4)};});
def('lim_rat',2,'نهايات بالمرافق',L=>{
  const s=pick([2,3,4]),d=ri(1,8),a=s*s-d;const f=x=>(Math.sqrt(x+d)-s)/(x-a);
  return {kind:'num',q:tex`$\lim_{x\to ${a}}\dfrac{\sqrt{x+${d}}-${s}}{${poly([[1,V('x')],[-a,K]])}}$`,ans:`1/${2*s}`,disp:tex`\frac1{${2*s}}`,
   hints:['اضرب البسط والمقام في المرافق $\\sqrt{x+'+d+'}+'+s+'$.','البسط يصبح $(x+'+d+')-'+s*s+'$ وهو يساوي $x-'+P(a)+'$.'],
   sol:tex`بعد الضرب في المرافق: $\frac{1}{\sqrt{x+${d}}+${s}}\to\frac1{${2*s}}$.`,truth:()=>close(f(a+1e-6),1/(2*s),1e-4)};});
def('lim_inf',2,'نهايات عند اللانهاية',L=>{
  const kind=pick(L===1?['eq']:L===2?['eq','low']:['eq','low','high']);const a=nz(-6,6),c=nz(-6,6),b=ri(-5,5),d=ri(-5,5);
  if(kind==='eq'){const f=x=>(a*x*x+b*x)/(c*x*x+d),R=fr(a,c);
    return {kind:'num',q:tex`$\lim_{x\to\infty}\dfrac{${poly([[a,V('x^2')],[b,V('x')]])}}{${poly([[c,V('x^2')],[d,K]])}}$`,ans:R.str,disp:R.tex,
    hints:['اقسم البسط والمقام على أعلى قوة في المقام.','الدرجتان متساويتان: النهاية نسبة المعاملين القائدين.'],sol:tex`نسبة المعاملين القائدين $\frac{${a}}{${c}}=${R.tex}$.`,truth:()=>close(f(1e7),a/c,1e-4)};}
  if(kind==='low'){const f=x=>(a*x+b)/(c*x*x+d);
    return {kind:'num',q:tex`$\lim_{x\to\infty}\dfrac{${poly([[a,V('x')],[b,K]])}}{${poly([[c,V('x^2')],[d,K]])}}$`,ans:'0',disp:'0',
    hints:['قارن درجة البسط بدرجة المقام.','درجة البسط أصغر.'],sol:tex`درجة البسط (1) أصغر من درجة المقام (2) فالنهاية $0$.`,truth:()=>Math.abs(f(1e7))<1e-5};}
  const f=x=>(a*x**3+b)/(c*x*x+d),pos=a/c>0;
  return {kind:'num',q:tex`$\lim_{x\to\infty}\dfrac{${poly([[a,V('x^3')],[b,K]])}}{${poly([[c,V('x^2')],[d,K]])}}$ (اكتب inf أو -inf)`,ans:pos?'inf':'-inf',disp:pos?tex`+\infty`:tex`-\infty`,
   hints:['قارن الدرجتين.','درجة البسط أكبر، فالنهاية لا نهائية. الإشارة من نسبة المعاملين.'],sol:tex`درجة البسط (3) أكبر من درجة المقام (2)، وإشارة $\frac{${a}}{${c}}$ ${pos?'موجبة':'سالبة'}، فالنهاية $${pos?'+':'-'}\infty$.`,
   truth:()=>(f(1e6)>1e3)===pos};});
def('lim_trig',2,'نهايات مثلثية',L=>{
  const a=ri(2,7);let b;do b=ri(2,7);while(b===a);const t=pick(['s/x','s/s','t/x']);
  if(t==='s/x'){const f=x=>Math.sin(a*x)/(b*x),R=fr(a,b);return {kind:'num',q:tex`$\lim_{x\to0}\dfrac{\sin ${a}x}{${b}x}$`,ans:R.str,disp:R.tex,hints:['استخدم $\\lim \\frac{\\sin u}{u}=1$.',`اجعل داخل $\\sin$ ومقامه ${a}x.`],sol:tex`$\frac{\sin ${a}x}{${b}x}=\frac{${a}}{${b}}\cdot\frac{\sin ${a}x}{${a}x}\to\frac{${a}}{${b}}$.`,truth:()=>close(f(1e-6),a/b,1e-4)};}
  if(t==='s/s'){const f=x=>Math.sin(a*x)/Math.sin(b*x),R=fr(a,b);return {kind:'num',q:tex`$\lim_{x\to0}\dfrac{\sin ${a}x}{\sin ${b}x}$`,ans:R.str,disp:R.tex,hints:['اقسم البسط والمقام على x.','$\\frac{\\sin ax}{x}\\to a$.'],sol:tex`$\frac{\sin ${a}x}{\sin ${b}x}=\frac{\frac{\sin ${a}x}{x}}{\frac{\sin ${b}x}{x}}\to\frac{${a}}{${b}}$.`,truth:()=>close(f(1e-6),a/b,1e-4)};}
  const f=x=>Math.tan(a*x)/x;return {kind:'num',q:tex`$\lim_{x\to0}\dfrac{\tan ${a}x}{x}$`,ans:`${a}`,disp:`${a}`,hints:['اكتب $\\tan=\\frac{\\sin}{\\cos}$.','$\\cos 0=1$.'],sol:tex`$\frac{\sin ${a}x}{x\cos ${a}x}\to ${a}\cdot1=${a}$.`,truth:()=>close(f(1e-6),a,1e-4)};});
def('lim_side',2,'نهايات من جهة واحدة',L=>{
  let a,b,p;do{a=ri(-4,4);b=ri(1,5);p=ri(-5,5);}while(a+b===0||p===a);
  const side=pick(['+','-','both']);const s=Math.sign((p-a)*(a+b));let ans;
  if(side==='both')ans=2;else ans=((side==='+')===(s>0))?0:1; // 0:+inf 1:-inf 2:dne
  const m=mcq([tex`+\infty`,tex`-\infty`,'غير موجودة'],ans);const f=x=>(p-x)/((x-a)*(x+b));
  const lim=side==='both'?tex`\lim_{x\to ${a}}`:tex`\lim_{x\to ${a}^${side}}`;
  return {kind:'mcq',q:tex`$${lim}\dfrac{${poly([[-1,V('x')],[p,K]])}}{(${poly([[1,V('x')],[-a,K]])})(${poly([[1,V('x')],[b,K]])})}$`,opts:m.opts,ci:m.ci,disp:['$+\\infty$','$-\\infty$','غير موجودة'][ans],
   hints:['عوّض في كل عامل ما عدا العامل الذي يصبح صفرًا.',tex`قرب $x=${a}$ يشبه المقدار $\frac{${(p-a)}}{${a+b}}\cdot\frac{1}{x-${P(a)}}$.`],
   sol:tex`الإشارة تُحدَّد من $\frac{${p-a}}{${a+b}}$ ومن إشارة $x-${P(a)}$ في الجهة المطلوبة. إذا اختلفت الجهتان فالنهاية غير موجودة.`,
   truth:()=>{const r=f(a+1e-7),l=f(a-1e-7);if(side==='both')return r*l<0;return (side==='+'?r:l)>0===(ans===0)}};});
def('cont_k',2,'الاتصال',L=>{
  const c=pick([1,2]),k=nz(-4,5),p=k*c*c-c;
  return {kind:'num',q:tex`الدالة $f(x)=\begin{cases}${poly([[1,V('x')],[p,K]])} & x\lt ${c}\\ kx^2 & x\ge ${c}\end{cases}$ متصلة عند $x=${c}$. أوجد $k$.`,ans:`${k}`,disp:`${k}`,
   hints:['الاتصال يعني تساوي النهاية من اليمين واليسار مع قيمة الدالة.',`عوّض $x=${c}$ في كل فرع وساوِ بينهما.`],
   sol:tex`اليسار: $${c}${sg(p)}=${c+p}$. اليمين: $k\cdot${c*c}$. إذن $${c*c}k=${c+p}$ و$k=${k}$.`,truth:()=>c+p===k*c*c};});

/* المحطة 3: قواعد الاشتقاق */
const TERMS={
 pow:n=>({tex:V(`x^${n}`),f:c=>`(${c})*x^${n}`,d:c=>`(${c*n})*x^${n-1}`,dtex:[c=>c*n,n-1===1?V('x'):V(`x^${n-1}`)]}),
 lin:()=>({tex:V('x'),f:c=>`(${c})*x`,d:c=>`${c}`,dtex:[c=>c,K]}),
 con:()=>({tex:K,f:c=>`(${c})`,d:()=>`0`,dtex:[c=>0,K]}),
 sqrt:()=>({tex:V('\\sqrt{x}'),f:c=>`(${c})*sqrt(x)`,d:c=>`(${c})/(2*sqrt(x))`,dtex:[c=>c,a=>tex`\frac{${a}}{2\sqrt{x}}`]}),
 inv:()=>({tex:a=>tex`\frac{${a}}{x}`,f:c=>`(${c})/x`,d:c=>`(${-c})/x^2`,dtex:[c=>-c,a=>tex`\frac{${a}}{x^2}`]}),
 exp:()=>({tex:V('e^x'),f:c=>`(${c})*e^x`,d:c=>`(${c})*e^x`,dtex:[c=>c,V('e^x')]})};
def('d_power',3,'قاعدة القوى',L=>{
  const types=L===1?['pow','lin','con']:L===2?['pow','lin','sqrt','inv','con']:['pow','sqrt','inv','exp','lin','con'];
  const n=Math.min(types.length,L===1?3:4);const chosen=types.slice().sort(()=>Math.random()-.5).slice(0,n);
  const ts=chosen.map(t=>({c:nz(-6,7),t:TERMS[t](t==='pow'?ri(2,5):0)}));
  const f=ts.map(o=>o.t.f(o.c)).join('+'),d=ts.map(o=>o.t.d(o.c)).join('+');
  const ft=poly(ts.map(o=>[o.c,o.t.tex])),dt=poly(ts.map(o=>[o.t.dtex[0](o.c),o.t.dtex[1]]));
  const F=compile(f),D=compile(d);
  return {kind:'expr',q:tex`اشتق: $f(x)=${ft}$`,ans:d,pts:POS,disp:dt,hints:['اشتق كل حد على حدة، والثابت مشتقته صفر.','اكتب الجذر والكسر كقوى: $\\sqrt x=x^{1/2}$، $\\frac1x=x^{-1}$.'],
   sol:tex`$f'(x)=${dt}$`,truth:()=>POS.every(x=>close(dn(F,x),D(x),1e-5))};});
def('d_product',3,'قاعدة الضرب',L=>{
  const n=ri(1,L+1),a=L===1?1:nz(-3,4);
  const U=pick([{s:`x^${n}`,d:`${n}*x^${n-1}`,t:n===1?'x':`x^${n}`},{s:'e^x',d:'e^x',t:'e^x'}]);
  const Vs=[{s:'sin(x)',d:'cos(x)',t:'\\sin x'},{s:'cos(x)',d:'-sin(x)',t:'\\cos x'}];
  if(U.s!=='e^x')Vs.push({s:'e^x',d:'e^x',t:'e^x'},{s:'ln(x)',d:'1/x',t:'\\ln x'});
  const W=pick(Vs);const f=`${a}*(${U.s})*(${W.s})`,d=`${a}*((${U.d})*(${W.s})+(${U.s})*(${W.d}))`;const F=compile(f),D=compile(d);
  return {kind:'expr',q:tex`اشتق: $f(x)=${a===1?'':a===-1?'-':a}${U.t}\,${W.t}$`,ans:d,traps:[{ans:`${a}*((${U.d})*(${W.d}))`,msg:"مشتقة الضرب ليست حاصل ضرب المشتقتين. القاعدة: (uv)′ = u′v + uv′."}],pts:POS,disp:tex`${a===1?'':a}\left(${U.t}\right)'${W.t}+\dots`,
   hints:["قاعدة الضرب: $(uv)'=u'v+uv'$.",'اشتق كل عامل منفصلًا ثم جمّع.'],
   sol:tex`$u=${U.t},\ v=${W.t}$ فتكون $f'=${a===1?'':a}\,(u'v+uv')$.`,truth:()=>POS.every(x=>close(dn(F,x),D(x),1e-5))};});
def('d_quot',3,'قاعدة القسمة',L=>{
  const a=ri(1,5),b=pick([-4,-3,-2,3,4,5,6]),n=ri(1,3);
  const forms=[
   {t:tex`\frac{${poly([[1,V('x^2')],[a,K]])}}{${poly([[1,V('x')],[-b,K]])}}`,f:`(x^2+(${a}))/(x-(${b}))`,d:`(x^2+(${-2*b})*x+(${-a}))/(x-(${b}))^2`,pts:DEF},
   {t:tex`\frac{\sin x}{x^${n}}`,f:`sin(x)/x^${n}`,d:`(x*cos(x)-${n}*sin(x))/x^${n+1}`,pts:POS},
   {t:tex`\frac{e^x}{${poly([[1,V('x^2')],[a,K]])}}`,f:`e^x/(x^2+${a})`,d:`e^x*(x^2-2*x+${a})/(x^2+${a})^2`,pts:DEF},
   {t:tex`\frac{x}{${poly([[1,V('x^2')],[a,K]])}}`,f:`x/(x^2+${a})`,d:`(${a}-x^2)/(x^2+${a})^2`,pts:DEF},
   {t:tex`\frac{\ln x}{x}`,f:`ln(x)/x`,d:`(1-ln(x))/x^2`,pts:POS}];
  const o=L===1?forms[pick([0,3])]:pick(forms);const F=compile(o.f),D=compile(o.d);
  return {kind:'expr',q:tex`اشتق: $f(x)=${o.t}$`,ans:o.d,pts:o.pts,disp:'(مشتقة البسط × المقام − البسط × مشتقة المقام) ÷ مربع المقام',
   hints:["$\\left(\\frac uv\\right)'=\\frac{u'v-uv'}{v^2}$",'اكتب u و v ثم اشتقهما قبل التعويض.'],sol:tex`نطبّق $\frac{u'v-uv'}{v^2}$ ثم نبسّط البسط.`,
   truth:()=>o.pts.every(x=>{const f=F(x);return !isFinite(f)||Math.abs(f)>1e5||close(dn(F,x,1e-6),D(x),1e-4)})};});
def('d_chain',3,'قاعدة السلسلة',L=>{
  const a=ri(1,5),n=ri(2,5),k=ri(2,5);
  const all=[
   [1,tex`(${poly([[1,V('x^2')],[a,K]])})^{${n}}`,`(x^2+${a})^${n}`,`${2*n}*x*(x^2+${a})^${n-1}`,`${n}*(x^2+${a})^${n-1}`],
   [1,tex`\sin ${k}x`,`sin(${k}*x)`,`${k}*cos(${k}*x)`,`cos(${k}*x)`],
   [1,tex`(${k}x+${a})^{${n}}`,`(${k}*x+${a})^${n}`,`${n*k}*(${k}*x+${a})^${n-1}`,`${n}*(${k}*x+${a})^${n-1}`],
   [2,tex`\cos(x^2)`,`cos(x^2)`,`-2*x*sin(x^2)`,`-sin(x^2)`],
   [2,tex`e^{${k}x}`,`e^(${k}*x)`,`${k}*e^(${k}*x)`,`e^(${k}*x)`],
   [2,tex`\ln(x^2+${a})`,`ln(x^2+${a})`,`2*x/(x^2+${a})`,`1/(x^2+${a})`],
   [3,tex`e^{x^2+${a}}`,`e^(x^2+${a})`,`2*x*e^(x^2+${a})`,`e^(x^2+${a})`],
   [3,tex`\sqrt{x^2+${a}}`,`sqrt(x^2+${a})`,`x/sqrt(x^2+${a})`,`1/(2*sqrt(x^2+${a}))`],
   [3,tex`\sin^2 x`,`sin(x)^2`,`2*sin(x)*cos(x)`,`2*sin(x)`],
   [3,tex`\tan(${k}x)`,`tan(${k}*x)`,`${k}*sec(${k}*x)^2`,`sec(${k}*x)^2`]];
  const o=pick(all.filter(r=>r[0]<=L));const F=compile(o[2]),D=compile(o[3]);const pts=[0.11,0.19,0.27,0.34,0.41];
  return {kind:'expr',q:tex`اشتق: $f(x)=${o[1]}$`,ans:o[3],traps:[{ans:o[4],msg:'يبدو أنك اشتققت الدالة الخارجية فقط. لا تنسَ ضرب الناتج في مشتقة الدالة الداخلية.'}],pts:o[1].includes('tan')?pts:POS,disp:'مشتقة الخارجية × مشتقة الداخلية',
   hints:['حدّد الدالة الخارجية والدالة الداخلية.','اشتق الخارجية وأبقِ الداخلية كما هي، ثم اضرب في مشتقة الداخلية.'],
   sol:tex`نشتق الخارجية ونضرب في مشتقة ما بداخلها.`,truth:()=>POS.every(x=>close(dn(F,x,1e-6),D(x),1e-4))};});
def('d_trig',3,'مشتقات مثلثية',L=>{
  const T={tan:['tan(x)','sec(x)^2',tex`\tan x`],sec:['sec(x)','sec(x)*tan(x)',tex`\sec x`],cot:['cot(x)','-csc(x)^2',tex`\cot x`],csc:['csc(x)','-csc(x)*cot(x)',tex`\csc x`]};
  const ks=Object.keys(T);const k1=pick(ks);let k2;do k2=pick(ks);while(k2===k1);const a=nz(-4,5),b=nz(-4,5);
  const f=`(${a})*${T[k1][0]}+(${b})*${T[k2][0]}`,d=`(${a})*(${T[k1][1]})+(${b})*(${T[k2][1]})`;const F=compile(f),D=compile(d);const pts=[0.35,0.6,0.85,1.1,1.3];
  return {kind:'expr',q:tex`اشتق: $f(x)=${poly([[a,V(T[k1][2])],[b,V(T[k2][2])]])}$`,ans:d,pts,disp:'',
   hints:['تذكّر: $(\\tan)\'=\\sec^2$، $(\\sec)\'=\\sec\\tan$، $(\\cot)\'=-\\csc^2$، $(\\csc)\'=-\\csc\\cot$.','الدوال التي تبدأ بـ co مشتقتها سالبة.'],
   sol:tex`نطبّق جدول مشتقات الدوال المثلثية على كل حد.`,truth:()=>pts.every(x=>close(dn(F,x,1e-6),D(x),1e-4))};});
def('d_invtrig',3,'مشتقات عكس المثلثية',L=>{
  const a=pick([2,3,5]),t=pick(['atan','asin','acos']);
  const m={atan:[tex`\tan^{-1}(${a}x)`,`atan(${a}*x)`,`${a}/(1+${a*a}*x^2)`],asin:[tex`\sin^{-1}(${a}x)`,`asin(${a}*x)`,`${a}/sqrt(1-${a*a}*x^2)`],acos:[tex`\cos^{-1}(${a}x)`,`acos(${a}*x)`,`-${a}/sqrt(1-${a*a}*x^2)`]}[t];
  const pts=[0.1,0.2,0.3,0.45,0.6].map(v=>v/a);const F=compile(m[1]),D=compile(m[2]);
  return {kind:'expr',q:tex`اشتق: $f(x)=${m[0]}$`,ans:m[2],traps:[{ans:m[2].replace(/^(-?)\d+\//,'$11/'),msg:'نسيت ضرب الناتج في مشتقة الداخلية.'}],pts,disp:'',hints:["$(\\tan^{-1}u)'=\\frac{u'}{1+u^2}$ و$(\\sin^{-1}u)'=\\frac{u'}{\\sqrt{1-u^2}}$.",`هنا $u=${a}x$ و$u'=${a}$.`],
   sol:tex`نطبّق القاعدة مع $u=${a}x$ ثم نضرب في $u'=${a}$.`,truth:()=>pts.every(x=>close(dn(F,x,1e-6),D(x),1e-4))};});
def('d_log',3,'الاشتقاق اللوغاريتمي',L=>{
  const forms=[[tex`x^x`,'x^x','x^x*(ln(x)+1)'],[tex`x^{2x}`,'x^(2*x)','2*x^(2*x)*(ln(x)+1)'],[tex`x^{\sin x}`,'x^sin(x)'.replace('sin(x)','(sin(x))'),'x^(sin(x))*(cos(x)*ln(x)+sin(x)/x)'],[tex`x^{\sqrt x}`,'x^(sqrt(x))','x^(sqrt(x))*(ln(x)/(2*sqrt(x))+1/sqrt(x))']];
  const o=pick(L===1?forms.slice(0,2):forms);const F=compile(o[1]),D=compile(o[2]);
  return {kind:'expr',q:tex`اشتق بالاشتقاق اللوغاريتمي: $y=${o[0]}$`,ans:o[2],pts:POS,disp:'',hints:['خذ $\\ln$ للطرفين، فيصبح $\\ln y$ = الأس × $\\ln$ الأساس.','اشتق ضمنيًا ثم اضرب في y.'],
   sol:tex`$\ln y$ ثم نشتق: $\frac{y'}{y}=\dots$ ثم $y'=y\cdot(\dots)$.`,truth:()=>POS.every(x=>close(dn(F,x,1e-6),D(x),1e-4))};});

/* المحطة 4: المماس والضمني */
def('tangent',4,'معادلة المماس',L=>{
  const forms=[];
  {const b=nz(-6,6),c=ri(-5,5),x0=ri(-3,4),m=2*x0+b,y0=x0*x0+b*x0+c;forms.push({f:poly([[1,V('x^2')],[b,V('x')],[c,K]]),x0,m,y0,F:x=>x*x+b*x+c});}
  {const a=ri(1,6),x0=ri(-2,3),m=3*x0*x0-a,y0=x0**3-a*x0;forms.push({f:poly([[1,V('x^3')],[-a,V('x')]]),x0,m,y0,F:x=>x**3-a*x});}
  const o=L===1?forms[0]:pick(forms);const line=poly([[o.m,V('x')],[o.y0-o.m*o.x0,K]]);
  return {kind:'expr',q:tex`أوجد معادلة المماس لمنحنى $f(x)=${o.f}$ عند $x=${o.x0}$. اكتب الجواب بدلالة x فقط (مثل 3x-4).`,ans:`${o.m}*(x-(${o.x0}))+(${o.y0})`,disp:`y=${line}`,
   hints:['الميل = $f\'(x_0)$، والنقطة $(x_0,f(x_0))$.','المعادلة: $y-y_0=m(x-x_0)$.'],sol:tex`$f(${o.x0})=${o.y0}$ و$f'(${o.x0})=${o.m}$. المماس: $y=${line}$.`,
   truth:()=>close(dn(o.F,o.x0),o.m,1e-5)&&close(o.F(o.x0),o.y0)};});
def('impl',4,'الاشتقاق الضمني',L=>{
  const kind=pick(L===1?['c']:L===2?['c','h']:['c','h','q']);
  if(kind==='c'){const [x,y,r]=pick([[3,4,5],[5,12,13],[6,8,10],[8,6,10],[4,3,5],[12,5,13]]);const x0=pick([x,-x]),y0=pick([y,-y]);const R=fr(-x0,y0);
    return {kind:'num',q:tex`$x^2+y^2=${r*r}$. أوجد $\dfrac{dy}{dx}$ عند النقطة $(${x0},${y0})$.`,ans:R.str,disp:R.tex,hints:['اشتق الطرفين: $2x+2y\\,y\'=0$.','حلّ لـ $y\'$ ثم عوّض النقطة.'],
     sol:tex`$y'=-\frac{x}{y}=${R.tex}$.`,truth:()=>{const s=Math.sign(y0);const Y=t=>s*Math.sqrt(r*r-t*t);return close(dn(Y,x0),R.n/R.d,1e-4)}};}
  if(kind==='h'){const a=ri(1,4),y0=ri(1,6),R=fr(-y0,a);
    return {kind:'num',q:tex`$xy=${a*y0}$. أوجد $\dfrac{dy}{dx}$ عند النقطة $(${a},${y0})$.`,ans:R.str,disp:R.tex,hints:["اشتق بقاعدة الضرب: $y+x\\,y'=0$.",'حلّ لـ $y\'$.'],sol:tex`$y'=-\frac yx=${R.tex}$.`,truth:()=>close(dn(t=>a*y0/t,a),R.n/R.d,1e-4)};}
  let a,b;do{a=ri(1,3);b=ri(1,3);}while(a+2*b===0);const k=a*a+a*b+b*b,R=fr(-(2*a+b),a+2*b);
  return {kind:'num',q:tex`$x^2+xy+y^2=${k}$. أوجد $\dfrac{dy}{dx}$ عند النقطة $(${a},${b})$.`,ans:R.str,disp:R.tex,hints:["اشتق: $2x+y+x\\,y'+2y\\,y'=0$.",'اجمع حدود $y\'$ في طرف.'],sol:tex`$y'=-\frac{2x+y}{x+2y}=${R.tex}$.`,
   truth:()=>{const F=(x,y)=>x*x+x*y+y*y;const h=1e-6;const fx=(F(a+h,b)-F(a-h,b))/(2*h),fy=(F(a,b+h)-F(a,b-h))/(2*h);return close(-fx/fy,R.n/R.d,1e-4)}};});

/* المحطة 5: تطبيقات المشتقة */
def('crit',5,'الأعداد الحرجة',L=>{
  const r1=ri(-4,4);let r2=r1+2*nz(-3,3);const A=-3*(r1+r2)/2,B=3*r1*r2;const f=x=>x**3+A*x*x+B*x;
  return {kind:'list',q:tex`أوجد الأعداد الحرجة للدالة $f(x)=${poly([[1,V('x^3')],[A,V('x^2')],[B,V('x')]])}$ (افصل بينها بفاصلة).`,list:[r1,r2],ans:`${r1}, ${r2}`,disp:`${r1}, ${r2}`,
   hints:['العدد الحرج حيث $f\'=0$ أو غير موجودة.',`$f'(x)=3x^2${sg(2*A)}x${sg(B)}$، حلّله إلى عاملين.`],sol:tex`$f'(x)=3(x-${P(r1)})(x-${P(r2)})=0$ فالعددان $${r1}$ و$${r2}$.`,
   truth:()=>close(dn(f,r1),0,1e-4)&&close(dn(f,r2),0,1e-4)};});
def('closedint',5,'القيم القصوى على فترة',L=>{
  const c=ri(-5,8),iv=pick([[-1,3],[-1,4],[-2,3],[0,4],[-2,4]]),want=pick(['max','min']);const f=x=>x**3-3*x*x+c;
  const cand=[iv[0],iv[1]].concat([0,2].filter(t=>t>iv[0]&&t<iv[1])),vals=cand.map(f);const ans=want==='max'?Math.max(...vals):Math.min(...vals);
  const inner=[0,2].filter(t=>t>iv[0]&&t<iv[1]).map(f),ansInner=want==='max'?Math.max(...inner):Math.min(...inner);
  return {kind:'num',traps:close(ansInner,ans)?[]:[{ans:`${ansInner}`,msg:'لا تنسَ نهايتَي الفترة: قارن مع قيمة الدالة عند a وb أيضًا.'}],q:tex`أوجد القيمة ${want==='max'?'العظمى':'الصغرى'} المطلقة للدالة $f(x)=x^3-3x^2${sg(c)}$ على $[${iv[0]},${iv[1]}]$.`,ans:`${ans}`,disp:`${ans}`,
   hints:["$f'(x)=3x(x-2)$ فالعددان الحرجان 0 و2.",'احسب $f$ عند الأعداد الحرجة داخل الفترة وعند النهايتين، ثم قارن.'],sol:tex`نحسب القيم عند $${cand.join(',\\ ')}$ فنجد: $${vals.join(',\\ ')}$. ${want==='max'?'الأكبر':'الأصغر'} هو $${ans}$.`,
   truth:()=>{let best=want==='max'?-1e9:1e9;for(let x=iv[0];x<=iv[1]+1e-9;x+=0.001)best=want==='max'?Math.max(best,f(x)):Math.min(best,f(x));return close(best,ans,1e-5)}};});
def('mvt',5,'نظرية القيمة المتوسطة',L=>{
  const t=pick(L===1?['q']:['q','c','t']);
  if(t==='q'){const p=nz(-5,5),q0=ri(-4,4),m=ri(-3,1),n=m+ri(2,6);const f=x=>x*x+p*x+q0,R=fr(m+n,2);
    return {kind:'num',q:tex`أوجد قيمة $c$ في نظرية القيمة المتوسطة للدالة $f(x)=${poly([[1,V('x^2')],[p,V('x')],[q0,K]])}$ على $[${m},${n}]$.`,ans:R.str,disp:R.tex,
     hints:['احسب الميل المتوسط $\\frac{f(b)-f(a)}{b-a}$.',"ثم حلّ $f'(c)=$ الميل المتوسط."],sol:tex`الميل المتوسط $=${m+n+p}$ و$f'(c)=2c${sg(p)}$. إذن $c=${R.tex}$.`,
     truth:()=>close(2*(R.n/R.d)+p,(f(n)-f(m))/(n-m),1e-6)};}
  if(t==='c'){const b=pick([3,6,9]);
    return {kind:'num',q:tex`أوجد القيمة $c\in(0,${b})$ في نظرية القيمة المتوسطة للدالة $f(x)=x^3$ على $[0,${b}]$. اكتب الجواب (مثل 3/sqrt(2)).`,ans:`${b}/sqrt(3)`,disp:tex`\frac{${b}}{\sqrt3}`,
     hints:[`الميل المتوسط $=\\frac{${b**3}-0}{${b}}=${b*b}$.`,`حلّ $3c^2=${b*b}$ واختر الحل الموجب.`],sol:tex`$3c^2=${b*b}\Rightarrow c=\pm\frac{${b}}{\sqrt3}$، والمقبول داخل $(0,${b})$ هو $\frac{${b}}{\sqrt3}$.`,
     truth:()=>close(3*(b/Math.sqrt(3))**2,b*b,1e-9)};}
  return {kind:'list',q:tex`أوجد كل قيم $c$ في الفترة المفتوحة $(-1,2)$ للدالة $f(x)=x^3+x-4$ التي تحقق نظرية القيمة المتوسطة على $[-1,2]$.`,list:[1],traps:[{list:[-1,1],msg:'الفترة مفتوحة (−1,2): العدد −1 ليس داخلها.'}],ans:'1',disp:'1',
   hints:['الميل المتوسط $=\\frac{6-(-6)}{3}=4$، وحلّ $3c^2+1=4$.','$c=\\pm1$. تحقق أيهما داخل $(-1,2)$.'],sol:tex`$3c^2+1=4\Rightarrow c=\pm1$، لكن $-1$ ليست داخل الفترة المفتوحة $(-1,2)$. إذن $c=1$ فقط.`,
   truth:()=>{const f=x=>x**3+x-4;return close(dn(f,1),(f(2)-f(-1))/3,1e-6)}};});
def('inflect',5,'نقطة الانعطاف',L=>{
  const k=nz(-3,3),q0=ri(-6,6),r=ri(-5,5);const f=x=>x**3+3*k*x*x+q0*x+r;
  return {kind:'num',q:tex`أوجد قيمة $x$ عند نقطة الانعطاف للدالة $f(x)=${poly([[1,V('x^3')],[3*k,V('x^2')],[q0,V('x')],[r,K]])}$.`,ans:`${-k}`,disp:`${-k}`,
   hints:["احسب $f''(x)$.",'نقطة الانعطاف حيث $f\'\'=0$ ويتغير التقعر.'],sol:tex`$f''(x)=6x${sg(6*k)}=0\Rightarrow x=${-k}$، وتتغير إشارة $f''$ عندها.`,
   truth:()=>{const f2=x=>(f(x+1e-3)-2*f(x)+f(x-1e-3))/1e-6;return Math.abs(f2(-k))<1e-3&&f2(-k+0.5)*f2(-k-0.5)<0}};});
def('second',5,'اختبار المشتقة الثانية',L=>{
  const k=ri(1,3),pt=pick([k,-k]);const f=x=>x**3-3*k*k*x;const sgn=pt>0?0:1;const m=mcq(['قيمة صغرى محلية','قيمة عظمى محلية','الاختبار غير حاسم'],sgn);
  return {kind:'mcq',q:tex`الدالة $f(x)=${poly([[1,V('x^3')],[-3*k*k,V('x')]])}$ لها عدد حرج عند $x=${pt}$. حسب اختبار المشتقة الثانية فهو:`,opts:m.opts,ci:m.ci,disp:['قيمة صغرى محلية','قيمة عظمى محلية'][sgn],
   hints:["احسب $f''(x)=6x$.",'إذا كانت $f\'\'>0$ فصغرى، وإذا كانت $<0$ فعظمى.'],sol:tex`$f''(${pt})=${6*pt}$ ${pt>0?'أكبر':'أصغر'} من الصفر، فهي ${['صغرى','عظمى'][sgn]} محلية.`,
   truth:()=>Math.sign((f(pt+1e-2)-2*f(pt)+f(pt-1e-2))/1e-4)===(pt>0?1:-1)};});
def('lhop',5,'قاعدة لوبيتال',L=>{
  const a=ri(2,6);const forms=[
   [tex`\frac{e^{${a}x}-1}{x}`,x=>(Math.exp(a*x)-1)/x,`${a}`,tex`${a}`,tex`\frac{${a}e^{${a}x}}{1}\to ${a}`],
   [tex`\frac{\ln(1+${a}x)}{x}`,x=>Math.log(1+a*x)/x,`${a}`,tex`${a}`,tex`\frac{${a}/(1+${a}x)}{1}\to ${a}`],
   [tex`\frac{1-\cos ${a}x}{x^2}`,x=>(1-Math.cos(a*x))/(x*x),`${a*a}/2`,tex`\frac{${a*a}}{2}`,tex`\frac{${a}\sin ${a}x}{2x}\to\frac{${a*a}\cos ${a}x}{2}\to\frac{${a*a}}{2}`],
   [tex`\frac{x-\sin x}{x^3}`,x=>(x-Math.sin(x))/(x**3),'1/6',tex`\frac16`,tex`\frac{1-\cos x}{3x^2}\to\frac{\sin x}{6x}\to\frac{\cos x}{6}\to\frac16`],
   [tex`\frac{e^x-1-x}{x^2}`,x=>(Math.exp(x)-1-x)/(x*x),'1/2',tex`\frac12`,tex`\frac{e^x-1}{2x}\to\frac{e^x}{2}\to\frac12`]];
  const o=pick(L===1?forms.slice(0,2):forms);
  return {kind:'num',q:tex`$\lim_{x\to0}${o[0]}$`,ans:o[2],disp:o[3],hints:['بالتعويض يظهر $\\frac00$، فيمكنك تطبيق لوبيتال.','اشتق البسط وحده والمقام وحده (دون قاعدة القسمة).'],sol:tex`$${o[4]}$`,
   truth:()=>close(o[1](1e-3),compile(o[2])(0),5e-3)};});

/* المحطة 6: التكامل */
def('int_power',6,'التكامل بقاعدة القوى',L=>{
  const pool=L===1?['pow','pow','lin','con']:['pow','pow','sqrt','inv2','con','lin'];const n=L===1?2:3;const chosen=pool.slice().sort(()=>Math.random()-.5).slice(0,n);
  const used=new Set();const parts=[];const f=[],F=[];const ft=[];const Ft=[];
  for(const t of chosen){if(used.has(t))continue;used.add(t);const c=nz(-6,7);
   if(t==='pow'){const m=ri(2,5);ft.push([c,V(`x^${m}`)]);f.push(`(${c})*x^${m}`);F.push(`(${c})*x^${m+1}/${m+1}`);Ft.push([fr(c,m+1),`x^${m+1}`]);}
   if(t==='lin'){ft.push([c,V('x')]);f.push(`(${c})*x`);F.push(`(${c})*x^2/2`);Ft.push([fr(c,2),'x^2']);}
   if(t==='con'){ft.push([c,K]);f.push(`(${c})`);F.push(`(${c})*x`);Ft.push([fr(c,1),'x']);}
   if(t==='sqrt'){ft.push([c,V('\\sqrt{x}')]);f.push(`(${c})*sqrt(x)`);F.push(`(${2*c})/3*x^(3/2)`);Ft.push([fr(2*c,3),'x^{3/2}']);}
   if(t==='inv2'){ft.push([c,a=>tex`\frac{${a}}{x^2}`]);f.push(`(${c})/x^2`);F.push(`(${-c})/x`);Ft.push([fr(-c,1),'x^{-1}']);}}
  const ans=F.join('+');const fs=f.join('+'),Fn=compile(ans),fn=compile(fs);
  const dt=Ft.map(([q,v])=>[0,0]);const ansTex=Ft.map(([q,v],i)=>(i&&q.n>=0?'+':'')+(q.d===1?(q.n===1&&v!=='x'?'':q.n):q.tex)+v).join('');
  return {kind:'expr',constant:true,q:tex`أوجد $\int\left(${poly(ft)}\right)dx$ (لا تكتب C).`,ans,pts:POS,disp:ansTex+'+C',hints:['كامل كل حد: ارفع الأس واحدًا واقسم على الأس الجديد.','اكتب الجذر والكسر كقوى أولًا.'],
   sol:tex`$${ansTex}+C$`,truth:()=>POS.every(x=>close(dn(Fn,x,1e-5),fn(x),1e-4))};});
def('int_trig',6,'تكاملات أساسية',L=>{
  const all=[[tex`A\cos x`,'A*cos(x)','A*sin(x)',tex`A\sin x`],[tex`A\sin x`,'A*sin(x)','-A*cos(x)',tex`-A\cos x`],[tex`A\sec^2 x`,'A*sec(x)^2','A*tan(x)',tex`A\tan x`],[tex`Ae^x`,'A*e^x','A*e^x',tex`Ae^x`],[tex`\frac{A}{1+x^2}`,'A/(1+x^2)','A*atan(x)',tex`A\tan^{-1}x`]];
  const A=nz(-5,6);let B=nz(-5,6);const pool=L===1?all.slice(0,2):all;const t1=pick(pool);let t2;do t2=pick(pool);while(t2===t1);
  const S=(s,a)=>s.split('A').join(String(a));const cs=(t,c)=>t.includes('frac')?String(c):(c===1?'':c===-1?'-':String(c));
  const fs=S(t1[1],`(${A})`)+'+'+S(t2[1],`(${B})`),F=S(t1[2],`(${A})`)+'+'+S(t2[2],`(${B})`);
  const fq=compile(fs),Fq=compile(F);const pts=[0.12,0.3,0.45,0.6,0.8];
  const second=B<0?' - '+S(t2[0],t2[0].includes('frac')?-B:(-B===1?'':-B)):' + '+S(t2[0],cs(t2[0],B));
  return {kind:'expr',constant:true,q:tex`أوجد $\int\left(${S(t1[0],cs(t1[0],A))}${second}\right)dx$ (لا تكتب C).`,ans:F,pts,disp:S(t1[3],A)+'+'+S(t2[3],B)+'+C',
   hints:['استخدم جدول التكامل: عكس جدول المشتقات.','كامل كل حد على حدة.'],sol:tex`$${S(t1[3],A)}+(${B})\cdot${S(t2[3],1)}+C$`,truth:()=>pts.every(x=>close(dn(Fq,x,1e-5),fq(x),1e-4))};});
def('int_sub',6,'التكامل بالتعويض',L=>{
  const a=nz(-3,4),n=ri(2,5),k=ri(2,5),b=ri(1,5);
  const M='نسيت القسمة على مشتقة الدالة الداخلية.';
  const forms=[
   [1,tex`${a===1?'':a===-1?'-':a}x(x^2+${b})^{${n}}`,`${a}*x*(x^2+${b})^${n}`,`${a}*(x^2+${b})^${n+1}/${2*(n+1)}`,tex`u=x^2+${b}`,`${a}*(x^2+${b})^${n+1}/${n+1}`],
   [1,tex`\cos ${k}x`,`cos(${k}*x)`,`sin(${k}*x)/${k}`,tex`u=${k}x`,`sin(${k}*x)`],
   [1,tex`e^{${k}x}`,`e^(${k}*x)`,`e^(${k}*x)/${k}`,tex`u=${k}x`,`e^(${k}*x)`],
   [2,tex`\dfrac{x}{x^2+${b}}`,`x/(x^2+${b})`,`ln(x^2+${b})/2`,tex`u=x^2+${b}`,`ln(x^2+${b})`],
   [2,tex`\sin^{${n}}x\cos x`,`sin(x)^${n}*cos(x)`,`sin(x)^${n+1}/${n+1}`,tex`u=\sin x`,`sin(x)^${n+1}`],
   [3,tex`\dfrac{1}{${b*b}+x^2}`,`1/(${b*b}+x^2)`,`atan(x/${b})/${b}`,tex`u=x/${b}`,`atan(x/${b})`],
   [3,tex`\dfrac{e^x}{1+e^{2x}}`,`e^x/(1+e^(2*x))`,`atan(e^x)`,tex`u=e^x`,null]];
  const o=pick(forms.filter(r=>r[0]<=L));const fq=compile(o[2]),Fq=compile(o[3]);
  return {kind:'expr',constant:true,q:tex`أوجد $\int ${o[1]}\,dx$ (لا تكتب C).`,ans:o[3],traps:o[5]?[{ans:o[5],msg:M}]:[],pts:[0.12,0.3,0.45,0.6,0.8],disp:'',hints:['ابحث عن دالة داخلية مشتقتها موجودة في التكامل.',`جرّب $${o[4]}$.`],
   sol:tex`نضع $${o[4]}$ فيتحول التكامل إلى تكامل مباشر في $u$ ثم نعيد $x$.`,truth:()=>[0.12,0.3,0.45,0.6,0.8].every(x=>close(dn(Fq,x,1e-5),fq(x),1e-4))};});
def('int_def',6,'التكامل المحدد',L=>{
  if(L===3&&Math.random()<.5){const t=pick([[tex`\int_0^{\pi/2}\left(${'A'}\cos x+${'B'}\sin x\right)dx`,0]]);const A=nz(-4,5),B=nz(-4,5);
    return {kind:'num',q:tex`احسب $\int_0^{\pi/2}\left(${A}\cos x${sg(B)}\sin x\right)dx$.`,ans:`${A+B}`,disp:`${A+B}`,hints:['كامل كل حد: $\\int\\cos=\\sin$ و$\\int\\sin=-\\cos$.','عوّض $\\frac\\pi2$ و$0$.'],sol:tex`$[${A}\sin x-${P(B)}\cos x]_0^{\pi/2}=${A}+${B}=${A+B}$.`,
     truth:()=>{let s=0;const n=2000,h=Math.PI/2/n;for(let i=0;i<n;i++){const x=(i+.5)*h;s+=(A*Math.cos(x)+B*Math.sin(x))*h}return close(s,A+B,1e-5)}};}
  const a=ri(-2,1),b=a+ri(1,3),p=nz(-3,4),q=ri(-4,4),r=ri(-3,5);const N=2*p*(b**3-a**3)+3*q*(b*b-a*a)+6*r*(b-a);const R=fr(N,6);
  return {kind:'num',q:tex`احسب $\int_{${a}}^{${b}}\left(${poly([[p,V('x^2')],[q,V('x')],[r,K]])}\right)dx$ (يمكنك كتابة كسر مثل 49/3).`,ans:R.str,disp:R.tex,hints:['أوجد الدالة الأصلية $F$ أولًا.','ثم احسب $F(b)-F(a)$.'],
   sol:tex`$F(x)=${p}\frac{x^3}{3}+${q}\frac{x^2}{2}+${r}x$ ثم $F(${b})-F(${a})=${R.tex}$.`,truth:()=>{let s=0;const n=2000,h=(b-a)/n;for(let i=0;i<n;i++){const x=a+(i+.5)*h;s+=(p*x*x+q*x+r)*h}return close(s,N/6,1e-5)}};});
def('int_parts',6,'التكامل بالتجزئة',L=>{
  const A=nz(-3,4);const forms=[
   [1,tex`x e^x`,'x*e^x','(x-1)*e^x','(x+1)*e^x'],[1,tex`x\cos x`,'x*cos(x)','x*sin(x)+cos(x)','x*sin(x)-cos(x)'],[1,tex`x\sin x`,'x*sin(x)','sin(x)-x*cos(x)','x*cos(x)-sin(x)'],
   [2,tex`x\ln x`,'x*ln(x)','x^2/2*ln(x)-x^2/4','x^2/2*ln(x)+x^2/4'],[2,tex`\ln x`,'ln(x)','x*ln(x)-x','x*ln(x)+x'],[3,tex`\tan^{-1}x`,'atan(x)','x*atan(x)-ln(1+x^2)/2','x*atan(x)+ln(1+x^2)/2'],[3,tex`x^2e^x`,'x^2*e^x','(x^2-2*x+2)*e^x','(x^2+2*x+2)*e^x']];
  const o=pick(forms.filter(r=>r[0]<=L));const fs=`(${A})*(${o[2]})`,Fs=`(${A})*(${o[3]})`;const fq=compile(fs),Fq=compile(Fs);
  return {kind:'expr',constant:true,q:tex`أوجد $\int ${A===1?'':A===-1?'-':A}${o[1]}\,dx$ (لا تكتب C).`,ans:Fs,traps:[{ans:`(${A})*(${o[4]})`,msg:'راجع الإشارة: ∫u dv = uv − ∫v du، فالتكامل الثاني يُطرح.'}],pts:POS,disp:'',hints:['استخدم ILATE لاختيار $u$: عكس مثلثي، لوغاريتم، جبري، مثلثي، أسّي.','$\\int u\\,dv=uv-\\int v\\,du$. ضع $dv=dx$ إذا كانت الدالة وحيدة.'],
   sol:tex`نطبّق $\int u\,dv=uv-\int v\,du$ باختيار $u$ بحسب ILATE.`,truth:()=>POS.every(x=>close(dn(Fq,x,1e-5),fq(x),1e-4))};});
def('int_area',6,'المساحة تحت المنحنى',L=>{
  const a=ri(1,4),h=ri(0,2),b=ri(1,3);const R=fr(a*b**3,3);
  return {kind:'num',q:tex`أوجد المساحة تحت المنحنى $y=${a===1?'':a}(x${h?'-'+h:''})^2$ بين $x=${h}$ و$x=${h+b}$.`,ans:R.str,disp:R.tex,hints:['المساحة $=\\int_a^b y\\,dx$.',h?'يمكنك التعويض $u=x-'+h+'$.':'كامل $x^2$ مباشرة.'],
   sol:tex`$\int_{${h}}^{${h+b}}${a}(x${h?'-'+h:''})^2dx=\frac{${a}}{3}\,${b}^3=${R.tex}$.`,truth:()=>{let s=0;const n=2000,hh=b/n;for(let i=0;i<n;i++){const x=h+(i+.5)*hh;s+=a*(x-h)**2*hh}return close(s,a*b**3/3,1e-5)}};});


/* المحطة 0: أساسيات الجبر والمثلثات */
def('f_factor',0,'حل المعادلة التربيعية',L=>{
  let b,c,roots,m,n;
  if(L===1){m=nz(-6,6);do n=nz(-6,6);while(n===m);b=-(m+n);c=m*n;roots=[m,n];}
  else{const p=pick([2,3]),q=nz(-5,5);do n=nz(-5,5);while(n===q/p);b=-(p*n+q);c=q*n;m=q/p;roots=[m,n];
    return {kind:'list',list:roots,q:tex`حلّ المعادلة $${poly([[p,V('x^2')],[b,V('x')],[c,K]])}=0$ (اكتب الجذرين، ويمكن كسر مثل 1/2).`,ans:roots.join(', '),disp:`${fr(q,p).str}, ${n}`,
     traps:[{list:[-q/p,-n],msg:'العامل (x−r) يعني الجذر x=+r. راجع الإشارات.'}],hints:['حلّل إلى عاملين: ابحث عن أعداد حاصل ضربها a·c ومجموعها b.','أو استخدم القانون العام.'],
     sol:tex`$(${p}x${sg(-q)})(x${sg(-n)})=0$ فالجذران $${fr(q,p).tex}$ و$${n}$.`,truth:()=>roots.every(r=>Math.abs(p*r*r+b*r+c)<1e-9)};}
  return {kind:'list',list:roots,q:tex`حلّ المعادلة $${poly([[1,V('x^2')],[b,V('x')],[c,K]])}=0$ (افصل بين الجذرين بفاصلة).`,ans:`${m}, ${n}`,disp:`${m}, ${n}`,
   traps:[{list:[-m,-n],msg:'العامل (x−r) يعني الجذر x=+r. راجع الإشارات.'}],hints:['ابحث عن عددين حاصل ضربهما الحد الثابت ومجموعهما معامل x (بإشارة عكسية).','حلّل إلى $(x-r_1)(x-r_2)$.'],
   sol:tex`$(x${sg(-m)})(x${sg(-n)})=0$ فالجذران $${m}$ و$${n}$.`,truth:()=>roots.every(r=>Math.abs(r*r+b*r+c)<1e-9)};});
def('f_exp',0,'قوانين الأسس',L=>{
  let a,b,c;
  if(L===1){do{a=ri(-3,6);b=ri(-3,6)}while(a+b===a*b);c=ri(-3,5);
    return {kind:'expr',q:tex`بسّط: $\dfrac{x^{${a}}\cdot x^{${b}}}{x^{${c}}}$ واكتب الناتج على الصورة $x^n$ (مثل x^5).`,ans:`x^(${a+b-c})`,traps:[{ans:`x^(${a*b-c})`,msg:'عند ضرب قوتين بنفس الأساس نجمع الأسس ولا نضربها.'}],
     hints:['ضرب القوى: $x^a x^b=x^{a+b}$.','القسمة: $\\frac{x^a}{x^b}=x^{a-b}$.'],disp:tex`x^{${a+b-c}}`,sol:tex`$x^{${a}+${P(b)}-${P(c)}}=x^{${a+b-c}}$.`,truth:()=>true};}
  do{a=ri(2,4);b=ri(2,4)}while(a+b===a*b);c=ri(-2,5);
  return {kind:'expr',q:tex`بسّط: $\dfrac{(x^{${a}})^{${b}}}{x^{${c}}}$ واكتب الناتج على الصورة $x^n$.`,ans:`x^(${a*b-c})`,traps:[{ans:`x^(${a+b-c})`,msg:'قوة القوة: نضرب الأسس $(x^a)^b=x^{ab}$.'}],
   hints:['قوة القوة: $(x^a)^b=x^{ab}$.','ثم اطرح أس المقام.'],disp:tex`x^{${a*b-c}}`,sol:tex`$x^{${a*b}-${P(c)}}=x^{${a*b-c}}$.`,truth:()=>true};});
def('f_frac',0,'الكسور',L=>{
  const b=ri(2,6);let d;do d=ri(2,7);while(d===b);const a=ri(1,b+3),c=ri(1,d+3);const sub=L>1&&Math.random()<.5;
  const n=sub?a*d-c*b:a*d+c*b,R=fr(n,b*d);const w=fr(a+(sub?-c:c),b+d);
  return {kind:'num',q:tex`احسب $\frac{${a}}{${b}}${sub?'-':'+'}\frac{${c}}{${d}}$ واكتب الناتج كسرًا مختصرًا (مثل 7/12).`,ans:R.str,traps:w.str===R.str?[]:[{ans:w.str,msg:'لا نجمع البسطين والمقامين مباشرة. وحّد المقامات أولًا.'}],disp:R.tex,
   hints:['وحّد المقامين: المقام المشترك $b\\cdot d$ (أو أصغر مضاعف مشترك).','اجمع أو اطرح البسطين ثم اختصر.'],sol:tex`$\frac{${a*d}${sub?'-':'+'}${c*b}}{${b*d}}=${R.tex}$.`,truth:()=>close(a/b+(sub?-1:1)*c/d,n/(b*d))};});
def('f_ineq',0,'المتباينات',L=>{
  const a=pick([2,3,4,-2,-3,-4]),r=nz(-6,6),b=-a*r;
  const o=[tex`x\gt ${r}`,tex`x\lt ${r}`,tex`x\gt ${-r}`,tex`x\lt ${-r}`];const ci0=a>0?0:1,wrong=a>0?1:0;const m=mcq(o,ci0);
  return {kind:'mcq',q:tex`حلّ المتباينة $${poly([[a,V('x')],[b,K]])}\gt 0$:`,opts:m.opts,ci:m.ci,mtrap:{[m.map.indexOf(wrong)]:'عند القسمة على عدد سالب ينقلب اتجاه المتباينة.'},disp:o[ci0],
   hints:['انقل الحد الثابت للطرف الآخر ثم اقسم على معامل x.','انتبه: القسمة على سالب تقلب الإشارة.'],sol:tex`$${a}x\gt ${-b}$ ثم نقسم على $${a}$ ${a<0?'(فينقلب الاتجاه)':''} فنحصل على $${o[ci0]}$.`,
   truth:()=>{const x=a>0?r+1:r-1;return a*x+b>0&&a*(a>0?r-1:r+1)+b<0}};});
def('f_domain',0,'مجال الجذر التربيعي',L=>{
  const a=pick([1,2,3,-1,-2,-3]),r=nz(-5,5),b=-a*r;const o=[tex`[${r},\infty)`,tex`(${r},\infty)`,tex`(-\infty,${r}]`,tex`(-\infty,${r})`];const ci0=a>0?0:2,wrong=a>0?1:3;const m=mcq(o,ci0);
  return {kind:'mcq',q:tex`مجال الدالة $f(x)=\sqrt{${poly([[a,V('x')],[b,K]])}}$ هو:`,opts:m.opts,ci:m.ci,mtrap:{[m.map.indexOf(wrong)]:'الجذر يقبل الصفر، فالطرف مغلق (المقدار تحت الجذر ≥ 0).'},disp:o[ci0],
   hints:['المقدار تحت الجذر يجب أن يكون $\\ge0$.','حلّ المتباينة وانتبه لاتجاهها.'],sol:tex`$${poly([[a,V('x')],[b,K]])}\ge0$ فالمجال $${o[ci0]}$.`,truth:()=>a*r+b===0}});
def('f_trigid',0,'مثلثات: نسب ومتطابقات',L=>{
  const [p0,o0,q0]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]);const sw=Math.random()<.5,p=sw?o0:p0,o=sw?p0:o0,q=q0;const th=Math.asin(p/q);
  const t=pick(L===1?['cos','tan']:['cos','tan','sin2']);let R,tr,qq;
  if(t==='cos'){R=fr(o,q);tr=fr(p,q);qq=tex`$\cos\theta$`}else if(t==='tan'){R=fr(p,o);tr=fr(o,p);qq=tex`$\tan\theta$`}else{R=fr(2*p*o,q*q);tr=fr(2*p,q);qq=tex`$\sin2\theta$`}
  return {kind:'num',q:tex`زاوية حادة $\theta$ فيها $\sin\theta=\frac{${p}}{${q}}$. احسب ${qq} (كسر مثل 3/5).`,ans:R.str,traps:tr.str===R.str?[]:[{ans:tr.str,msg:t==='sin2'?'sin 2θ = 2 sinθ cosθ وليس 2 sinθ.':'راجع تعريف النسبة: جا = المقابل÷الوتر، جتا = المجاور÷الوتر، ظا = المقابل÷المجاور.'}],disp:R.tex,
   hints:['ارسم مثلثًا قائمًا: المقابل '+p+' والوتر '+q+'.','احسب الضلع الثالث بفيثاغورس: '+o+'.'],sol:tex`المجاور $=\sqrt{${q}^2-${p}^2}=${o}$. إذن ${qq} $=${R.tex}$.`,
   truth:()=>close(t==='cos'?Math.cos(th):t==='tan'?Math.tan(th):Math.sin(2*th),R.n/R.d,1e-9)};});
function addTrap(id,fn){const g=GENS[id],m=g.make;g.make=L=>{const p=m(L);const t=fn(p);if(t)p.traps=(p.traps||[]).concat(t);return p}}
addTrap('lim_factor',p=>[{ans:`-(${p.ans})`,msg:'عوّض x=m في العامل المتبقي (x−n): النتيجة m−n وليست n−m.'}]);
addTrap('d_quot',p=>[{ans:`-(${p.ans})`,msg:'عكست ترتيب البسط. القاعدة: (u′v − uv′)/v²، أي مشتقة البسط أولًا.'}]);
addTrap('impl',p=>[{ans:`-(${p.ans})`,msg:'تحقق من الإشارة: بعد عزل y′ يكون الناتج سالبًا، y′ = −(المشتقة بالنسبة لـ x)/(المشتقة بالنسبة لـ y).'}]);
addTrap('inflect',p=>[{ans:`-(${p.ans})`,msg:'راجع الإشارة عند حل 6x + 2p = 0.'}]);
const STATIONS=[
 {id:0,title:'أساسيات الجبر والمثلثات',ch:0,rules:tex`<p>الجذور: $(x-r)=0\Rightarrow x=+r$. عند القسمة على سالب تنقلب المتباينة.</p><p>$x^ax^b=x^{a+b}$ و$(x^a)^b=x^{ab}$. الكسور: وحّد المقامات.</p><p>$\sin^2+\cos^2=1$، $\tan=\frac{\sin}{\cos}$.</p>`},
 {id:1,title:'الدوال والمثلثات',ch:1,rules:tex`<p>مجال: المقام ≠ 0، تحت الجذر $\ge0$، داخل $\ln$ أكبر من 0.</p><p>العكس: اكتب $y=f(x)$، حلّ لـ $x$، بدّل. $\ln e^x=x$.</p><p>الزوايا الخاصة: $\sin30^\circ=\frac12$، $\sin45^\circ=\frac{\sqrt2}2$، $\sin60^\circ=\frac{\sqrt3}2$.</p>`},
 {id:2,title:'النهايات والاتصال',ch:2,rules:tex`<p>$\frac00$: حلّل أو اضرب في المرافق. عند $\infty$: اقسم على أعلى قوة.</p><p>$\lim\frac{\sin ax}{x}=a$. النهاية موجودة إذا تساوت الجهتان.</p><p>الاتصال: $\lim_{x\to a}f=f(a)$.</p>`},
 {id:3,title:'قواعد الاشتقاق',ch:3,rules:tex`<p>$(x^n)'=nx^{n-1}$، $(uv)'=u'v+uv'$، $\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}$.</p><p>السلسلة: $f'(g)\cdot g'$. $(\ln u)'=\frac{u'}u$، $(\tan^{-1}u)'=\frac{u'}{1+u^2}$.</p><p>الاشتقاق اللوغاريتمي لـ $x^x$ وأشباهها.</p>`},
 {id:4,title:'المماس والاشتقاق الضمني',ch:3,rules:tex`<p>المماس: $y-f(a)=f'(a)(x-a)$.</p><p>الضمني: اشتق الطرفين، كل حد فيه $y$ يُضرب في $y'$، ثم حلّ لـ $y'$.</p>`},
 {id:5,title:'تطبيقات المشتقة',ch:4,rules:tex`<p>عدد حرج: $f'=0$ أو غير موجودة. الفترة المغلقة: قارن القيم عند الأعداد الحرجة والنهايتين.</p><p>القيمة المتوسطة: $f'(c)=\frac{f(b)-f(a)}{b-a}$ بشرط $c\in(a,b)$ مفتوحة.</p><p>$f''>0$ مقعّر للأعلى. لوبيتال لـ $\frac00,\frac\infty\infty$ فقط.</p>`},
 {id:6,title:'التكامل',ch:5,rules:tex`<p>$\int x^n=\frac{x^{n+1}}{n+1}+C$، $\int\frac1x=\ln|x|+C$.</p><p>التعويض: $u=$ الجزء الداخلي. التجزئة: $\int u\,dv=uv-\int v\,du$ (ILATE).</p><p>المحدد: $\int_a^bf=F(b)-F(a)$.</p>`}];

/* ================= الواجهة: تُركَّب داخل أي مضيف (التطبيق أو النسخة المستقلة) ================= */
const CSS=`
.m105{--m-good:var(--support,#58B690);--m-bad:var(--attention,#B4523A);color:var(--ink);line-height:1.75}
.m105 .katex{direction:ltr;unicode-bidi:isolate;font-size:1.08em}
.m105 .m-box{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md,14px);padding:16px 16px;margin-bottom:14px}
.m105 h2{font-size:var(--fs-heading,17px);margin:0 0 6px;font-weight:700}
.m105 p{margin:0 0 .6em}.m105 .mut{color:var(--ink-muted);font-size:var(--fs-caption,13px)}
.m105 .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.m105 button{font-family:inherit}
.m105 .m-btn{border:0;border-radius:12px;padding:10px 18px;font-weight:600;font-size:var(--fs-body,14px);cursor:pointer;background:var(--accent);color:var(--background,#fff)}
.m105 .m-btn.ghost{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.m105 .m-btn.sm{padding:5px 12px;font-size:var(--fs-caption,13px)}
.m105 .m-btn:disabled{opacity:.45}
.m105 .bar{height:6px;background:var(--line);border-radius:6px;overflow:hidden;flex:1;min-width:60px}
.m105 .bar i{display:block;height:100%;background:var(--accent)}
.m105 .qhead{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.m105 .qbox{font-size:calc(var(--fs-body,14px) + 2px);padding:14px;border-radius:12px;background:var(--accent-soft,rgba(0,0,0,.05));margin:8px 0 12px;overflow-x:auto}
.m105 .opts{display:grid;gap:8px}
.m105 .opts button,.m105 .opts .o{text-align:center;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:calc(var(--fs-body,14px) + 1px);cursor:pointer}
.m105 .opts .right{border-color:var(--m-good);background:rgba(88,182,144,.18)}
.m105 .opts .wrong{border-color:var(--m-bad);background:var(--attention-soft,rgba(180,82,58,.12))}
.m105 .opts .sel{border-color:var(--accent);background:var(--accent-soft)}
.m105 .ansrow{display:flex;gap:8px}
.m105 input[type=text],.m105 input[type=date],.m105 select{font:inherit;color:var(--ink);background:var(--background,#fff);border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:0}
.m105 input[type=text]{flex:1;direction:ltr;text-align:left;font-size:16px}
.m105 .keys{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;direction:ltr}
.m105 .keys button{border:1px solid var(--line);background:var(--surface);color:var(--ink-muted);border-radius:8px;padding:4px 10px;font-size:13px;cursor:pointer}
.m105 .fb{margin-top:12px;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface)}
.m105 .fb.good{border-color:var(--m-good)}.m105 .fb.bad{border-color:var(--m-bad)}
.m105 .fb.hint{background:var(--accent-soft)}
.m105 .sol{margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)}
.m105 .st{border:1px solid var(--line);border-radius:var(--r-md,14px);margin-bottom:10px;background:var(--surface)}
.m105 .st summary{padding:12px 14px;cursor:pointer;display:flex;gap:10px;align-items:center;list-style:none}
.m105 .st summary::-webkit-details-marker{display:none}
.m105 .st .in{padding:0 14px 14px}
.m105 .sk{display:flex;gap:10px;align-items:center;padding:5px 0}
.m105 .sk .nm{flex:1;min-width:0}
.m105 .tag{font-size:var(--fs-caption,12px);padding:1px 10px;border-radius:999px;border:1px solid var(--line);color:var(--ink-muted);white-space:nowrap}
.m105 .tag.ok{color:var(--m-good);border-color:var(--m-good)}.m105 .tag.mid{color:var(--accent);border-color:var(--accent)}
.m105 .rules{margin:8px 0;padding:10px 12px;border-radius:12px;background:var(--accent-soft)}
.m105 .dotnav{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.m105 .dotnav button{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}
.m105 .dotnav .cur{border-color:var(--accent);background:var(--accent-soft)}.m105 .dotnav .has{background:var(--accent);color:var(--background,#fff)}
.m105 .timer{margin-inline-start:auto;font-variant-numeric:tabular-nums;font-weight:700}.m105 .timer.low{color:var(--m-bad)}
.m105 .res{display:flex;gap:10px;padding:10px 0;border-top:1px solid var(--line)}
.m105 .res .mk{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:700}
.m105 .res .g{background:rgba(88,182,144,.2);color:var(--m-good)}.m105 .res .b{background:var(--attention-soft);color:var(--m-bad)}
.m105 :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;
let styled=false;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DEFAULT_BASE=(()=>{try{const s=document.currentScript;return s&&s.src?s.src.replace(/[^/]*$/,''):''}catch(e){return ''}})();
let kxPromise=null;
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function ensureKatex(){
  if(window.renderMathInElement)return Promise.resolve(true);
  if(kxPromise)return kxPromise;
  const b=DEFAULT_BASE+'vendor/katex/';
  const l=document.createElement('link');l.rel='stylesheet';l.href=b+'katex.min.css';document.head.appendChild(l);
  kxPromise=loadScript(b+'katex.min.js').then(()=>loadScript(b+'auto-render.min.js')).then(()=>true).catch(()=>{kxPromise=null;return false});
  return kxPromise;}
function typeset(el){ensureKatex().then(ok=>{if(ok&&el.isConnected)try{window.renderMathInElement(el,{delimiters:[{left:'$',right:'$',display:false}],throwOnError:false})}catch(e){}})}

const stOf=id=>STATIONS.find(s=>s.id===id);
const idsOf=st=>Object.keys(GENS).filter(i=>GENS[i].st===st);
const DEFAULT_PROGRESS=()=>({v:1,skills:{},placed:false,sessions:0});

function mount(root,host){
  if(!styled){const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);styled=true}
  root.classList.add('m105');
  const P=host.load();if(!P.skills)P.skills={};
  const save=()=>host.save(P);
  const sk=id=>(P.skills[id]=P.skills[id]||{ema:0,n:0,lvl:1,bad:0,last:0});
  const stateOf=id=>{const k=P.skills[id];return !k||!k.n?['لم تبدأ','']:(k.ema>=.75&&k.n>=3)?['متقن','ok']:['قيد التقدّم','mid']};
  const stMastery=st=>{const a=idsOf(st);return a.reduce((x,i)=>x+(P.skills[i]&&P.skills[i].n?P.skills[i].ema:0),0)/a.length};
  const weakest=n=>Object.keys(GENS).map(id=>({id,w:sk(id).n?1-sk(id).ema:.8})).sort((a,b)=>b.w-a.w).slice(0,n).map(o=>o.id);
  function pickSkill(pool,recent){const ids=pool&&pool.length?pool:Object.keys(GENS),now=Date.now();
    const w=ids.map(id=>{const k=sk(id),g=GENS[id];let x=k.n?(1-k.ema)+.15:.8-.05*g.st;if(k.n)x+=Math.min(.6,(now-k.last)/864e5*.1*k.ema);if(recent.slice(-2).includes(id))x*=.15;return Math.max(.02,x)});
    let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<ids.length;i++){r-=w[i];if(r<=0)return ids[i]}return ids[0]}
  function record(id,score,weight=.4){const k=sk(id);k.ema+=weight*(score-k.ema);k.n++;k.last=Date.now();
    if(score<.5){k.bad++;if(k.bad>=2&&k.lvl>1){k.lvl--;k.bad=0}}else k.bad=0;
    if(score>=.6&&k.ema>.75&&k.n>=3&&k.lvl<3){k.lvl++;k.ema=.5}}
  let sess=null,exam=null,timer=null,tab='learn';

  const flagged=new Set();
  function flag(id){if(flagged.has(id))return;flagged.add(id);try{host.flag&&host.flag(GENS[id].name,GENS[id].st===0?'gap':'hard')}catch(e){}}
  const fb=(cls,html)=>{const f=root.querySelector('#fb');f.innerHTML=`<div class="fb ${cls}">${html}</div>`;typeset(f)};
  const $=s=>root.querySelector(s);
  const out=(html)=>{if(timer&&!/id="tm"/.test(html)){clearInterval(timer);timer=null}root.innerHTML=html;typeset(root)};
  const back=()=>`<div class="row" style="margin-bottom:12px"><button class="m-btn ghost sm" id="mback">رجوع إلى المادة</button></div>`;
  const wireBack=()=>{const b=$('#mback');if(b)b.onclick=()=>host.back()};

  /* ---------- الشاشة الرئيسية ---------- */
  function hub(){
    if(sess&&sess.p)return practice();if(sess&&sess.fin)return finish();if(exam)return exam.done?examResult():examRun();
    const seen=Object.keys(P.skills).filter(i=>P.skills[i].n).length;
    const ex=host.examInfo&&host.examInfo();
    const weakN=Object.keys(GENS).filter(i=>!sk(i).n||sk(i).ema<.7).length;
    const plan=!ex?'':ex.days<0?'':ex.days===0?`<p><b>اختبارك اليوم.</b> راجع القواعد في المحطات ولا تبدأ موضوعًا جديدًا.</p>`:`<p><b>باقٍ ${ex.days} يومًا على «${esc(ex.title)}».</b> ${weakN?`لديك ${weakN} مهارة لم تتقنها بعد، أي نحو ${Math.max(1,Math.ceil(weakN/Math.max(1,ex.days-1)))} مهارة يوميًا، وآخر يوم للمراجعة.`:'كل مهاراتك متقنة. حافظ عليها بمراجعة قصيرة.'}</p>`;
    const wk=weakest(3);
    out(`${back()}
    ${!P.placed&&!seen?`<div class="m-box"><h2>ابدأ من مستواك الحقيقي</h2><p class="mut">اختبار قصير (${STATIONS.length*2} سؤالًا) يعرف أين تقف، فلا تضيع وقتك فيما تعرفه.</p><button class="m-btn" id="diag">ابدأ اختبار المستوى</button></div>`:''}
    ${plan?`<div class="m-box">${plan}</div>`:''}
    <div class="m-box"><h2>تمرّن اليوم</h2><p class="mut">أسئلة تتجدد في كل مرة، وتتكيّف مع ما أتقنته وما لم تتقنه. كل خطأ تُرجِع إليه تفسيرًا، ويُسجَّل نقطةً للمراجعة في المادة.</p>
      <div class="row"><button class="m-btn" id="go">${seen?'ابدأ جلسة (8 أسئلة)':'ابدأ أول جلسة'}</button>${seen?'<button class="m-btn ghost" id="weak">قوِّ نقاط ضعفك</button>':''}<button class="m-btn ghost" id="exm">اختبار تجريبي</button></div></div>
    ${seen?`<div class="m-box"><h2>نقاط تحتاج تقوية</h2>${wk.map(id=>`<div class="sk"><span class="nm">${GENS[id].name}</span><span class="tag ${stateOf(id)[1]}">${stateOf(id)[0]}</span></div>`).join('')}</div>`:''}
    <h2 style="margin:16px 0 8px">المحطات</h2>
    ${STATIONS.map(s=>`<details class="st" id="st${s.id}"><summary><span class="bar" style="flex:none;width:56px"><i style="width:${Math.round(stMastery(s.id)*100)}%"></i></span><span style="flex:1"><b>${s.id}. ${s.title}</b></span></summary><div class="in">
      ${idsOf(s.id).map(id=>`<div class="sk"><span class="nm">${GENS[id].name}</span><span class="tag ${stateOf(id)[1]}">${stateOf(id)[0]}</span></div>`).join('')}
      <div class="rules"><b>أهم القواعد</b>${s.rules}</div><button class="m-btn sm" data-s="${s.id}">تدرّب على هذه المحطة</button></div></details>`).join('')}
    <div class="m-box"><button class="m-btn ghost sm" id="rst">مسح تقدّمي في التمارين</button></div>`);
    wireBack();
    const g=(s,f)=>{const e=$(s);if(e)e.onclick=f};
    g('#diag',startDiag);g('#go',()=>start({n:8}));g('#weak',()=>start({n:6,pool:wk}));g('#exm',examSetup);
    root.querySelectorAll('button[data-s]').forEach(b=>b.onclick=()=>start({n:8,pool:idsOf(+b.dataset.s)}));
    g('#rst',function(){if(this.dataset.c){P.skills={};P.placed=false;save();hub()}else{this.dataset.c=1;this.textContent='اضغط مرة أخرى للتأكيد'}});
    root.querySelectorAll('details.st').forEach(d=>d.addEventListener('toggle',()=>typeset(d)));}

  /* ---------- الجلسة ---------- */
  function startDiag(){const ids=[];STATIONS.forEach(st=>ids.push(...idsOf(st.id).sort(()=>Math.random()-.5).slice(0,2)));start({n:ids.length,diag:ids})}
  function start(o){flagged.clear();sess={diag:o.diag||null,n:o.n||8,i:0,ok:0,pool:o.pool||null,recent:[],p:null,fin:false};next()}
  function next(){if(sess.i>=sess.n){sess.p=null;sess.fin=true;return finish()}
    const id=sess.diag?sess.diag[sess.i]:pickSkill(sess.pool,sess.recent);sess.recent.push(id);sess.skill=id;sess.p=GENS[id].make(sess.diag?2:sk(id).lvl);sess.att=0;sess.hints=0;sess.trap='';sess.done=false;sess.i++;practice()}
  function practice(){
    const p=sess.p,g=GENS[sess.skill],k=sk(sess.skill);
    out(`<div class="m-box"><div class="qhead"><span class="mut">سؤال ${sess.i} من ${sess.n}</span><span class="bar"><i style="width:${(sess.i-1)/sess.n*100}%"></i></span><button class="m-btn ghost sm" id="quit">إنهاء</button></div>
    <p class="mut">${g.name} · ${stOf(g.st).title}</p><div class="qbox">${p.q}</div><div id="inp"></div><div id="fb"></div></div>`);
    $('#quit').onclick=()=>{save();sess=null;hub()};
    const inp=$('#inp'),acts=`<div class="row" style="margin-top:10px"><button class="m-btn ghost sm" id="hint">تلميح</button><button class="m-btn ghost sm" id="ex">مثال محلول</button><button class="m-btn ghost sm" id="show">أظهر الحل</button></div>`;
    if(p.kind==='mcq'){inp.innerHTML=`<div class="opts">${p.opts.map((o,i)=>`<button data-i="${i}">${/\$|\\/.test(o)?o:esc(o)}</button>`).join('')}</div>`+acts;
      inp.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{const r=grade(p,+b.dataset.i);sess.trap=r.trap||'';finishQ(r.ok,+b.dataset.i)});}
    else{inp.innerHTML=`<div class="ansrow"><input id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="جوابك" placeholder="${p.kind==='expr'?'3x^2+2':p.kind==='list'?'-2, 3':'0.5'}"><button class="m-btn" id="chk">تحقّق</button></div>
      <div class="keys" aria-label="رموز مساعدة">${['^','sqrt()','pi','e^','ln()','sin()','cos()','tan()','inf','/','( )'].map(k=>`<button type="button" data-k="${k}">${k}</button>`).join('')}</div>`+acts;
      const a=$('#ans');$('#chk').onclick=submit;a.onkeydown=e=>{if(e.key==='Enter')submit()};
      inp.querySelectorAll('.keys button').forEach(b=>b.onclick=()=>{const v=b.dataset.k,s=a.selectionStart??a.value.length,e=a.selectionEnd??s;let ins=v,cur=null;if(v.endsWith('()'))cur=v.length-1;else if(v==='( )'){ins='()';cur=1}
        a.value=a.value.slice(0,s)+ins+a.value.slice(e);const pos=s+(cur??ins.length);a.setSelectionRange(pos,pos);a.focus()});}
    $('#hint').onclick=hint;$('#ex').onclick=example;$('#show').onclick=()=>finishQ(false,null);
    if(!k.n&&!sess.diag)fb('hint','أول مرة مع هذه المهارة؟ اضغط «مثال محلول» لترى الطريقة قبل أن تجرّب.');}
  function example(){if(sess.done)return;const e=GENS[sess.skill].make(1);fb('hint',`<b>مثال محلول (غير سؤالك):</b><div class="qbox">${e.q}</div><p><b>الحل:</b> ${e.sol}</p><p class="mut">الآن جرّب سؤالك.</p>`)}
  function hint(){const p=sess.p;if(sess.done)return;if(sess.hints>=p.hints.length)return fb('hint','لا توجد تلميحات أخرى. جرّب «أظهر الحل» لتتعلم الطريقة.');
    sess.hints++;fb('hint',`<b>تلميح ${sess.hints} من ${p.hints.length}:</b>${p.hints.slice(0,sess.hints).map(h=>`<p>${h}</p>`).join('')}`)}
  function submit(){if(sess.done)return;const raw=$('#ans').value;if(!raw.trim())return;const r=grade(sess.p,raw);
    if(r.err)return fb('hint','لم أفهم الكتابة: '+esc(r.err));
    if(r.ok)return finishQ(true,raw);sess.att++;if(r.trap)sess.trap=r.trap;
    if(sess.att>=2)return finishQ(false,raw);
    fb('bad',`${r.trap?'<b>تنبيه:</b> '+r.trap+'<br>':''}ليست صحيحة بعد. راجع الخطوات وجرّب مرة أخرى${sess.hints<sess.p.hints.length?'، أو اطلب تلميحًا':''}.`)}
  function finishQ(ok,given){
    if(sess.done)return;sess.done=true;const p=sess.p;const score=ok?Math.max(.4,1-.2*sess.hints-.3*sess.att):0;
    record(sess.skill,score,sess.diag?.7:.4);if(sess.diag)sk(sess.skill).lvl=ok?(sess.att===0&&sess.hints===0?3:2):1;
    if(ok)sess.ok++;else flag(sess.skill);save();
    const ans=p.kind==='mcq'?p.opts[p.ci]:p.disp?(/[\\^_]/.test(p.disp)&&!p.disp.includes('$')?'$'+p.disp+'$':p.disp):p.ans;
    root.querySelectorAll('#inp button,#inp input').forEach(b=>b.disabled=true);
    if(p.kind==='mcq')root.querySelectorAll('.opts button').forEach((b,i)=>{if(i===p.ci)b.classList.add('right');else if(i===given)b.classList.add('wrong')});
    const f=$('#fb');f.innerHTML=`<div class="fb ${ok?'good':'bad'}"><b>${ok?'أحسنت':'لنراجع الحل'}</b>${!ok&&sess.trap?`<p><b>سبب الخطأ المرجّح:</b> ${sess.trap}</p>`:''}${ok?'':`<p>الجواب الصحيح: <b>${ans}</b></p>`}
      <div class="sol"><b>طريقة الحل:</b><p>${p.sol}</p></div><div class="row" style="margin-top:10px"><button class="m-btn" id="next">${sess.i>=sess.n?'إنهاء الجلسة':'السؤال التالي'}</button></div></div>`;
    $('#next').onclick=next;typeset(f)}
  function finish(){
    if(sess.diag){P.placed=true}P.sessions=(P.sessions||0)+1;save();
    const pct=Math.round(sess.ok/sess.n*100),wk=weakest(2);
    out(`<div class="m-box"><h2>${sess.diag?'اكتمل اختبار المستوى':'انتهت الجلسة'}</h2><p>أجبت صح عن <b>${sess.ok}</b> من <b>${sess.n}</b> (${pct}%).</p>
    <p class="mut">${sess.diag?'بنينا خطتك على نتيجتك. ':''}أولى مهاراتك بالتقوية الآن: ${wk.map(i=>GENS[i].name).join('، ')}.${flagged.size?` وسجّلنا ${flagged.size} نقطة للمراجعة في تبويب «استعد» من المادة.`:''}</p>
    <div class="row"><button class="m-btn" id="again">جلسة جديدة</button><button class="m-btn ghost" id="hb">الشاشة الرئيسية</button></div></div>`);
    $('#again').onclick=()=>start({n:8});$('#hb').onclick=()=>{sess=null;hub()}}

  /* ---------- اختبار تجريبي ---------- */
  function examSetup(){out(`${back()}<div class="m-box"><h2>اختبار تجريبي</h2><p class="mut">أسئلة متجددة بلا تلميحات ولا نتيجة فورية، والتصحيح في النهاية. اكتب القيم الدقيقة لأن الآلة الحاسبة غير مسموحة.</p>
    <p><b>المحطات المشمولة</b></p><div class="row" id="chs">${STATIONS.map(s=>`<label><input type="checkbox" value="${s.id}" ${s.id?'checked':''}> ${s.title}</label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><label>عدد الأسئلة <select id="cnt"><option>8</option><option selected>10</option><option>15</option></select></label><label>المدة <select id="min"><option value="20">20 دقيقة</option><option value="30" selected>30 دقيقة</option><option value="45">45 دقيقة</option></select></label></div>
    <div class="row" style="margin-top:14px"><button class="m-btn" id="st">ابدأ الاختبار</button></div></div>`);wireBack();
    $('#st').onclick=()=>{const chs=[...root.querySelectorAll('#chs input:checked')].map(i=>+i.value);if(!chs.length)return;
      const pool=Object.keys(GENS).filter(id=>chs.includes(GENS[id].st)).sort(()=>Math.random()-.5),n=+$('#cnt').value,qs=[];
      for(let i=0;i<n;i++){const id=pool[i%pool.length];qs.push({id,p:GENS[id].make(Math.max(2,Math.min(3,sk(id).lvl+1))),a:null})}
      exam={qs,i:0,end:Date.now()+(+$('#min').value)*60000,done:false};examRun()}}
  function examRun(){const q=exam.qs[exam.i],p=q.p;
    out(`<div class="m-box"><div class="qhead"><span class="mut">سؤال ${exam.i+1} من ${exam.qs.length}</span><span class="timer" id="tm"></span><button class="m-btn sm" id="fin">تسليم</button></div>
    <div class="dotnav">${exam.qs.map((x,i)=>`<button data-i="${i}" class="${i===exam.i?'cur':''} ${x.a!==null&&x.a!==''?'has':''}" aria-label="سؤال ${i+1}">${i+1}</button>`).join('')}</div>
    <div class="qbox">${p.q}</div><div id="inp"></div><div class="row" style="margin-top:12px"><button class="m-btn ghost sm" id="pv" ${exam.i?'':'disabled'}>السابق</button><button class="m-btn ghost sm" id="nx" ${exam.i<exam.qs.length-1?'':'disabled'}>التالي</button></div></div>`);
    const inp=$('#inp');
    if(p.kind==='mcq'){inp.innerHTML=`<div class="opts">${p.opts.map((o,i)=>`<button data-i="${i}" class="${q.a===i?'sel':''}">${/\$|\\/.test(o)?o:esc(o)}</button>`).join('')}</div>`;inp.querySelectorAll('button').forEach(b=>b.onclick=()=>{q.a=+b.dataset.i;examRun()})}
    else{inp.innerHTML=`<div class="ansrow"><input id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="جوابك" value="${esc(q.a||'')}" placeholder="اكتب جوابك"></div>`;$('#ans').oninput=e=>{q.a=e.target.value;root.querySelector(`.dotnav button[data-i="${exam.i}"]`).classList.toggle('has',!!q.a.trim())}}
    root.querySelectorAll('.dotnav button').forEach(b=>b.onclick=()=>{exam.i=+b.dataset.i;examRun()});
    $('#pv').onclick=()=>{exam.i--;examRun()};$('#nx').onclick=()=>{exam.i++;examRun()};
    $('#fin').onclick=function(){if(this.dataset.c)submitExam();else{this.dataset.c=1;this.textContent='اضغط للتأكيد'}};
    const tick=()=>{const t=$('#tm');if(!t||!exam||exam.done)return;const left=Math.max(0,exam.end-Date.now());t.textContent=`${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`;t.classList.toggle('low',left<5*60000);if(left<=0)submitExam()};
    tick();clearInterval(timer);timer=setInterval(tick,1000)}
  function submitExam(){if(!exam||exam.done)return;clearInterval(timer);timer=null;flagged.clear();let sc=0;
    exam.qs.forEach(q=>{let ok=false;if(q.a!==null&&q.a!==''){const r=grade(q.p,q.p.kind==='mcq'?q.a:String(q.a));ok=!!r.ok}q.ok=ok;if(ok)sc++;else flag(q.id);record(q.id,ok?1:0,.2)});
    exam.done=true;exam.score=sc;save();examResult()}
  function examResult(){const n=exam.qs.length;
    out(`<div class="m-box"><h2>النتيجة: ${exam.score} من ${n}</h2><p class="mut">${exam.score/n>=.8?'ممتاز. حافظ على التدريب المتجدد.':exam.score/n>=.5?'جيد. راجع الأسئلة الخاطئة أدناه.':'تحتاج مراجعة. ابدأ من المحطات الأضعف.'}${flagged.size?' وأضفنا نقاط الضعف إلى قائمة المراجعة في المادة.':''}</p>
    ${exam.qs.map(q=>`<div class="res"><div class="mk ${q.ok?'g':'b'}">${q.ok?'✓':'✗'}</div><div style="min-width:0"><div class="mut">${GENS[q.id].name}</div><div>${q.p.q}</div>${q.ok?'':`<div class="fb bad"><p>جوابك: <span dir="ltr">${q.a===null||q.a===''?'(بلا جواب)':esc(q.p.kind==='mcq'?q.p.opts[q.a].replace(/\$/g,''):q.a)}</span></p><p>الصحيح: <b>${q.p.kind==='mcq'?q.p.opts[q.p.ci]:q.p.disp?(/[\\^_]/.test(q.p.disp)&&!q.p.disp.includes('$')?'$'+q.p.disp+'$':q.p.disp):q.p.ans}</b></p><div class="sol">${q.p.sol}</div></div>`}</div></div>`).join('')}
    <div class="row" style="margin-top:14px"><button class="m-btn" id="again">اختبار جديد</button><button class="m-btn ghost" id="hb">الشاشة الرئيسية</button></div></div>`);
    $('#again').onclick=()=>{exam=null;examSetup()};$('#hb').onclick=()=>{exam=null;hub()}}
  hub();
  return {destroy(){if(timer)clearInterval(timer);root.innerHTML=''}};
}
return {GENS,STATIONS,grade,compile,mount,ensureKatex,typeset};
})();

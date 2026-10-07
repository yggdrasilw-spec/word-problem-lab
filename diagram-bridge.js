(() => {
  'use strict';
  const $=id=>document.getElementById(id),channel='diagram-bridge-v1';
  let model=null,requestId='',results={};
  try{results=JSON.parse(localStorage.getItem('word-problem-diagrams-v1')||'{}');if(!results||typeof results!=='object'||Array.isArray(results))results={};}catch{}
  const panel=document.createElement('section');panel.className='card';panel.hidden=true;
  panel.innerHTML='<div class="sectionLabel">図で 考えよう</div><p>このお話のまま、絵・○・テープ図で考えられます。</p><button id="openDiagram" type="button">このお話を 図にする</button><div id="returnedDiagram" aria-live="polite"></div>';
  document.querySelector('.support').before(panel);
  const dialog=document.createElement('dialog');dialog.className='diagramDialog';
  dialog.innerHTML='<div class="diagramDialogHead"><strong>お話を 図にしよう</strong><button id="closeDiagram" type="button">お話にもどる</button></div><p id="diagramLoading" role="status">図の教材を開いています。</p><iframe id="diagramFrame" title="同じお話で図をつくる教材"></iframe>';
  document.body.append(dialog);
  const frame=$('diagramFrame');
  function key(m){return JSON.stringify([m.id,m.kind,m.a,m.b,m.unknown,m.story,m.question]);}
  function lesson(m){
    if(m.kind==='groups')return {id:'custom',title:m.title,kind:'groups',a:m.values.a,b:m.values.b,unknown:m.unknown,names:{...m.names},units:Object.fromEntries(m.quantities.map(q=>[q.id,q.unit])),story:[...m.story,m.question]};
    const icons={combine:['🌸','🌼'],increase:['🍬','🍬'],decrease:['🍬','🍬'],compare:['⭐','⭐']}[m.kind];
    return {id:'custom',title:m.title,kind:m.kind,left:m.a,right:m.b,unknown:{a:'left',b:'right',total:'total'}[m.unknown],unit:m.unit,iconA:icons[0],iconB:icons[1],nameA:m.names.a,nameB:m.names.b,quantityNames:{left:m.names.a,right:m.names.b,total:m.names.total},story:[...m.story,m.question]};
  }
  function supported(m){return m&&(m.kind==='groups'?m.stage<=2&&[m.values.a,m.values.b].every(n=>Number.isInteger(n)&&n>=1&&n<=12):m.stage<=1&&['combine','increase','decrease','compare'].includes(m.kind)&&[m.a,m.b].every(n=>Number.isInteger(n)&&n>=1&&n<=99));}
  function cleanSvg(xml){
    if(typeof xml!=='string'||xml.length>180000)return null;
    const doc=new DOMParser().parseFromString(xml,'image/svg+xml'),svg=doc.documentElement;
    if(svg.localName!=='svg'||doc.querySelector('parsererror'))return null;
    const tags=new Set(['svg','g','path','rect','circle','line','ellipse','text','tspan','polyline','polygon']);
    const attrs=new Set(['xmlns','viewBox','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','d','points','transform','fill','stroke','stroke-width','stroke-dasharray','font-size','font-family','font-weight','text-anchor','dominant-baseline','opacity']);
    for(const n of [svg,...svg.querySelectorAll('*')]){
      if(!tags.has(n.localName)){n.remove();continue;}
      for(const a of [...n.attributes])if(!attrs.has(a.name)||/url\s*\(|[<>]/i.test(a.value))n.removeAttribute(a.name);
    }
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','900');svg.setAttribute('height','340');
    return new XMLSerializer().serializeToString(svg);
  }
  function showResult(){
    const box=$('returnedDiagram');box.replaceChildren();const result=results[key(model)];if(!result)return;
    const title=document.createElement('p');title.textContent=result.practice?.confirmed?'図の練習で、関係を確かめました。図と式をつなげてみよう。':'持ち帰った図です。範囲と名前を確かめて、式を考えよう。';box.append(title);
    const svg=cleanSvg(result.svg);if(svg){const img=document.createElement('img');img.alt='このお話で作った図';img.className='returnedDiagramImage';img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);box.append(img);}
    else{const note=document.createElement('p');note.textContent='図はまだありません。もう一度開いて描いてみよう。';box.append(note);}
  }
  $('openDiagram').addEventListener('click',()=>{
    requestId=crypto.randomUUID();dialog.showModal();$('diagramLoading').hidden=false;
    frame.src=model.kind==='groups'?'diagram/groups.html?embedded=1':'diagram/index.html?embedded=1';
  });
  function close(){if('speechSynthesis'in window)speechSynthesis.cancel();dialog.close();frame.src='about:blank';$('openDiagram').focus();}
  $('closeDiagram').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.addEventListener('message',event=>{
    const data=event.data;
    const expectedOrigin=location.protocol==='file:'?'null':location.origin;
    if(!dialog.open||event.source!==frame.contentWindow||event.origin!==expectedOrigin||data?.channel!==channel)return;
    if(data.type==='ready'){
      frame.contentWindow.postMessage({channel,type:'start',requestId,lesson:lesson(model)},location.protocol==='file:'?'*':location.origin);$('diagramLoading').hidden=true;
    }else if(data.type==='result'&&data.requestId===requestId){
      const expected=lesson(model),got=data.lesson;
      if(!got||(model.kind==='groups'?['kind','a','b','unknown']:['kind','left','right','unknown']).some(k=>got[k]!==expected[k]))return;
      const practice=data.practice&&['match','repair','draw','groups'].includes(data.practice.mode)?{mode:data.practice.mode,level:data.practice.level,help:data.practice.help,confirmed:data.practice.confirmed===true}:null;
      results[key(model)]={svg:cleanSvg(data.svg),practice,at:new Date().toISOString()};
      const keys=Object.keys(results);keys.slice(0,Math.max(0,keys.length-50)).forEach(k=>delete results[k]);
      try{localStorage.setItem('word-problem-diagrams-v1',JSON.stringify(results));}catch{}
      showResult();close();
    }
  });
  window.WordProblemDiagramBridge={load(m){model=m;panel.hidden=!supported(m);panel.querySelector('p').textContent=m.kind==='groups'?'このお話のまま、一つ分・いくつ分・ぜんぶの関係を図にできます。':'このお話のまま、絵・○・テープ図で考えられます。';if(!panel.hidden)showResult();},clear(){results={};try{localStorage.removeItem('word-problem-diagrams-v1');}catch{}if(model)showResult();}};
})();

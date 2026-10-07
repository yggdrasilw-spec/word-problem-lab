(() => {
  'use strict';
  const $=id=>document.getElementById(id),T=window.TapeLessonEngine,W=window.TapeWorkshopEngine,ns='http://www.w3.org/2000/svg';
  const modes={match:['お話と 図をむすぶ','何の数かを読み、対応する弧をえらぶ'],unknown:['□の場所を かえる','同じ図でも、求める場所で式がかわる'],repair:['まちがった図を 直す','名前と数を動かして、図の関係を確かめる'],draw:['自分で 図をつくる','なぞる・始点だけ・白紙の３段階'],story:['図から お話をつくる','図の数と関係を、自分のことばで伝える'],format:['図の表し方を えらぶ','○・テープ・線分のよさを確かめる']};
  let source=null,state=null,records=[];
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const sv=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=text;return n;};
  const button=(label,fn,cls='')=>{const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;};
  const feedback=text=>$('workshopFeedback').textContent=text;
  function model(){const names=state.mode==='story'&&state.kind!==source.kind?{increase:{nameA:'はじめ',nameB:'ふえた'},decrease:{nameA:'へった',nameB:'のこり'},compare:{nameA:'少ないほう',nameB:'多いほう'},combine:{nameA:'１つめ',nameB:'２つめ'}}[state.kind]:{};return T.model({...source,...names,unknown:state.unknown,kind:state.kind,...(['unknown','story'].includes(state.mode)?{story:[]}: {})});}
  function hide(){$('workshop').hidden=true;$('lessonContent').hidden=false;$('workshopButton').setAttribute('aria-pressed','false');if(window.speechSynthesis)window.speechSynthesis.cancel();}
  function open(data){window.TapeLessonApp.pause();window.TapeExtension.hide();window.TapeIntro.hide();$('intro').hidden=true;$('extension').hidden=true;$('lessonContent').hidden=true;$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('workshop').hidden=false;$('workshopButton').setAttribute('aria-pressed','true');source=T.validate(data||window.TapeLessonApp.current());populate();hub();}
  function populate(){
    $('workshopLesson').replaceChildren();const list=[...window.TAPE_LESSONS];if(!list.some(l=>l.id===source.id))list.push({...source,id:'custom'});
    list.forEach(l=>{const o=node('option','',T.typeNames[l.kind]+'｜'+l.title);o.value=l.id;$('workshopLesson').append(o);});$('workshopLesson').value=source.id||'custom';
  }
  function hub(){
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    $('workshopHub').hidden=false;$('workshopExercise').hidden=true;$('workshopChoices').replaceChildren();
    Object.entries(modes).forEach(([key,[title,description]],i)=>{const b=button('',()=>start(key),'practiceChoice');b.append(node('span','practiceNumber',String(i+1)),node('strong','',title),node('span','',description));$('workshopChoices').append(b);});
    const summary=node('ul');Object.entries(modes).forEach(([key,[title]])=>summary.append(node('li','',`${title}：${records.filter(r=>r.mode===key).length}件`)));$('workshopRecords').replaceChildren(summary,node('p','',records.length?'直近：'+records[records.length-1].title:'記録はまだありません。'));
  }
  function start(mode,level){
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    state={mode,kind:source.kind,unknown:source.unknown,selected:null,mapped:{},assignment:{total:'left',left:'total',right:'right'},level:level||'guided',drawStage:-1,geometry:null,reveal:false,format:'tape',draft:'',saved:false,help:0,recorded:false};
    $('workshopHub').hidden=true;$('workshopExercise').hidden=false;render();
  }
  function record(status,extra={}){
    if(state.recorded)return;state.recorded=true;
    const m=model();records.push({mode:state.mode,title:source.title,kind:m.kind,unknown:m.unknown,status,level:state.mode==='draw'?state.level:undefined,help:state.help,at:new Date().toISOString(),...extra});records=records.slice(-100);
    try{localStorage.setItem('tape-workshop-records-v1',JSON.stringify(records));}catch{feedback('取り組みはできました。この端末では記録を保存できません。');}
  }
  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function svgText(s,x,y,label,cls=''){s.append(sv('text',{x,y,'text-anchor':'middle',class:cls},label));}
  function bar(s,a,b,y,role,style='tape'){
    if(style==='circle'){
      const m=model();if(m.unknown===role&&!state.reveal){svgText(s,(a+b)/2,y+8,'？');return;}
      const count=m[role],width=(b-a)/count,r=Math.max(2,Math.min(11,width*.34));for(let i=0;i<count;i++)s.append(sv('circle',{cx:a+(i+.5)*width,cy:y,r,class:role==='right'||role==='total'&&m.kind==='compare'?'dotB':'dotA'}));return;
    }
    if(style==='line'){s.append(sv('path',{d:`M ${a} ${y-7} V ${y+7} M ${a} ${y} H ${b} M ${b} ${y-7} V ${y+7}`,class:role==='right'||role==='total'&&model().kind==='compare'?'segmentB':'segmentA'}));}
    else s.append(sv('rect',{x:a,y:y-20,width:b-a,height:40,class:role==='right'||role==='total'&&model().kind==='compare'?'tapeB':'tapeA'}));
  }
  function range(s,role,a,b,y,below,label,interactive){
    const g=sv('g',{class:'workshopRange'+(state.selected===role?' selectedRange':''),'data-range':role});
    g.append(sv('path',{d:T.rangeArc(a,b,y,below?14:-14),class:'brace'}));
    g.append(sv('text',{x:(a+b)/2,y:y+(below?40:-24),'text-anchor':'middle'},label));
    if(interactive){
      g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',role==='total'?'全体の弧':role==='left'?'左の部分の弧':'右の部分の弧');
      g.append(sv('rect',{x:a,y:below?y-5:y-53,width:b-a,height:62,class:'rangeHit'}));
      g.addEventListener('click',()=>activateRange(role));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateRange(role);}});
    }
    s.append(g);
  }
  function labelFor(role,m){
    if(state.mode==='repair')return m.label(state.assignment[role]);
    if(state.mode==='match'||state.mode==='draw')return state.mapped[role]?m.label(state.mapped[role]):role==='total'?'ぜんたいの 範囲':'ここに 名前と数';
    return m.label(role,state.reveal||state.mode==='story');
  }
  function figure({interactive=false,geometry=null,style='tape',partial=false}={}){
    const m=model(),s=sv('svg',{viewBox:'0 0 900 340',class:'diagram workshopDiagram',role:'group','aria-label':m.typeName+'の図'});
    const a=geometry?.a??90,b=geometry?.b??810,cut=geometry?.cut??a+(b-a)*m.ratio;
    if(m.kind==='compare'){
      bar(s,a,b,105,'total',style);if(!partial)bar(s,a,cut,220,'left',style);
      if(!partial){range(s,'total',a,b,72,false,labelFor('total',m),interactive);range(s,'left',a,cut,253,true,labelFor('left',m),interactive);range(s,'right',cut,b,205,false,labelFor('right',m),interactive);}
    }else{
      if(partial)bar(s,a,b,140,m.kind==='decrease'?'total':'left',style);
      else{bar(s,a,cut,140,'left',style);bar(s,cut,b,140,'right',style);range(s,'total',a,b,92,false,labelFor('total',m),interactive);range(s,'left',a,cut,180,true,labelFor('left',m),interactive);range(s,'right',cut,b,180,true,labelFor('right',m),interactive);}
    }
    $('workshopScene').append(s);return s;
  }
  function facts(repair=false){
    const m=model();W.roles.forEach(role=>{const label=m.label(repair?state.assignment[role]:role);const b=button(label,e=>{state.selected=role;render();feedback(repair?'この名前と数を、正しい弧へ動かそう。':'この名前と数が表す範囲の弧を タッチしよう。');if(e.detail===0)$('workshopScene').querySelector('[data-range="total"]')?.focus();},'factChip'+(state.selected===role?' selectedFact':'')+(state.mapped[role]===role?' placedFact':''));b.dataset.fact=role;b.setAttribute('aria-pressed',String(state.selected===role));$('workshopFacts').append(b);});
  }
  function activateRange(role){
    if(state.mode==='repair'){
      if(!state.selected){state.selected=role;render();feedback('動かす名前と数をえらんだよ。正しい弧をタッチしよう。');return;}
      const old=state.assignment[role];state.assignment[role]=state.assignment[state.selected];state.assignment[state.selected]=old;state.selected=null;render();feedback('名前と数を入れかえたよ。「たしかめる」で確かめよう。');return;
    }
    if(!state.selected){feedback('先に、お話の名前と数のボタンをえらぼう。');return;}
    if(state.mode==='match'&&state.selected!==role){const m=model();feedback(state.selected==='total'?(m.kind==='decrease'?'へる話の「はじめ」は、出ていった分とのこりを合わせた全体。上の弧を確かめよう。':'この数は２つの部分を合わせた全体。上の弧を確かめよう。'):role==='total'?`「${m.names[state.selected]}」は全体の中の一部分だね。下の弧を確かめよう。`:'２つの部分の、どちらの名前と数かな？お話と弧の両端を確かめよう。');return;}
    const selected=state.selected;
    for(const r of W.roles)if(state.mapped[r]===selected)delete state.mapped[r];state.mapped[role]=selected;state.selected=null;render();
    if(state.mode==='match'&&W.assignments(state.mapped)){feedback('お話の３つのまとまりを、図の範囲とむすべたね。');record('対応を確認');}
    else feedback('この範囲に 名前と数を置いたよ。');
  }
  function addAction(label,fn,cls=''){$('workshopActions').append(button(label,fn,cls));}
  function check(map){const ok=W.assignments(map);feedback(W.feedback(model(),map));if(ok)record('図の関係を確認',state.mode==='draw'?{geometry:state.geometry}:{});}
  function draw(){
    const m=model();const levels=[['guided','なぞる'],['start','始点だけ'],['free','白紙から']];
    levels.forEach(([key,label])=>$('workshopTools').append(button(label,()=>{start('draw',key);},key===state.level?'selectedFact':'')));
    if(state.drawStage===-1){
      $('workshopPrompt').textContent=m.kind==='compare'?'どちらから 描く？':'さいしょは、どこから 描く？';
      $('workshopHint').textContent=m.kind==='decrease'?'出ていった分ものこりも、はじめは同じまとまりに入っていたね。':m.kind==='increase'?'はじめの数に、あとから来た分がつながるね。':'お話のまとまりを、順番に描いてみよう。';
      [['left',m.kind==='compare'?'少ないほうから':'左の部分から'],['total',m.kind==='compare'?'多いほうから':'全体から']].forEach(([role,label])=>addAction(label,()=>{if(role!==m.start){feedback(m.kind==='decrease'?'へる話の「はじめ」は、どちらの部分も入った全体だね。':m.kind==='increase'?'はじめの数は、ふえた分と合わせた全体の一部分だね。':'お話のまとまりを順番に確かめよう。');return;}state.drawStage=0;render();}));return;
    }
    if(state.drawStage===2){$('workshopPrompt').textContent='弧に、名前と数を 置こう';$('workshopHint').textContent='ボタンをえらんで、その範囲の弧をタッチしよう。';facts();figure({interactive:true,geometry:state.geometry});addAction('図を たしかめる',()=>check(state.mapped),'primary');return;}
    const second=state.drawStage===1,partition=second&&m.kind==='decrease',g=state.geometry;
    $('workshopPrompt').textContent=partition?'全体を ２つの部分に 分けよう':second?m.kind==='compare'?'同じ左端から、少ないほうを描こう':'右端から、もう１つの部分をつなごう':m.kind==='decrease'?'はじめの全体を 描こう':m.kind==='compare'?'多いほうの線を 描こう':'左の部分を 描こう';
    $('workshopHint').textContent=partition?'分ける場所をタッチしよう。長さは目安。数のまとまりを残そう。':'左から右へ指で描こう。線のきれいさや、ぴったりの長さは気にしなくて大丈夫。';
    const s=g?figure({geometry:g,partial:true}):sv('svg',{viewBox:'0 0 900 340',class:'diagram workshopDiagram',role:'group','aria-label':'自分で描く図'});if(!g)$('workshopScene').append(s);s.classList.add('workshopDraw');
    const a=g?.a??90,fullEnd=810,guideCut=a+(fullEnd-a)*m.ratio;
    const yy=m.kind==='compare'?(second?220:105):140;
    const guideA=second&&['combine','increase'].includes(m.kind)?g.b:a;
    const guideB=second?m.kind==='compare'?a+(g.b-a)*m.ratio:810:['combine','increase'].includes(m.kind)?guideCut:810;
    const split=g?a+(g.b-a)*m.ratio:guideCut;
    if(state.level==='guided'){
      if(partition)s.append(sv('line',{x1:split,y1:110,x2:split,y2:170,class:'trace'}));
      else s.append(sv('rect',{x:guideA,y:yy-20,width:Math.max(50,guideB-guideA),height:40,class:'trace'}));
    }else if(state.level==='start'&&!partition)s.append(sv('circle',{cx:guideA,cy:yy,r:8,class:'startDot'}));
    const preview=sv('rect',{x:guideA,y:yy-20,width:0,height:40,class:'tapeA'});s.append(preview);let down=null;
    const point=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(s.getScreenCTM().inverse());
    function accept(start,end){const result=W.stroke(m.kind,state.drawStage,state.geometry,start,end);if(!result.ok){feedback(result.message);preview.setAttribute('width',0);return;}state.geometry=result.geometry;state.drawStage++;render();feedback(state.drawStage===2?'まとまりを描けたね。次は名前と数を置こう。':'はじめのまとまりを描けたよ。続きを描こう。');}
    s.addEventListener('pointerdown',e=>{const p=point(e);if(partition){accept(p,p);return;}down=p;s.setPointerCapture(e.pointerId);preview.setAttribute('x',p.x);});
    s.addEventListener('pointermove',e=>{if(!down)return;const p=point(e);preview.setAttribute('width',Math.max(0,p.x-down.x));});
    s.addEventListener('pointerup',e=>{if(!down)return;const p=point(e),start=down;down=null;accept(start,p);});
    s.addEventListener('pointercancel',()=>{down=null;preview.setAttribute('width',0);});
    addAction('お手本と いっしょに描く',()=>{state.help++;const start={x:guideA,y:yy},end={x:partition?split:guideB,y:yy};accept(start,end);});
  }
  function match(){facts();figure({interactive:true});}
  function unknown(){
    const m=model();W.roles.forEach(role=>$('workshopTools').append(button((role==='total'?'全体':m.names[role])+'を □にする',()=>{state.unknown=role;state.reveal=false;state.recorded=false;render();},state.unknown===role?'selectedFact':'')));
    figure();addAction('たし算で 求める',()=>answer('plus'));addAction('ひき算で 求める',()=>answer('minus'));
    if(state.reveal){$('workshopScene').append(node('p','equation',m.equation),node('p','reason',m.reason));}
  }
  function answer(op){const m=model();if((m.unknown==='total'?'plus':'minus')!==op){feedback(m.unknown==='total'?'わからない全体は、２つの部分を合わせると求められるね。':'わからない部分は、全体からわかっている部分を引くと求められるね。');return;}state.reveal=true;render();feedback(m.reason);record('未知の場所と式を確認');}
  function repair(){facts(true);figure({interactive:true});addAction('たしかめる',()=>check(state.assignment),'primary');}
  function story(){
    Object.entries({combine:'あわせる話',increase:'ふえる話',decrease:'へる話',compare:'くらべる話'}).forEach(([kind,label])=>$('workshopTools').append(button(label,()=>{state.kind=kind;state.draft='';state.saved=false;state.recorded=false;render();},state.kind===kind?'selectedFact':'')));
    figure();const label=node('label','storyDraftLabel','この図に合う お話を書こう');const area=node('textarea');area.id='workshopDraft';area.rows=4;area.maxLength=400;area.placeholder='はじめに… / …もらいました / …くばりました';area.value=state.draft;area.addEventListener('input',()=>{state.draft=area.value;state.saved=false;state.recorded=false;});label.append(area);$('workshopScene').append(label);
    addAction('言い出しを 見せる',()=>{state.help++;state.draft=model().lines.join('\n');render();feedback('言い出しを使って、自分のお話に変えてみよう。');});
    addAction('お話を 保存する',()=>{if(!state.draft.trim()){feedback('図の名前と数を使って、お話を１文書いてみよう。');return;}record('お話を保存',{story:state.draft});state.saved=true;feedback('お話を保存しました。図の名前・数・まとまりと合っているか、先生と読み合わせよう。');},'primary');
  }
  function format(){
    [['circle','○図'],['tape','テープ図'],['line','線分図']].forEach(([key,label])=>$('workshopTools').append(button(label+'で 表す',()=>{if(key==='circle'&&source.continuous){feedback('これは長さ。１つずつ数えるものとは違うので、長いテープや線分で表してみよう。');return;}state.format=key;render();feedback(key==='circle'?(model().total>20?'○は１つずつ数を表すね。数が多いと、描いたり数えたりする手間も増えるね。':'○は１つずつ数を表すので、少ない数のまとまりが見やすいね。'):key==='tape'?'テープは、まとまりを面で見られるね。数が多くても、数を書けば表せるね。':'線分は、両端と弧でまとまりを表すね。全体・部分・比較の関係は同じだよ。');},state.format===key?'selectedFact':'')));
    figure({style:state.format});const reason=node('label','storyDraftLabel','この図の よさは？');const area=node('textarea');area.id='formatReason';area.rows=2;area.maxLength=200;area.value=state.draft;area.placeholder='まとまりが見やすい / 数えるとわかる / 少ない線で描ける';area.addEventListener('input',()=>{state.draft=area.value;state.recorded=false;});reason.append(area);$('workshopScene').append(reason);
    addAction('えらんだ理由を 保存する',()=>{if(!state.draft.trim()){feedback('この図のよさを、ひとこと書いてみよう。');return;}record('図の選択理由を保存',{format:state.format,story:state.draft});feedback('図をえらんだ理由を保存したよ。友だちの図とも比べてみよう。');},'primary');
  }
  function render(){
    const m=model();$('workshopTitle').textContent=modes[state.mode][0];$('workshopStory').replaceChildren(...(state.mode==='story'?[`図の名前と数を使って、${T.typeNames[state.kind]}のお話をつくろう。`]:m.lines).map(t=>node('p','',t)));
    for(const id of ['workshopTools','workshopFacts','workshopScene','workshopActions'])$(id).replaceChildren();feedback('');
    const prompts={match:'お話の 名前と数は、どの範囲？',unknown:'求める場所を かえてみよう',repair:'この図の 名前と数を 直そう',draw:'自分で 図をつくろう',story:'図から お話をつくろう',format:'このお話に、どんな図を使う？'};
    const hints={match:'名前と数のボタンをえらび、対応する弧をタッチしよう。',unknown:'□を動かしても、２つの部分と全体の関係は同じです。',repair:'動かしたい名前と数をえらび、正しい弧をタッチすると入れかわります。',draw:'どのくらいの手がかりで描くか、えらべます。',story:'図の全体と部分が、お話でもつながっているかな？',format:'同じ数のまとまりを、いろいろな形で表してみよう。'};
    $('workshopPrompt').textContent=prompts[state.mode];$('workshopHint').textContent=hints[state.mode];
    ({match,unknown,repair,draw,story,format})[state.mode]();
    const hasFigure=!!$('workshopScene').querySelector('svg');$('workshopSaveSvg').disabled=!hasFigure;$('workshopPrint').disabled=!hasFigure;
  }
  $('workshopButton').addEventListener('click',()=>open());$('workshopBack').addEventListener('click',hide);$('workshopMenu').addEventListener('click',hub);
  $('workshopRestart').addEventListener('click',()=>start(state.mode,state.level));
  $('workshopAnother').addEventListener('click',()=>{const list=window.TAPE_LESSONS.filter(l=>l.kind===source.kind),index=list.findIndex(l=>l.id===source.id);source=T.validate(list[(index+1)%list.length]);populate();start(state.mode,state.level);});
  $('workshopLesson').addEventListener('change',()=>{const l=window.TAPE_LESSONS.find(l=>l.id===$('workshopLesson').value);if(l){source=T.validate(l);start(state.mode,state.level);}});
  $('workshopHelp').addEventListener('click',()=>{state.help++;const m=model();feedback(state.mode==='repair'||state.mode==='draw'||state.mode==='match'?(m.kind==='decrease'?'へる話のはじめは、全体。出ていった分とのこりが、その中の２つの部分だよ。':m.kind==='increase'?'ふえる話のはじめは、左の部分。あとから来た分をつなぐと全体になるよ。':m.kind==='compare'?'同じ左端から比べて、右端のあまったところがちがいだよ。':'２つの部分を合わせた範囲が、全体だよ。'):state.mode==='unknown'?'全体なら部分＋部分、部分なら全体−わかっている部分。まず□の場所を見よう。':'弧の両端が、何の数を表しているかを確かめよう。');});
  $('workshopRead').addEventListener('click',()=>{if(!window.speechSynthesis){feedback('この端末では読み上げを使えません。');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($('workshopStory').textContent);u.lang='ja-JP';u.rate=.8;speechSynthesis.speak(u);});
  $('workshopPrint').addEventListener('click',()=>window.print());
  $('workshopSaveSvg').addEventListener('click',()=>{const original=$('workshopScene').querySelector('svg');if(!original)return;const s=original.cloneNode(true);s.setAttribute('xmlns',ns);s.setAttribute('width','900');s.setAttribute('height','340');s.querySelectorAll('.rangeHit').forEach(n=>n.remove());s.querySelectorAll('[tabindex]').forEach(n=>{n.removeAttribute('tabindex');n.removeAttribute('role');});const style=sv('style',{},'text{font-family:Meiryo,sans-serif;font-size:21px;fill:#26384c}.brace{fill:none;stroke:#485d69;stroke-width:2}.tapeA{fill:#d9effb;stroke:#2478b5;stroke-width:3}.tapeB{fill:#ffe7ce;stroke:#c45b20;stroke-width:3}.segmentA{fill:none;stroke:#2478b5;stroke-width:3}.segmentB{fill:none;stroke:#c45b20;stroke-width:3}.dotA{fill:white;stroke:#2478b5;stroke-width:2}.dotB{fill:white;stroke:#c45b20;stroke-width:2}.trace{fill:none;stroke:#728891;stroke-width:2;stroke-dasharray:8 7}.startDot{fill:#18775e}');s.prepend(style);download('my-diagram.svg',new XMLSerializer().serializeToString(s),'image/svg+xml');feedback('いまの図をSVG画像に保存しました。');});
  $('workshopExportRecords').addEventListener('click',()=>download('diagram-practice-records.json',JSON.stringify({version:1,records},null,2),'application/json'));
  try{const saved=JSON.parse(localStorage.getItem('tape-workshop-records-v1')||'[]');if(Array.isArray(saved))records=saved.filter(r=>r&&Object.hasOwn(modes,r.mode)&&typeof r.title==='string'&&r.title.length<100&&typeof r.at==='string').slice(-100);}catch{}
  window.TapeWorkshop={open,hide,integrationResult:()=>state&&source?{lesson:{...source,kind:state.kind,unknown:state.unknown},mode:state.mode,level:state.level,help:state.help,confirmed:state.recorded,geometry:state.geometry}:null};
})();

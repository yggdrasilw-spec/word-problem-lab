(() => {
  'use strict';
  const E=window.TapeLessonEngine,$=id=>document.getElementById(id);
  const lessons=window.TAPE_LESSONS;
  let lesson=lessons[0],m=E.model(lesson),step=0,completed=false,converted=new Set(),timer=null;
  let customImages={};
  let diagramStyle='tape';
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
  function cancel(){clearInterval(timer);timer=null;if(window.speechSynthesis)window.speechSynthesis.cancel();}
  function choose(data,initialStep=0){cancel();window.TapeWorkshop?.hide();window.TapeExtension?.hide();window.TapeIntro?.hide();lesson=E.validate(data);m=E.model(lesson);step=initialStep;diagramStyle='tape';converted.clear();render();}
  function say(text){$('feedback').textContent=text;}
  function finish(text){completed=true;say(text);$('next').disabled=step===8;}
  function group(role,icon,convert=false){
    const box=el('section','objectGroup '+(role==='right'||role==='total'&&m.kind==='compare'?'b':'a'));
    box.append(el('h4','',m.label(role)));
    if(m.unknown===role){box.append(el('div','unknownGroup','？'));box.append(el('p','groupCaption','数が わからない まとまり'));return box;}
    const pieces=el('div','pieces');
    for(let i=0;i<m[role];i++){
      const key=role+':'+i;
      const p=el(convert?'button':'span','piece'+(converted.has(key)?' isCircle':''),icon);
      const imageKey=role==='right'||role==='total'&&m.kind==='compare'?'imageB':'imageA';
      if(m[imageKey]){p.textContent='';const img=el('img');img.src=m[imageKey];img.alt=icon;p.append(img);}
      if(convert){p.type='button';p.dataset.key=key;p.setAttribute('aria-label',`${m.names[role]} ${i+1}つめを ○にする`);p.setAttribute('aria-pressed',converted.has(key)?'true':'false');p.addEventListener('click',()=>convertPiece(p));}
      pieces.append(p);
    }
    box.append(pieces);
    if(convert)box.append(el('p','groupCaption','絵１つに ○１つ。絵を タッチしよう。'));
    return box;
  }
  function convertPiece(p){if(converted.has(p.dataset.key))return;converted.add(p.dataset.key);p.classList.add('isCircle');p.setAttribute('aria-pressed','true');p.setAttribute('aria-label',p.getAttribute('aria-label').replace('○にする','○にした'));checkConverted();}
  function checkConverted(){const all=[...$('scene').querySelectorAll('.piece[data-key]')];const n=all.filter(p=>converted.has(p.dataset.key)).length;say(`○を ${n}こ 描けたよ。`);if(n===all.length)finish('絵と 同じ数の ○に なったね。');}
  function groups(convert=false){
    const wrap=el('div','objects');
    if(m.continuous){const ribbon=el('div','continuous');ribbon.append(el('div','ribbon'));$('scene').append(el('p','sceneHeading',m.label('total')),ribbon,el('p','motionCaption','長さは、長いテープで あらわせるね。'));return;}
    const roles=m.kind==='compare'?['total','left']:m.kind==='decrease'&&(step===0||step===2&&m.unknown!=='total')?['total']:m.kind==='increase'&&step===0?['left']:['left','right'];
    roles.forEach(r=>wrap.append(group(r,r==='right'||r==='total'&&m.kind==='compare'?m.iconB:m.iconA,convert)));
    if(step===1){wrap.classList.add('event',m.kind==='decrease'?'depart':m.kind);}
    $('scene').append(wrap);
    if(step===1){$('scene').append(el('p','motionCaption',m.kind==='increase'?'あとから 来た分を、はじめの分に くっつけます。':m.kind==='decrease'?'はじめの まとまりを、出ていった分と のこりに 分けます。':m.kind==='compare'?'同じ左端から ならべて、１つずつ 組にします。':'２つの まとまりを、あわせます。'));}
  }
  const ns='http://www.w3.org/2000/svg';
  function svgEl(tag,attrs={},text){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=text;return n;}
  function makeSvg(){const lineMode=step>=7&&diagramStyle==='line';const s=svgEl('svg',{viewBox:'0 0 900 300',class:'diagram'+(lineMode?' lineMode':''),role:'img','aria-label':`${m.typeName}の ${step===3?'○':lineMode?'線分':'テープ'}図`});$('scene').append(s);return s;}
  const x=100,w=700,y=115,h=58;
  function rect(s,a,b,c,cl){s.append(svgEl('rect',{x:a,y:b,width:c,height:h,rx:2,class:cl}));const line=svgEl('path',{d:`M ${a} ${b+h/2-8} V ${b+h/2+8} M ${a} ${b+h/2} H ${a+c} M ${a+c} ${b+h/2-8} V ${b+h/2+8}`,class:'segmentShape '+(cl.includes('tapeB')?'segmentB':'segmentA')});s.append(line);}
  function text(s,a,b,t,cl=''){s.append(svgEl('text',{x:a,y:b,'text-anchor':'middle',class:cl},t));}
  function brace(s,a,b,yy,label){s.append(svgEl('path',{d:E.rangeArc(a,b,yy+10),class:'brace'}));text(s,(a+b)/2,yy-12,label);}
  function partArc(s,a,b,yy,label){s.append(svgEl('path',{d:E.rangeArc(a,b,yy,14),class:'brace'}));text(s,(a+b)/2,yy+40,label);}
  function dots(s,role,a,b,yy,cl){
    if(m.unknown===role){text(s,(a+b)/2,yy+8,'？');return;}
    const count=m[role],spacing=(b-a)/Math.max(count,1),r=Math.max(3,Math.min(13,spacing*.35));
    for(let i=0;i<count;i++)s.append(svgEl('circle',{cx:a+spacing*(i+.5),cy:yy,r,class:cl}));
  }
  function dotDiagram(){const s=makeSvg(),cut=x+w*m.ratio;
    if(m.kind==='compare'){
      // Known counts share one scale, so each circle has a matching partner.
      const scale=w/(m.unknown==='total'?m.left+Math.max(3,m.left*.5):m.total);
      dots(s,'total',x,x+scale*m.total,100,'dotB');dots(s,'left',x,x+scale*m.left,190,'dotA');
      brace(s,x,x+scale*m.total,60,m.label('total'));partArc(s,x,x+scale*m.left,212,m.label('left'));
      if(m.unknown==='right')brace(s,x+scale*m.left,x+scale*m.total,150,'ちがい □'+m.unit);
      if(m.unknown==='total'||m.unknown==='left')text(s,450,285,'数が わからない列は「？」で あらわすよ。','labelSmall');
      return;
    }
    if(m.kind==='decrease'&&m.unknown!=='total'){
      const spacing=w/m.total,r=Math.max(3,Math.min(13,spacing*.35));
      for(let i=0;i<m.total;i++){
        const cx=x+spacing*(i+.5);s.append(svgEl('circle',{cx,cy:145,r,class:i<m.left?'dotA':'dotB'}));
        if(i<m.left)s.append(svgEl('line',{x1:cx-r,y1:145+r,x2:cx+r,y2:145-r,stroke:'#2478b5','stroke-width':2}));
      }
      const boundary=x+spacing*m.left;
      brace(s,x,x+w,75,m.label('total'));partArc(s,x,boundary,185,m.label('left'));partArc(s,boundary,x+w,185,m.label('right'));
      text(s,450,280,'出ていった分に しるし。○を 消さずに、はじめの数も 残します。','labelSmall');return;
    }
    dots(s,'left',x,cut,145,'dotA');dots(s,'right',cut,x+w,145,'dotB');
    s.append(svgEl('line',{x1:cut,y1:120,x2:cut,y2:175,class:'partition'}));
    partArc(s,x,cut,185,m.label('left'));partArc(s,cut,x+w,185,m.label('right'));
    brace(s,x,x+w,75,m.label('total'));
    text(s,450,282,'○の まとまりを、長い四角に してみよう。','labelSmall');
  }
  function tapeDiagram(mode='full',labels=false,reveal=false){
    const s=makeSvg(),cut=x+w*m.ratio;
    if(m.kind==='compare'){
      const top=80,lower=185;
      rect(s,x,top,w,'tapeB appears');
      if(mode!=='first')rect(s,x,lower,w*m.ratio,'tapeA appears');
      if(labels){brace(s,x,x+w,65,m.label('total',reveal));partArc(s,x,cut,lower+h+8,m.label('left',reveal));brace(s,cut,x+w,lower+5,m.label('right',reveal));}
      text(s,50,110,'大','labelSmall');if(mode!=='first')text(s,50,215,'小','labelSmall');
    }else{
      if(mode==='first'&&m.start==='left'){rect(s,x,y,w*m.ratio,'tapeA appears');partArc(s,x,x+w*m.ratio,185,m.label('left'));}
      else if(mode==='first'){rect(s,x,y,w,'whole appears');brace(s,x,x+w,75,m.label('total'));}
      else {rect(s,x,y,w*m.ratio,'tapeA appears');rect(s,cut,y,w*(1-m.ratio),'tapeB appears');
        if(labels){brace(s,x,x+w,75,m.label('total',reveal));partArc(s,x,cut,185,m.label('left',reveal));partArc(s,cut,x+w,185,m.label('right',reveal));text(s,450,35,'ぜんたい','labelSmall');text(s,(x+cut)/2,260,'ぶぶん','labelSmall');text(s,(cut+x+w)/2,260,'ぶぶん','labelSmall');}
      }
    }
    return s;
  }
  function startChoice(){
    const isTemporal=['increase','decrease'].includes(m.kind);
    groups();
    const answers=m.kind==='compare'?[['total','多いほうの テープ'],['left','少ないほうの テープ']]:[['left','左の ぶぶんから'],['total','ぜんたいから']];
    answers.forEach(([r,t])=>$('action').append(button(t,e=>{
      if(r===m.start){finish(m.kind==='increase'?'はじめの数は「ぶぶん」。左の部分から 描くよ。':m.kind==='decrease'?'はじめの数は「ぜんたい」。全体から 描くよ。':m.kind==='compare'?'多いほうを描いて、同じ左端から 少ないほうを描くよ。':'１つめのまとまりを描いて、もう１つを つなぐよ。');e.currentTarget.classList.add('correct');}
      else say(isTemporal?(m.kind==='increase'?'はじめの数に、あとから くっつく分が あるね。はじめは 部分かな、全体かな？':'出ていった分も、のこりも、はじめの数に 入っていたね。はじめは 部分かな、全体かな？'):'お話のまとまりを、順番に 描いてみよう。');
    },'choice')));
  }
  function drawing(second){
    const partition=second&&m.kind==='decrease';
    const s=second?tapeDiagram('first'):makeSvg();s.classList.add('drawSurface');s.setAttribute('role','group');s.setAttribute('aria-label',partition?'テープを２つに分ける練習':'左から右へテープを描く練習');
    const cut=x+w*m.ratio;
    const startX=second&&['increase','combine'].includes(m.kind)?cut:x;
    const endX=second?m.kind==='compare'?cut:x+w:m.start==='left'?cut:x+w;
    const yy=second&&m.kind==='compare'?185:m.kind==='compare'?80:y;
    const target={start:startX,end:endX,y:yy};
    if(partition)s.append(svgEl('line',{x1:cut,y1:y-10,x2:cut,y2:y+h+10,class:'trace'}));
    else rect(s,startX,yy,endX-startX,'trace');
    const progress=svgEl('rect',{x:startX,y:yy,width:0,height:h,class:m.kind==='compare'?(second?'tapeA':'tapeB'):second?'tapeB':'tapeA'});if(!partition)s.append(progress);
    let down=null,done=false;
    const coord=e=>{const matrix=s.getScreenCTM();return new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());};
    function complete(){if(done)return;done=true;$('scene').replaceChildren();tapeDiagram(second?'full':'first',second);finish(partition?'ぜんたいを、２つの ぶぶんに 分けられたね。':second?'２つの まとまりが 図に なったね。':'はじめの まとまりを 描けたね。');}
    s.addEventListener('pointerdown',e=>{if(done)return;const p=coord(e);if(partition){if(Math.abs(p.x-cut)<45&&p.y>y-30&&p.y<y+h+30)complete();else say('点線のところで、２つに 分けてみよう。');return;}if(Math.abs(p.x-startX)>65||p.y<yy-35||p.y>yy+h+35){say('点線の左端から 描いてみよう。');return;}down=p;s.setPointerCapture(e.pointerId);});
    s.addEventListener('pointermove',e=>{if(!down||done)return;const p=coord(e);progress.setAttribute('width',Math.max(0,Math.min(endX,p.x)-startX));});
    s.addEventListener('pointerup',e=>{if(!down||done)return;const p=coord(e);down=null;if(p.x>=endX-35)complete();else{progress.setAttribute('width',0);say('もう少し 右まで 描いてみよう。');}});
    s.addEventListener('pointercancel',()=>{down=null;progress.setAttribute('width',0);});
    $('scene').append(el('p','drawingHelp',partition?'点線をタッチして 分けよう。':'点線の左端から、右端まで 指でなぞろう。'));
    $('action').append(button(partition?'ここで 分ける':'いっしょに 描く',complete));
  }
  function render(){
    cancel();completed=!([2,4,5,6].includes(step));if(step===2&&m.continuous)completed=true;
    $('scene').replaceChildren();$('action').replaceChildren();say('');
    $('lessonTitle').textContent=m.title;
    $('types').replaceChildren(...E.kinds.map(k=>button(E.typeNames[k],()=>choose(lessons.find(l=>l.kind===k)),k===m.kind?'active':'')));
    $('progress').replaceChildren(...E.steps.map((t,i)=>{const n=el('li',i===step?'current':i<step?'done':'',t);if(i===step)n.setAttribute('aria-current','step');return n;}));
    $('storyText').replaceChildren(...m.lines.map((t,i)=>el('p','storyLine'+(step<2&&i===step?' current':''),t)));
    $('stepNumber').textContent=`${step+1} / ${E.steps.length}`;
    $('position').textContent=`${step+1} / ${E.steps.length}`;
    $('prev').disabled=step===0;$('next').disabled=!completed||step===8;$('next').textContent=step===7?'式を たしかめる':'つぎへ';
    const prompts=['お話を よんでみよう','お話の 動きを たしかめよう',m.continuous?'長さを テープに しよう':'絵を ○に かえてみよう','○を ならべて 図にしよう',m.kind==='compare'?'どちらの テープから 描く？':'さいしょに 描くところは？',m.kind==='decrease'?'はじめの ぜんたいを 描こう':m.kind==='compare'?'多いほうの テープを 描こう':'左の ぶぶんを 描こう',m.kind==='decrease'?'ぜんたいを ２つに 分けよう':m.kind==='compare'?'少ないほうを 同じ左端から 描こう':'もう１つの ぶぶんを つなごう','名前と 数を 書こう','図から 式を 考えよう'];
    const hints=['どんな まとまりが あるかな？','あわせる？ ふえる？ へる？ くらべる？',m.continuous?'リボンは長さ。１つずつ数える○とは、あらわし方が ちがうね。':'絵が ○に なっても、数と まとまりは かわりません。',m.kind==='compare'?'１つずつ 組にすると、あまったところが ちがいです。':'○の形が ちがっても、まとまりを 同じように 図にできます。',m.kind==='increase'?'「はじめ」に、あとから来た分が くっつきます。':m.kind==='decrease'?'出ていった分も のこりも、もとは「はじめ」に 入っています。':'お話の まとまりを 見てみよう。','点線を なぞって、長い四角を 描こう。',m.kind==='decrease'?'出ていった分と のこりは、どちらも はじめの ぶぶんです。':m.kind==='compare'?'右端の あまった長さが「ちがい」です。':'左のテープの 右端から、つなげます。','わからない数は □。何の数かも 書きます。','わからないのは、ぜんたい？ ぶぶん？'];
    $('prompt').textContent=prompts[step];$('hint').textContent=hints[step];
    if(m.continuous&&step===3){$('prompt').textContent='長さを 図にしよう';$('hint').textContent='はじめの リボンの長さを、１本の テープにします。';}
    if(step<2)groups();
    if(step===2){groups(true);if(!m.continuous){$('action').append(button('１つずつ ○にする',()=>{clearInterval(timer);const queue=[...$('scene').querySelectorAll('.piece[data-key]')].filter(p=>!converted.has(p.dataset.key));let i=0;timer=setInterval(()=>{if(i>=queue.length){clearInterval(timer);timer=null;checkConverted();return;}convertPiece(queue[i++]);},m.left+m.right>30?90:220);}));checkConverted();}}
    if(step===3){if(m.continuous)tapeDiagram('first');else dotDiagram();}
    if(step===4)startChoice();
    if(step===5||step===6)drawing(step===6);
    if(step===7)tapeDiagram('full',true);
    if(step===8){tapeDiagram('full',true,true);$('scene').append(el('p','equation',m.equation),el('p','reason',m.reason),el('p','keyPoint',m.kind==='increase'?'ふえる話の「はじめ」は、ぶぶん。':m.kind==='decrease'?'へる話の「はじめ」は、ぜんたい。':m.kind==='compare'?'ちがいは、組にならずに あまった ぶぶん。':'２つの ぶぶんを あわせると、ぜんたい。'));$('action').append(button('同じお話で もういちど',()=>choose(lesson)),button('べつのお話へ',another));}
    if(step>=7){$('action').append(button(diagramStyle==='tape'?'線分図に してみる':'テープ図に もどす',()=>{diagramStyle=diagramStyle==='tape'?'line':'tape';render();say('線の両端と 弧が、同じ数のまとまりを あらわすよ。');},'viewToggle'));}
    if(step===8)$('action').append(button('この図から 割合・比へ',()=>window.TapeExtension.open('bridge',lesson)));
    if(step===8)$('action').append(button('自分で 図をつくる練習',()=>window.TapeWorkshop.open(lesson)));
    $('lessonSelect').value=lesson.id||'custom';
  }
  function another(){const same=lessons.filter(l=>l.kind===m.kind);const idx=same.findIndex(l=>l.id===lesson.id);choose(same[(idx+1)%same.length]);}
  $('next').addEventListener('click',()=>{if(completed&&step<8){step++;render();}});
  $('prev').addEventListener('click',()=>{if(step>0){step--;render();}});
  $('replay').addEventListener('click',()=>{if(step===2)converted.clear();render();});$('another').addEventListener('click',another);
  $('readStory').addEventListener('click',()=>{if(!window.speechSynthesis){say('この端末では 読み上げを使えません。');return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(m.lines.join('。'));u.lang='ja-JP';u.rate=.8;u.onerror=()=>say('読み上げを使えませんでした。お話を読んで進めます。');window.speechSynthesis.speak(u);});
  $('settingsButton').addEventListener('click',()=>{$('settings').hidden=!$('settings').hidden;$('settingsButton').setAttribute('aria-expanded',String(!$('settings').hidden));if(!$('settings').hidden)fillForm(lesson);});
  lessons.forEach(l=>{const o=el('option','',`${E.typeNames[l.kind]}｜${l.title}${l.source?'（資料 '+l.source+'枚め）':''}`);o.value=l.id;$('lessonSelect').append(o);});const customOption=el('option','','自分でつくった お話');customOption.value='custom';$('lessonSelect').append(customOption);
  $('lessonSelect').addEventListener('change',()=>{const l=lessons.find(l=>l.id===$('lessonSelect').value);if(l){choose(l);fillForm(l);}});
  const fields={kind:'kind',leftValue:'left',rightValue:'right',unknown:'unknown',unit:'unit',iconA:'iconA',iconB:'iconB',nameA:'nameA',nameB:'nameB',title:'title'};
  function fillForm(l){customImages={};for(const k of ['imageA','imageB']){if(l[k])customImages[k]=l[k];$(k).value='';}Object.entries(fields).forEach(([id,key])=>$(id).value=l[key]);$('story').value=(l.story||[]).join('\n');guide();}
  function formData(){const d={id:'custom',...customImages};Object.entries(fields).forEach(([id,key])=>d[key]=['left','right'].includes(key)?Number($(id).value):$(id).value.trim());d.story=$('story').value.split('\n').map(s=>s.trim()).filter(Boolean);d.continuous=d.unit==='m'||d.unit==='cm';return E.validate(d);}
  function guide(){const k=$('kind').value;$('numberGuide').textContent=k==='decrease'?'左＝出ていった数、右＝のこり。はじめの数は 左＋右です。':k==='increase'?'左＝はじめの数、右＝ふえた数。ぜんぶの数は 左＋右です。':k==='compare'?'左＝少ないほうの数、右＝ちがい。多いほうの数は 左＋右です。':'左＝１つめのまとまり、右＝２つめのまとまり。ぜんぶは 左＋右です。';}
  $('kind').addEventListener('change',guide);
  $('customForm').addEventListener('submit',e=>{e.preventDefault();try{const d=formData();choose(d);localStorage.setItem('tape-lesson-v1',JSON.stringify(d));$('settingsMessage').textContent='お話を作りました。設定はこの端末にも保存しました。';$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');}catch(err){$('settingsMessage').textContent=err.message;}});
  $('export').addEventListener('click',()=>{try{const d=formData();const url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='tape-lesson.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('settingsMessage').textContent='設定をJSONファイルに保存しました。';}catch(e){$('settingsMessage').textContent=e.message;}});
  $('import').addEventListener('change',async()=>{try{const f=$('import').files[0];if(!f)return;if(f.size>3000000)throw Error('設定ファイルは3MBまでです。');const d=E.validate(JSON.parse(await f.text()));d.id='custom';choose(d);fillForm(d);$('settingsMessage').textContent='設定を読みこみました。';}catch(e){$('settingsMessage').textContent='読みこめませんでした。'+e.message;}finally{$('import').value='';}});
  ['imageA','imageB'].forEach(key=>$(key).addEventListener('change',async()=>{try{const f=$(key).files[0];if(!f)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type)||f.size>1000000)throw Error('画像はPNG・JPEG・WebP・GIF（1MBまで）にしてください。');customImages[key]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f);});$('settingsMessage').textContent='画像を選びました。「このお話で はじめる」で使えます。';}catch(e){$('settingsMessage').textContent=e.message;}}));
  $('clearImages').addEventListener('click',()=>{customImages={};$('imageA').value='';$('imageB').value='';$('settingsMessage').textContent='絵文字を使います。';});
  try{const saved=localStorage.getItem('tape-lesson-v1');if(saved){const o=el('option','','端末に保存した お話');o.value='saved';$('lessonSelect').append(o);$('lessonSelect').addEventListener('change',()=>{if($('lessonSelect').value==='saved'){try{const d=E.validate(JSON.parse(saved));choose(d);fillForm(d);}catch{ $('settingsMessage').textContent='保存した設定を読みこめませんでした。';}}});}}catch{}
  window.TapeLessonApp={start:choose,pause:cancel,current:()=>({...lesson})};
  guide();render();
})();

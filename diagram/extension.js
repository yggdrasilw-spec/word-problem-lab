(() => {
  'use strict';
  const $=id=>document.getElementById(id),E=window.TapeExtensionEngine,T=window.TapeLessonEngine,ns='http://www.w3.org/2000/svg';
  const titles={bridge:'テープ図から 線分図へ',percent:'２本の線で 割合を あらわす',ratio:'同じ１つ分で 比を あらわす'};
  let mode='bridge',bridgeLesson=null,lineMode=false,revealed=false,percent={base:20,compared:8,unknown:'ratio',unit:'冊'},ratio={a:2,b:3,total:30,unit:'こ'};
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const sv=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=text;return n;};
  const fmt=n=>{const v=Number(n.toFixed(4));return (Math.abs(v-n)>1e-9?'約':'')+v;};
  const btn=(label,fn,cls='')=>{const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);$('extensionActions').append(b);return b;};
  function hide(){$('extension').hidden=true;$('extendButton').setAttribute('aria-pressed','false');$('lessonContent').hidden=false;}
  function open(nextMode='bridge',data){window.TapeWorkshop?.hide();window.TapeLessonApp.pause();window.TapeIntro.hide();$('intro').hidden=true;$('lessonContent').hidden=true;$('extension').hidden=false;$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('extendButton').setAttribute('aria-pressed','true');bridgeLesson=data||window.TapeLessonApp.current();mode=nextMode;lineMode=false;revealed=false;render();}
  function make(){const s=sv('svg',{viewBox:'0 0 900 380',class:'diagram extensionDiagram'+(lineMode?' lineMode':''),role:'img','aria-label':titles[mode]});$('extensionScene').append(s);return s;}
  function text(s,x,y,value,cls=''){s.append(sv('text',{x,y,'text-anchor':'middle',class:cls},value));}
  function arc(s,a,b,y,label,below=false){s.append(sv('path',{d:T.rangeArc(a,b,y,below?14:-14),class:'brace'}));text(s,(a+b)/2,y+(below?40:-24),label);}
  function line(s,a,b,y,cls='segmentA'){s.append(sv('path',{d:`M ${a} ${y-8} V ${y+8} M ${a} ${y} H ${b} M ${b} ${y-8} V ${y+8}`,class:cls+' extensionLine'}));}
  function tape(s,a,b,y,cls){s.append(sv('rect',{x:a,y:y-24,width:b-a,height:48,class:cls}));line(s,a,b,y,cls==='tapeA'?'segmentA':'segmentB');}
  function mark(s,x,y,label){s.append(sv('line',{x1:x,y1:y-8,x2:x,y2:y+8,class:'numberMark'}));if(label!==undefined)text(s,x,y+35,label);}
  function field(id,label,value,opts){
    const wrap=node('label','',label);let input;
    if(opts){input=node('select');opts.forEach(([v,t])=>{const o=node('option','',t);o.value=v;input.append(o);});}
    else{input=node('input');input.type=typeof value==='number'?'number':'text';if(input.type==='number'){input.min='0';input.max='2000';input.step='any';}else input.maxLength=8;}
    input.id=id;input.value=String(value);input.required=true;wrap.append(input);$('extensionFields').append(wrap);
  }
  function bridge(){
    const m=T.model(bridgeLesson),s=make(),a=90,b=810,cut=a+(b-a)*m.ratio;
    $('extensionStory').textContent=`${m.label('total',true)}。長い四角も 線分も、同じ数のまとまりを あらわします。`;
    $('extensionHint').textContent='テープの はばを なくしてみよう。両端の場所と 弧の範囲は そのままです。';
    if(m.kind==='compare'){
      tape(s,a,b,125,'tapeB');tape(s,a,cut,255,'tapeA');arc(s,a,b,88,m.label('total',true));arc(s,a,cut,289,m.label('left',true),true);arc(s,cut,b,232,m.label('right',true));
    }else{
      tape(s,a,cut,165,'tapeA');tape(s,cut,b,165,'tapeB');arc(s,a,b,112,m.label('total',true));arc(s,a,cut,207,m.label('left',true),true);arc(s,cut,b,207,m.label('right',true),true);
    }
    btn(lineMode?'テープの はばを もどす':'テープを 線分にする',()=>{lineMode=!lineMode;render();$('extensionFeedback').textContent='形をかえても、部分と全体の関係は かわらないね。';},'primary');
    btn('２本の線で 割合を見てみる',()=>{mode='percent';revealed=false;render();});
    $('extensionSettings').hidden=true;
  }
  function percentView(){
    const m=E.percent(percent),s=make(),a=140,width=640,end=a+width,baseX=a+width/m.scale,partX=a+width*m.ratio/m.scale;
    const show=(role,n)=>!revealed&&m.unknown===role?'□':fmt(n);
    const upperBase=show('base',m.base)+m.unit,upperPart=show('compared',m.compared)+m.unit;
    const r=show('ratio',m.ratio),p=show('ratio',m.percent);
    $('extensionStory').textContent=`もとにする量は ${upperBase}。くらべる量は ${upperPart}。${m.unknown==='ratio'?'':`割合は ${fmt(m.ratio)}倍（${fmt(m.percent)}％）。`}`;
    $('extensionHint').textContent=m.question+' 同じ位置が、対応する量と割合を あらわします。';
    line(s,a,end,115);line(s,a,end,260,'segmentB');
    text(s,60,113,'量');text(s,60,258,'割合');
    mark(s,a,115,'0');mark(s,a,260,'0');
    // Value/rate pairs retain the same x-coordinate, including values over 100%.
    s.append(sv('line',{x1:baseX,y1:70,x2:baseX,y2:270,class:'correspondence baseCorrespondence'}));
    s.append(sv('line',{x1:partX,y1:105,x2:partX,y2:270,class:'correspondence partCorrespondence'}));
    mark(s,baseX,115);mark(s,baseX,260);mark(s,partX,115);mark(s,partX,260);
    // Stagger labels vertically when two corresponding positions are close.
    text(s,baseX,70,upperBase);text(s,partX,155,upperPart);
    text(s,baseX,220,'1（100％）');text(s,partX,310,`${r}倍（${p}％）`);
    if(partX>a+20)arc(s,a,partX,185,m.unknown==='ratio'&&!revealed?'くらべる量の範囲':`${r}倍の範囲`);
    text(s,450,365,'もとにする量を「1」と 見ます。','labelSmall');
    btn(revealed?'答えを かくす':'図から 式をたしかめる',()=>{revealed=!revealed;render();},'primary');
    const swap=btn('もとにする量を 入れかえる',()=>{percent={...percent,base:m.compared,compared:m.base,unknown:'ratio'};revealed=false;render();});swap.disabled=m.compared<1||m.compared>1000;
    if(revealed){
      const equation=m.unknown==='ratio'?`${fmt(m.compared)} ÷ ${fmt(m.base)} ＝ ${fmt(m.ratio)}倍`:m.unknown==='compared'?`${fmt(m.base)} × ${fmt(m.ratio)} ＝ ${fmt(m.compared)}${m.unit}`:`${fmt(m.compared)} ÷ ${fmt(m.ratio)} ＝ ${fmt(m.base)}${m.unit}`;
      $('extensionScene').append(node('p','equation',equation));
      $('extensionFeedback').textContent='くらべる量 ÷ もとにする量 ＝ 割合。もとにする量をかえると、割合もかわります。';
    }
    field('extBase','もとにする量',m.base);field('extCompared','くらべる量',m.compared);field('extUnit','単位',m.unit);field('extUnknown','求めるもの',m.unknown,[['ratio','割合'],['compared','くらべる量'],['base','もとにする量']]);
    const examples=node('div','extensionExamples');[['40％',20,8],['100％',20,20],['150％',20,30]].forEach(([name,base,compared])=>{const b=node('button','',name+'の例');b.type='button';b.addEventListener('click',()=>{percent={...percent,base,compared,unknown:'ratio'};revealed=false;render();});examples.append(b);});$('extensionScene').append(examples);
  }
  function ratioView(){
    const m=E.ratio(ratio),s=make(),a=110,unitWidth=640/Math.max(m.a,m.b),leftEnd=a+m.a*unitWidth,rightEnd=a+m.b*unitWidth;
    s.classList.add('ratioDiagram');
    $('extensionStory').textContent=`${m.total}${m.unit}を、赤：青 ＝ ${m.a}：${m.b}に 分けます。赤と青は それぞれ何${m.unit}？`;
    $('extensionHint').textContent=`同じ大きさの「１つ分」が、赤は${m.a}こ分、青は${m.b}こ分。ぜんぶで${m.shares}こ分です。`;
    [[m.a,leftEnd,110,'tapeA','赤',m.left],[m.b,rightEnd,260,'tapeB','青',m.right]].forEach(([n,end,y,cl,name,value])=>{
      tape(s,a,end,y,cl);for(let i=1;i<n;i++)mark(s,a+i*unitWidth,y);
      text(s,55,y+8,name);arc(s,a,end,y-40,`${n}こ分`);text(s,(a+end)/2,y+65,revealed?`${value}${m.unit}`:`□${m.unit}`);
    });
    for(let i=0;i<=Math.min(m.a,m.b);i++)s.append(sv('line',{x1:a+i*unitWidth,y1:135,x2:a+i*unitWidth,y2:235,class:'correspondence'}));
    btn(lineMode?'テープ図に もどす':'２本の 線分図にする',()=>{lineMode=!lineMode;render();});
    btn(revealed?'数を かくす':'１つ分から 数を求める',()=>{revealed=!revealed;render();},'primary');
    if(revealed){$('extensionScene').append(node('p','reason',`１つ分：${m.total} ÷（${m.a} ＋ ${m.b}）＝ ${m.one}${m.unit}`),node('p','reason',`赤：${m.one} × ${m.a} ＝ ${m.left}${m.unit}　青：${m.one} × ${m.b} ＝ ${m.right}${m.unit}`));$('extensionFeedback').textContent=`${m.a}：${m.b}は、ぜんぶを${m.shares}こ分と見る比。赤の割合は ${m.a}/${m.shares}、青の割合は ${m.b}/${m.shares}です。`;}
    field('extA','赤の こ分',m.a);field('extB','青の こ分',m.b);field('extTotal','ぜんぶの数',m.total);field('extUnit','単位',m.unit);
  }
  function render(){
    $('extensionModes').replaceChildren();Object.entries(titles).forEach(([key,title])=>{const b=node('button',key===mode?'active':'',title);b.type='button';b.addEventListener('click',()=>{mode=key;lineMode=false;revealed=false;render();});$('extensionModes').append(b);});
    $('extensionTitle').textContent=titles[mode];$('extensionScene').replaceChildren();$('extensionActions').replaceChildren();$('extensionFields').replaceChildren();$('extensionFeedback').textContent='';$('extensionError').textContent='';$('extensionSettings').hidden=false;
    if(mode==='bridge')bridge();else if(mode==='percent')percentView();else ratioView();
  }
  $('extensionSettings').addEventListener('submit',e=>{e.preventDefault();try{
    const unit=$('extUnit').value.trim();if(!unit||unit.length>8)throw Error('単位を1〜8文字で入力してください。');
    if(mode==='percent'){const data={base:Number($('extBase').value),compared:Number($('extCompared').value),unknown:$('extUnknown').value,unit};E.percent(data);percent=data;}
    else{const data={a:Number($('extA').value),b:Number($('extB').value),total:Number($('extTotal').value),unit};E.ratio(data);ratio=data;}
    revealed=false;render();
  }catch(error){$('extensionError').textContent=error.message;}});
  $('extendButton').addEventListener('click',()=>open());$('extensionBack').addEventListener('click',hide);$('extensionRestart').addEventListener('click',()=>{lineMode=false;revealed=false;render();});
  window.TapeExtension={open,hide};
})();

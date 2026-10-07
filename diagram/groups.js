(function(root){
  'use strict';
  function validate(data){
    if(!data||data.kind!=='groups'||!['a','b','total'].includes(data.unknown)||![data.a,data.b].every(n=>Number.isInteger(n)&&n>=1&&n<=12))throw Error('同じ一つ分のお話を確認してください。');
    for(const map of ['names','units'])for(const role of ['a','b','total'])if(typeof data[map]?.[role]!=='string'||!data[map][role].trim()||data[map][role].length>80)throw Error('量の名前と単位を確認してください。');
    if(!Array.isArray(data.story)||data.story.length>4||data.story.some(s=>typeof s!=='string'||s.length>500))throw Error('お話を確認してください。');
    return {...data,total:data.a*data.b};
  }
  const api={validate,startRole:data=>data.unknown==='total'?'a':'total'};
  if(typeof module!=='undefined')module.exports=api;root.TapeGroupsEngine=api;
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg',embedded=parent!==window;
  let lesson=null,requestId='',stage=0,selected=null,mapped={},confirmed=false,help=0;
  const sv=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
  const send=data=>parent.postMessage({channel:'diagram-bridge-v1',...data},location.protocol==='file:'?'*':location.origin);
  function button(text,run,role){const b=document.createElement('button');b.textContent=text;b.type='button';if(role)b.dataset.fact=role;b.onclick=run;$('tools').append(b);return b;}
  function say(s){$('status').textContent=s;}
  function label(role){return lesson.names[role]+' '+(role===lesson.unknown?'□':lesson[role])+lesson.units[role];}
  function range(svg,role,a,b,y,below){
    const g=sv('g',{'data-range':role,role:'button',tabindex:'0','aria-label':lesson.names[role]+'の範囲'});
    g.append(sv('path',{d:`M ${a} ${y} Q ${(a+b)/2} ${y+(below?28:-28)} ${b} ${y}`,class:'groupArc'}),sv('text',{x:(a+b)/2,y:y+(below?48:-24),'text-anchor':'middle',class:'groupText'},mapped[role]?label(mapped[role]):'名前と数を 置こう'));
    g.append(sv('rect',{x:a,y:below?y:y-62,width:b-a,height:62,class:'groupHit'}));
    const activate=()=>{if(!selected){say('先に名前と数のボタンをえらぼう。');return;}mapped[role]=selected;selected=null;confirmed=false;render();};
    g.onclick=activate;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};svg.append(g);
  }
  function figure(){
    const s=sv('svg',{viewBox:'0 0 900 340',class:'groupFigure',xmlns:ns,'aria-label':'同じ一つ分といくつ分と全体の図'}),count=lesson.unknown==='b'?null:lesson.b;
    if(count){
      const w=720/count;for(let i=0;i<count;i++)s.append(sv('rect',{x:90+i*w,y:130,width:w,height:50,class:'groupTape'}));
      range(s,'a',90,90+w,198,true);
    }else{
      // Keep the whole and one-unit sample separate: even one or two groups
      // must remain possible, without an apparent number of repeated boxes.
      s.append(sv('rect',{x:90,y:130,width:720,height:50,class:'groupTape'}),sv('rect',{x:90,y:205,width:180,height:40,class:'groupTape'}),sv('text',{x:450,y:164,'text-anchor':'middle',class:'groupText'},'…'));
      range(s,'a',90,270,270,true);
    }
    range(s,'total',90,810,108,false);range(s,'b',90,810,count?270:198,true);$('figure').replaceChildren(s);
  }
  function render(){
    $('tools').replaceChildren();$('figure').replaceChildren();$('check').hidden=stage!==2;
    if(stage===0){
      $('prompt').textContent='はじめに、どのまとまりを描く？';$('hint').textContent=lesson.unknown==='total'?'同じ一皿分が、いくつもあるお話だね。':'分ける前のぜんぶは、分かっているね。';
      for(const role of ['a','total'])button(lesson.names[role]+'から',()=>{if(role!==api.startRole(lesson)){help++;say(lesson.unknown==='total'?'一つ分を決めて、それを同じ大きさで並べよう。':'分ける前の全体から描こう。わからない量が一つ分か、いくつ分かを確かめよう。');return;}stage=1;say('');render();});
    }else if(stage===1){
      $('prompt').textContent=lesson.unknown==='a'?'分かっている皿の数に、同じ数ずつ分けよう':lesson.unknown==='b'?'分かっている一皿分ずつ、区切ろう':'同じ一皿分を、皿の数だけ並べよう';
      $('hint').textContent=lesson.unknown==='a'?'一皿に入る数が、まだわからないね。':lesson.unknown==='b'?'いくつ分になるかはまだ□。図の途中は「…」で省略するよ。':'どのまとまりも同じ一皿分だね。';
      const initial=api.startRole(lesson),s=sv('svg',{viewBox:'0 0 900 340',class:'groupFigure',xmlns:ns}),end=initial==='total'?810:90+720/lesson.b;
      s.append(sv('rect',{x:90,y:130,width:end-90,height:50,class:'groupTape'}),sv('path',{d:`M 90 108 Q ${(90+end)/2} 80 ${end} 108`,class:'groupArc'}),sv('text',{x:(90+end)/2,y:80,'text-anchor':'middle',class:'groupText'},label(initial)));$('figure').append(s);
      button('まとまりを 図にする',()=>{stage=2;say('');render();});
    }else{
      $('prompt').textContent='弧に、名前と数を置こう';$('hint').textContent=lesson.unknown==='b'?'上はぜんぶ、下の短いテープは一皿分の見本。「…」は省略。枠や長さから皿の数は読み取りません。':'一皿分と、皿の数と、ぜんぶ。それぞれの単位も見よう。';
      for(const role of ['a','b','total']){const b=button(label(role),()=>{selected=role;render();say('対応する弧をえらぼう。');},role);if(selected===role)b.className='selected';}
      figure();
    }
  }
  $('check').onclick=()=>{confirmed=['a','b','total'].every(r=>mapped[r]===r);if(!confirmed){help++;say('一皿分・いくつ分・ぜんぶの範囲と、数の単位をもう一度見よう。');}else say('同じ一つ分と、いくつ分と、ぜんぶがつながったね。お話にもどって式を考えよう。');};
  function start(data){lesson=validate(data);stage=0;selected=null;mapped={};confirmed=false;help=0;$('story').replaceChildren(...lesson.story.map(t=>{const p=document.createElement('p');p.textContent=t;return p;}));say('');render();}
  $('restart').onclick=()=>{if(lesson)start(lesson);};
  $('back').onclick=()=>{
    if(!lesson)return;const s=$('figure').querySelector('svg')?.cloneNode(true);
    if(s){s.querySelectorAll('.groupHit').forEach(n=>n.remove());s.querySelectorAll('[tabindex]').forEach(n=>{n.removeAttribute('tabindex');n.removeAttribute('role');});
      // Return attributes rather than CSS, so the parent can sanitize the SVG.
      s.querySelectorAll('.groupArc').forEach(n=>{n.setAttribute('fill','none');n.setAttribute('stroke','#485d69');n.setAttribute('stroke-width','2');});s.querySelectorAll('.groupTape').forEach(n=>{n.setAttribute('fill','#d9effb');n.setAttribute('stroke','#2478b5');n.setAttribute('stroke-width','2');});s.querySelectorAll('text').forEach(n=>{n.setAttribute('font-size','32');n.setAttribute('font-family','Meiryo,sans-serif');n.setAttribute('fill','#26384c');});}
    if(embedded)send({type:'result',requestId,lesson,svg:s?new XMLSerializer().serializeToString(s):null,practice:{mode:'groups',confirmed,help}});
    else say('この図を見て、一皿分・いくつ分・ぜんぶの関係を式にしてみよう。');
  };
  window.addEventListener('message',e=>{const d=e.data;if(e.source!==parent||e.origin!==(location.protocol==='file:'?'null':location.origin)||d?.channel!=='diagram-bridge-v1'||d.type!=='start')return;try{requestId=d.requestId;start(d.lesson);}catch{say('このお話を開けませんでした。');}});
  if(embedded)send({type:'ready'});else{
    $('back').textContent='図から 式を考えよう';$('groupsSettings').hidden=false;
    function standalone(){try{const a=Number($('groupsA').value),b=Number($('groupsB').value),unknown=$('groupsUnknown').value,names={a:'一皿分',b:'お皿の数',total:'ぜんぶ'},units={a:'こ',b:'皿',total:'こ'};
      const story=unknown==='total'?[`あめが一皿に${a}こずつ、${b}皿あります。`]:unknown==='a'?[`${a*b}このあめを、${b}皿に同じ数ずつ分けます。`]:[`${a*b}このあめを、一皿${a}こずつ取り分けます。`];story.push(`${names[unknown]}は何${units[unknown]}でしょう。`);start({kind:'groups',title:'同じ一皿分',a,b,unknown,names,units,story});}catch(e){say(e.message);}}
    $('groupsSettings').onsubmit=e=>{e.preventDefault();standalone();};$('groupsUnknown').onchange=standalone;standalone();
  }
})(typeof window==='undefined'?globalThis:window);

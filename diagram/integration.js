/* Optional same-origin embedding contract, version 1. Standalone use is unchanged. */
(() => {
  'use strict';
  if(window.parent===window||new URLSearchParams(location.search).get('embedded')!=='1')return;
  let request=null;
  const send=data=>parent.postMessage({channel:'diagram-bridge-v1',...data},location.protocol==='file:'?'*':location.origin);
  const style=document.createElement('style');
  style.textContent='body.embeddedLesson header .home,body.embeddedLesson #settingsButton,body.embeddedLesson #extendButton,body.embeddedLesson #another,body.embeddedLesson #workshopAnother,body.embeddedLesson #workshopLesson,body.embeddedLesson #workshopMenu{display:none!important}.integrationBar{position:sticky;top:0;z-index:20;padding:10px;background:#fff;border-bottom:2px solid #18775e;display:flex;gap:12px;align-items:center;flex-wrap:wrap}';
  document.head.append(style);document.body.classList.add('embeddedLesson');
  document.querySelector('.groupsStandaloneLink')?.remove();
  const bar=document.createElement('div');bar.className='integrationBar';
  const caption=document.createElement('span');caption.textContent='同じお話で、図をつくろう';
  const back=document.createElement('button');back.textContent='この図を お話へもどす';
  const original=document.createElement('button');original.textContent='もとのお話の図へ';
  original.addEventListener('click',()=>{if(request)window.TapeLessonApp.start(request.lesson);});
  bar.append(caption,original,back);document.body.prepend(bar);
  back.addEventListener('click',()=>{
    if(!request)return;
    const workshop=document.getElementById('workshop');
    const inWorkshop=workshop&&!workshop.hidden;
    const result=inWorkshop?window.TapeWorkshop.integrationResult():null;
    const lesson=result?.lesson||window.TapeLessonApp.current();
    // Reject a different exercise (e.g. an introductory demonstration).
    if(lesson.kind!==request.lesson.kind||lesson.left!==request.lesson.left||lesson.right!==request.lesson.right||lesson.unknown!==request.lesson.unknown){caption.textContent='もとのお話の図にもどってから、もどそう。';return;}
    const svg=(inWorkshop?document.getElementById('workshopScene'):document.getElementById('scene')).querySelector('svg');
    const clone=svg?.cloneNode(true);
    if(clone){
      const originals=[svg,...svg.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
      copies.forEach((n,i)=>{const cs=getComputedStyle(originals[i]);for(const key of ['fill','stroke','stroke-width','font-size','font-family','font-weight','stroke-dasharray'])n.setAttribute(key,cs.getPropertyValue(key));});
    }
    clone?.querySelectorAll('.rangeHit,.drawHit,[tabindex]').forEach(n=>{if(n.classList.contains('rangeHit')||n.classList.contains('drawHit'))n.remove();else{n.removeAttribute('tabindex');n.removeAttribute('role');}});
    send({type:'result',requestId:request.requestId,lesson,svg:clone?new XMLSerializer().serializeToString(clone):null,practice:result?{mode:result.mode,level:result.level,help:result.help,confirmed:result.confirmed}:null});
  });
  window.addEventListener('message',event=>{
    const data=event.data;
    const expectedOrigin=location.protocol==='file:'?'null':location.origin;
    if(event.source!==parent||event.origin!==expectedOrigin||data?.channel!=='diagram-bridge-v1'||data.type!=='start')return;
    try{
      const lesson=window.TapeLessonEngine.validate(data.lesson);
      request={requestId:data.requestId,lesson};
      window.TapeLessonApp.start(lesson);
      caption.textContent=lesson.title;
    }catch{caption.textContent='このお話を開けませんでした。閉じて、もう一度開いてください。';}
  });
  send({type:'ready'});
})();

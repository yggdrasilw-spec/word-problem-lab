(() => {
  'use strict';
  const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
  let step=0,drawn=0,interval=null;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const svg=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  const action=(id,text,fn)=>{const b=node('button','',text);b.id=id;b.type='button';b.addEventListener('click',fn);$('introActions').append(b);return b;};
  function cancel(){clearInterval(interval);interval=null;}
  function ready(text){$('introNext').disabled=false;$('introFeedback').textContent=text;}
  function hide(){cancel();$('intro').hidden=true;$('lessonContent').hidden=false;$('introButton').setAttribute('aria-pressed','false');}
  function open(){window.TapeWorkshop?.hide();window.TapeExtension?.hide();window.TapeLessonApp.pause();cancel();step=0;drawn=0;$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('intro').hidden=false;$('lessonContent').hidden=true;$('introButton').setAttribute('aria-pressed','true');render();}
  function groups(a,b,pictures=false,ghost=false){
    const wrap=node('div','objects introGroups');
    [[a,'赤い花','a','assets/red-flower.png'],[b,'白い花','b','assets/white-flower.png']].forEach(([count,name,cls,image])=>{
      const group=node('section','objectGroup '+cls);group.append(node('h3','',`${name} ${count}本`));const pieces=node('div','introPieces');
      for(let i=0;i<count;i++){const p=node('span','introDot'+(ghost?' ghost':''));p.dataset.index=String((cls==='a'?0:a)+i);if(pictures){p.classList.add('flower');const img=node('img');img.src=image;img.alt=name;p.append(img);}pieces.append(p);}
      group.append(pieces);wrap.append(group);
    });$('introScene').append(wrap);
  }
  function drawOne(){
    const dot=$('introScene').querySelector(`.introDot[data-index="${drawn}"]`);if(!dot)return;dot.classList.remove('ghost');drawn++;
    $('introFeedback').textContent=`○を ${drawn}こ 描いたよ。あと ${55-drawn}こ。`;
    if(drawn>=5)$('introNext').disabled=false;
    if(drawn===55){cancel();$('introDraw').disabled=true;$('introAuto').disabled=true;ready('55この○を 描いたね。小さい数のときより 手間が かかったね。');}
  }
  function transformation(joined=false){
    const s=svg('svg',{viewBox:'0 0 900 270',class:'diagram introTape',role:'img','aria-label':'赤い花38本と白い花17本のまとまりをテープで表す'});
    const left=62,partA=494,partB=221,gap=joined?0:50,startB=left+partA+gap;
    [[38,left,partA,'a','赤い花 38本'],[17,startB,partB,'b','白い花 17本']].forEach(([count,x,width,cls,label])=>{
      s.append(svg('rect',{x,y:114,width,height:52,class:cls==='a'?'tapeA':'tapeB'}));
      for(let i=0;i<count;i++)s.append(svg('circle',{cx:x+(i+.5)*width/count,cy:140,r:4.5,class:cls==='a'?'dotA':'dotB'}));
      s.append(svg('path',{d:window.TapeLessonEngine.rangeArc(x,x+width,180,14),class:'brace'}));
      s.append(svg('text',{x:x+width/2,y:220,'text-anchor':'middle'},label));
    });
    if(joined){s.classList.add('morphed');s.append(svg('path',{d:window.TapeLessonEngine.rangeArc(left,left+partA+partB,92),class:'brace'}));s.append(svg('text',{x:left+(partA+partB)/2,y:58,'text-anchor':'middle'},'ぜんぶで □本'));}
    $('introScene').append(s);return s;
  }
  function render(){
    cancel();$('introScene').replaceChildren();$('introActions').replaceChildren();$('introFeedback').textContent='';$('introNext').disabled=[0,1,3].includes(step);$('introPrev').disabled=step===0;$('introNext').textContent=step===4?'テープ図を 描いてみる':'つぎへ';$('introPosition').textContent=`${step+1} / 5`;
    const titles=['少ない数なら、○図が べんり','数が 多くなったら？','○を１つずつ 描くのは たいへん','まとまりを 長い四角で あらわそう','２本のテープでも、同じお話が わかる'];
    const hints=['絵１つを ○１つにすると、数のまとまりが わかりやすいね。','赤い花に38こ、白い花に17こ。○を１つずつ 描いてみよう。','たくさん描くと 時間がかかり、描き忘れや 数えまちがいも しやすくなるね。','○を１つずつ描くかわりに、まとまりを 長い四角で あらわします。','○は55こ。テープなら２本。数を 書けば、何本の花か わかります。'];
    $('introTitle').textContent=titles[step];$('introHint').textContent=hints[step];$('introStory').textContent=step===0?'赤い花が 8本、白い花が 7本 あります。ぜんぶで 何本でしょうか。':'赤い花が 38本、白い花が 17本 あります。ぜんぶで 何本でしょうか。';
    if(step===0){groups(8,7,true);action('introConvert','絵を ○にする',()=>{[...$('introScene').querySelectorAll('.introDot')].forEach(p=>{p.replaceChildren();p.classList.remove('flower');});ready('赤の8こと 白の7こ。○にしても 数は かわらないね。');});}
    if(step===1){drawn=0;groups(38,17,false,true);$('introFeedback').textContent='あと55この○。まず ５こ 描いてみよう。';action('introDraw','○を１つ 描く',drawOne);action('introAuto','つづきを いっしょに描く',()=>{if(interval)return;interval=setInterval(drawOne,170);});}
    if(step===2){groups(38,17);$('introScene').append(node('p','introTakeaway','数が 多くても、まとまりが わかる図に できないかな？'));action('introEffort','描くのに 時間がかかる',()=>{$('introFeedback').textContent='１つずつ描く回数を 少なくできると、図を描きやすいね。';});action('introCount','数えまちがいしそう',()=>{$('introFeedback').textContent='まとまりに数を書けば、○を数え直さなくても 数がわかるね。';});}
    if(step===3){const s=transformation();action('introTransform','○のまとまりを テープにする',()=>{s.classList.add('morphed');ready('赤い花は38本のまま。白い花も17本のまま。形をかえても、数のまとまりは かわらないね。');});}
    if(step===4){transformation(true);$('introScene').append(node('p','introTakeaway','テープを くっつけると、「２つのまとまりを あわせた ぜんぶ」が 見えるね。'));$('introFeedback').textContent='数が多いときも、まとまりと 数の関係を 少ない線で あらわせる。それが テープ図の よさだね。';}
  }
  $('introButton').addEventListener('click',open);$('introPrev').addEventListener('click',()=>{if(step>0){step--;render();}});$('introReplay').addEventListener('click',render);
  $('introNext').addEventListener('click',()=>{if($('introNext').disabled)return;if(step===4){window.TapeLessonApp.start(window.TAPE_LESSONS.find(l=>l.id==='combine-large'),4);return;}step++;render();});
  window.TapeIntro={open,hide};open();
})();

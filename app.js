/* global WordProblemEngine, WordProblemDiagrams */
(() => {
  'use strict';
  const E=WordProblemEngine,$=id=>document.getElementById(id),key='word-problem-lab-v3';
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  let stored={},storageAvailable=true;
  try { stored=JSON.parse(localStorage.getItem(key)||'{}')||{}; }catch(_){storageAvailable=false;}
  if(typeof stored!=='object'||Array.isArray(stored))stored={};
  const completed=new Set(Array.isArray(stored.completed)?stored.completed:[]);
  let gap=false;E.lessons.forEach(l=>{if(!completed.has(l.id))gap=true;if(gap)completed.delete(l.id);});
  let stage=0,index=0,m,target='',draft=null,custom=null;
  try { if(stored.custom) { E.model(stored.custom);custom=stored.custom; } }catch(_){}
  const stageLessons=()=>E.lessons.filter(l=>l.stage===stage);
  const complete=(level=stage)=>E.lessons.filter(l=>l.stage===level).every(l=>completed.has(l.id));
  const accessible=i=>i>=0&&i<E.lessons.length&&E.lessons.slice(0,i).every(l=>completed.has(l.id));
  const customAvailable=()=>custom&&custom.stage===stage&&complete()&&E.lessons.some(l=>l.id===custom.templateId&&l.stage===stage&&completed.has(l.id));
  function save(){
    try{localStorage.setItem(key,JSON.stringify({completed:[...completed],stage,currentId:m?.id,custom}));}catch(_){storageAvailable=false;}
    $('storageNote').textContent=storageAvailable?'学習の続きと作ったお話は、このブラウザに保存します。':'このブラウザでは保存できません。この画面で使えます。';
  }
  function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.85;speechSynthesis.speak(u);}
  function detail(title,body){const d=el('details'),s=el('summary',title);d.append(s,typeof body==='string'?el('p',body):body);const b=el('button','▶ せつめいを きく','quiet');b.type='button';b.addEventListener('click',()=>speak([...d.children].filter(n=>n!==b).map(n=>n.textContent).join('。')));d.append(b);return d;}
  function textStory(model,node){node.replaceChildren(...model.story.map(s=>el('p',s)));}
  function invalidate(){ $('feedback').replaceChildren();$('feedback').className='';$('solutions').hidden=true; }
  function updateNavigation(){
    $('stageLabel').textContent=E.levels[stage].title;
    $('conceptText').textContent=m.concept;
    $('conceptBridge').hidden=stage===0;
    $('conceptBridgeText').textContent=E.levels[stage].bridge;
    $('advanceStage').hidden=!complete()||stage===5;
    $('advanceStage').textContent=`${stage+2}年生の段階へ すすむ →`;
    $('reviewStage').hidden=stage===0;
    $('reviewStage').textContent=`${stage}年生の段階を ふくしゅうする`;
    $('createMode').disabled=!complete();
    $('stageStatus').textContent=complete()?(stage===5?'6年生までの代表問題を たしかめたね。作問や復習にも取り組もう。':'この学年の代表問題を たしかめたね。次の段階と作問に進めるよ。'):'一つずつ、式・答え・理由をたしかめて すすもう。';
    const list=stageLessons(),count=list.filter(l=>completed.has(l.id)).length;
    $('progressText').textContent=`この段階で たしかめたお話　${count} / ${list.length}`;
    $('previousLesson').disabled=m.id==='custom'||index===0||E.lessons[index-1].stage!==stage;
    $('nextLesson').disabled=m.id==='custom'||!completed.has(m.id)||index===E.lessons.length-1||E.lessons[index+1].stage!==stage;
    $('lessonSelect').replaceChildren(...E.lessons.filter((l,i)=>l.stage===stage&&accessible(i)).map(l=>new Option(l.title,l.id)));
    if(customAvailable())$('lessonSelect').append(new Option('自分で つくったお話','custom'));
    $('lessonSelect').value=m.id;
    $('expression').placeholder=stage===0?'数と ＋、−、＝ が使えるよ':stage===1?'数と ＋、−、×、＝、□':stage===2?'＋、−、×、÷、＝、□':'＋、−、×、÷、かっこ、□';
    $('expressionGuide').textContent=stage>=2?'式を改行や「;」で区切ると、途中の式も書けます。'+(stage===5?'分数は「3/4」のように書けます。':''):stage===1?'求める式も、□を使ったお話の式も書けるよ。':'お話の数を使って、たしざんか ひきざんの式を書こう。';
    $('answerGuide').textContent=stage===5?'小数・分数（例：1/2）も書けます。単位は右に表示しています。':stage>=3||m.kind==='decimaladd'?'小数も書けます。単位は右に表示しています。':'';
  }
  function hints(){
    const area=$('hints');area.replaceChildren();
    const names=el('div');m.quantities.filter(q=>q.id!==m.unknown&&!q.derived).forEach(q=>names.append(el('p',`${q.display||E.format(q.value)}${q.unit}は「${q.label}」の量だよ。`)));
    const bridge=el('div');bridge.append(el('p',m.paths[0].reason));
    if(stage>0)bridge.append(el('p',m.relation,'formula'),el('p','この関係で、聞かれた量はどこにあるかな？'));
    area.append(detail('1　何を 聞かれている？','質問の文を読み直そう。答えの数の名前と、単位を確かめよう。'),detail('2　数に 名前をつけよう',names),detail('3　お話に合う図で 考えよう',WordProblemDiagrams.draw(m)),detail('4　式へ つなげる',bridge));
    $('faq').replaceChildren(...m.faq.map(([title,text])=>detail(title,text)));
    if(stage>0)$('faq').append(detail('別の式や 別の道筋でも よい？','よいよ。何の量を求めるかと、その式にする理由が合っているかを確かめよう。途中の計算は改行して書けるよ。'));
  }
  function reasons(){
    const area=$('reasonChoices');area.replaceChildren();
    const options=[...m.reasonOptions];if(index%2)options.reverse();
    options.forEach(o=>{const label=el('label',undefined,'reasonOption'),radio=el('input');radio.type='radio';radio.name='reason';radio.value=o.id;label.append(radio,el('span',o.text));area.append(label);});
  }
  function load(data){
    if(data.id==='custom'){if(!customAvailable())return;}
    else{const i=E.lessons.findIndex(l=>l.id===data.id);if(!accessible(i)||data.stage!==stage)return;index=i;}
    if('speechSynthesis'in window)speechSynthesis.cancel();
    m=E.model(data);target='';$('solveForm').reset();invalidate();updateNavigation();
    $('storyTitle').textContent=m.title||'自分で つくったお話';textStory(m,$('storyLines'));$('question').textContent=m.question;$('answerUnit').textContent=m.unit;
    $('knownNumbers').replaceChildren();m.quantities.filter(q=>q.id!==m.unknown&&!q.derived).forEach(q=>{const chip=el('div',q.label,'numberChip');chip.append(el('strong',(q.display||E.format(q.value))+q.unit));$('knownNumbers').append(chip);});
    $('targetChoices').replaceChildren();m.quantities.filter(q=>!q.derived||q.id===m.unknown).forEach(q=>{const b=el('button',q.label);b.type='button';b.dataset.role=q.id;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{target=q.id;$('targetChoices').querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',n===b));invalidate();});$('targetChoices').append(b);});
    $('storyPictures').replaceChildren(WordProblemIllustrations.samples(m));reasons();hints();save();window.WordProblemDiagramBridge?.load(m);
  }
  function paths(){
    const area=$('solutionPaths');area.replaceChildren();
    m.paths.forEach((p,i)=>{const card=el('div',undefined,'path');card.append(el('h3',p.title));if(i===0)card.append(WordProblemDiagrams.draw(m));card.append(el('p',p.work||p.expression+' ＝ '+E.format(m.answer),'formula'),el('p',p.reason));area.append(card);});
    if(stage>0)area.append(detail('お話の関係を 式にすると',m.relation+'。□に入る数を求めて、お話に戻して確かめよう。'));
    $('solutions').hidden=false;$('otherWays').open=false;
  }
  const feedbackLine=(ok,text)=>{const line=el('p',undefined,'resultLine');line.append(el('span',ok?'✓':'→','badge'),el('span',text));$('feedback').append(line);};
  $('solveForm').addEventListener('submit',event=>{
    event.preventDefault();invalidate();
    const expression=$('expression').value.trim(),answer=$('answer').value.trim(),reason=document.querySelector('input[name=reason]:checked')?.value;
    const check=expression?E.checkWork(expression,m):{ok:false,code:'empty'};
    const targetOK=target===m.unknown,answerOK=E.checkAnswer(answer,m),reasonOK=m.reasonOptions.some(o=>o.id===reason&&o.correct)&&(!check.pathId||reason===check.pathId);
    feedbackLine(targetOK,targetOK?`知りたいのは「${m.names[m.unknown]}」だね。`:'質問の文を読んで、聞かれた量をえらぼう。');
    feedbackLine(check.ok,check.ok?(check.code==='relation-equation'?'お話の関係を、□で表せたね。':'量の関係に合う式になっているね。'):check.code==='empty'?'考えた式を書いてみよう。':check.code==='format'?'数・計算の記号・かっこの書き方を確かめよう。':check.code==='calculation'?'＝の左右の計算や、途中の計算を確かめよう。':'その式で何の量を求めているかな？ 図と数の名前を確かめよう。');
    feedbackLine(answerOK,answerOK?`答えは ${E.format(m.answer)}${m.unit}。お話に合っているね。`:'答えを求めて、お話の関係に戻して確かめよう。');
    feedbackLine(reasonOK,reasonOK?'量の名前を使って、理由も説明できたね。':'言葉や数の順番だけで決めず、量の関係を使って説明しよう。');
    if(targetOK&&check.ok&&answerOK&&reasonOK){$('feedback').className='success';feedbackLine(true,'式・答え・理由がつながったね！');if(m.id!=='custom')completed.add(m.id);updateNavigation();save();paths();}
  });
  $('expression').addEventListener('input',invalidate);$('answer').addEventListener('input',invalidate);$('reasonChoices').addEventListener('change',invalidate);
  function mode(value){const creating=value==='create';if(creating&&!complete())return;$('practice').hidden=creating;$('creator').hidden=!creating;$('practiceMode').setAttribute('aria-pressed',!creating);$('createMode').setAttribute('aria-pressed',creating);if(creating)creatorSetup();}
  $('practiceMode').addEventListener('click',()=>mode('practice'));$('createMode').addEventListener('click',()=>mode('create'));
  $('advanceStage').addEventListener('click',()=>{if(!complete()||stage===5)return;stage++;mode('practice');load(E.lessons.find(l=>l.stage===stage));});
  $('reviewStage').addEventListener('click',()=>{if(stage===0)return;stage--;mode('practice');load(E.lessons.find(l=>l.stage===stage));});
  $('lessonSelect').addEventListener('change',()=>load($('lessonSelect').value==='custom'?custom:E.lessons.find(l=>l.id===$('lessonSelect').value)));
  function move(step){const next=index+step;if(m.id==='custom'||!accessible(next)||E.lessons[next].stage!==stage)return;load(E.lessons[next]);$('storyTitle').scrollIntoView({behavior:'smooth'});}
  $('previousLesson').addEventListener('click',()=>move(-1));$('nextLesson').addEventListener('click',()=>move(1));
  function clearDraft(){draft=null;$('createPreview').replaceChildren();$('tryCreated').hidden=true;}
  function creatorSetup(){
    $('creatorIntro').textContent=stage===0?'いま学んだお話の数をかえて つくろう。':'この学年で学んだ問題の型を選び、量の数をかえて作ろう。';
    const old=$('createKind').value;$('createKind').replaceChildren(...stageLessons().filter(l=>completed.has(l.id)).map(l=>new Option(l.title,l.id)));if(stageLessons().some(l=>l.id===old))$('createKind').value=old;
    creatorFields();
  }
  function creatorFields(){
    const template=E.lessons.find(l=>l.id===$('createKind').value);if(!template)return;
    const sample=E.model(template);const params=template.params||[template.a,template.b];
    ['createA','createB','createC'].forEach((id,i)=>{const input=$(id),label=input.parentElement;label.hidden=i>=params.length;if(i<params.length){input.value=E.format(params[i]);$(id+'Label').textContent=sample.paramLabels[i];}});
    const allowed=stageLessons().filter(l=>l.kind===template.kind&&completed.has(l.id)).map(l=>l.unknown);
    $('createUnknown').replaceChildren(...[...new Set(allowed)].map(r=>new Option(sample.names[r]||r,r)));
    $('createUnknown').value=template.unknown;$('createUnknown').disabled=allowed.length===1;clearDraft();
  }
  $('createKind').addEventListener('change',creatorFields);['createA','createB','createC','createUnknown'].forEach(id=>$(id).addEventListener('input',clearDraft));
  $('createForm').addEventListener('submit',event=>{
    event.preventDefault();clearDraft();
    try{
      const template=E.lessons.find(l=>l.id===$('createKind').value);
      if(!complete()||!template||template.stage!==stage||!completed.has(template.id))throw Error('いま学んだ型から選ぼう。');
      const unknown=$('createUnknown').value;if(!stageLessons().some(l=>l.kind===template.kind&&l.unknown===unknown&&completed.has(l.id)))throw Error('学んだ場所を質問にしよう。');
      const count=template.params?.length||2,params=['createA','createB','createC'].slice(0,count).map(id=>E.evaluate(E.parse($(id).value)));
      draft={...template,id:'custom',templateId:template.id,title:'自分で つくったお話',unknown};
      if(E.kinds.includes(template.kind)){draft.a=params[0];draft.b=params[1];if(stage===0&&params.some(n=>n>10))throw Error('1年生では、二つの数をそれぞれ10までにしよう。');}else draft.params=params;
      const preview=E.model(draft);textStory(preview,$('createPreview'));$('createPreview').append(el('p',preview.question,'question'),el('p','量の関係が合うお話を作れたね。自分で式と理由を考えてみよう。','tiny'));custom=draft;save();$('tryCreated').hidden=false;
    }catch(error){draft=null;$('createPreview').textContent=error.message;}
  });
  $('tryCreated').addEventListener('click',()=>{if(!draft)return;mode('practice');load(draft);});
  $('readStory').addEventListener('click',()=>speak([...m.story,m.question].join('。')));
  $('clearProgress').addEventListener('click',()=>{completed.clear();window.WordProblemDiagramBridge?.clear();stage=0;mode('practice');clearDraft();load(E.lessons[0]);});
  const savedStage=Number(stored.stage);stage=Number.isInteger(savedStage)&&savedStage>=0&&savedStage<=5&&E.lessons.filter(l=>l.stage<savedStage).every(l=>completed.has(l.id))?savedStage:0;
  const resume=E.lessons.find((l,i)=>l.id===stored.currentId&&l.stage===stage&&accessible(i))||E.lessons.find(l=>l.stage===stage);load(resume);
})();

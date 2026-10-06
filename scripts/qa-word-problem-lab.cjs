const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../curriculum.js');
const Scenes=require('../action-scenes.js');
const Guides=require('../interactive-guides.js');
assert.equal(Guides.percentFill(47.5).filter(x=>x===1).length,47);
assert.equal(Guides.percentFill(47.5).filter(x=>x===0.5).length,1);
assert.equal(Guides.percentFill(47.5).reduce((a,b)=>a+b,0),47.5);
assert.throws(()=>Guides.percentFill(101));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.QA_OUTPUT || require('node:path').resolve(__dirname,'../qa-output');fs.mkdirSync(out,{recursive:true});
let modelChecks=0;
for(const kind of E.kinds)for(const unknown of E.roles)for(const [a,b]of[[3,5],[4,4],[1,50]]){
 const m=E.model({kind,unknown,a,b});for(const expression of[m.expression,m.relation,`${m.expression}=${m.answer}`,`${m.answer}=${m.expression}`]){assert(E.checkExpression(expression,m).ok,expression);modelChecks++;}
 assert(!E.checkExpression(`${m.answer}+0`,m).ok);assert(!E.checkExpression('1+1=2',m).ok);assert(!E.checkExpression('alert(1)',m).ok);
}
for(const l of E.lessons){const m=E.model(l);for(const p of m.paths){assert(E.checkWork(p.work||p.expression,m).ok,l.id);modelChecks++;}for(const eq of m.equations)assert(E.checkExpression(eq,m).ok,l.id+' '+eq);assert(E.checkAnswer(E.format(m.answer),m),l.id);}
const get=id=>E.model(E.lessons.find(l=>l.id===id));
assert(E.checkWork('2+3=5\n5*4=20',get('two-step')).ok);
assert(E.checkWork('2*4=8\n3*4=12\n8+12=20',get('two-step')).ok);
assert(!E.checkWork('2+3=6\n6*4=24',get('two-step')).ok);
assert(!E.checkExpression('4*5',get('same-groups')).ok);
assert(!E.checkExpression('10+2',get('same-groups')).ok);
assert(E.checkExpression('3+3+3+3',get('same-groups')).ok);
assert(E.checkExpression('200*0.2',get('percentage-part')).ok);
assert(E.checkExpression('40/0.2',get('percentage-base')).ok);
assert(E.checkAnswer('1/2',get('fraction-times')));
assert(E.checkExpression('(3/4)*(2/3)',get('fraction-times')).ok);
assert(E.checkExpression('(3/4)/(1/8)',get('fraction-pieces')).ok);
assert(!E.checkAnswer('1/0',get('fraction-pieces')));
assert.throws(()=>E.parse('globalThis.process.exit()'));
assert.throws(()=>E.model({kind:'ratio',stage:5,params:[2,3,24]}));
assert.throws(()=>E.model({kind:'percent',stage:4,params:[7,20]}));

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../index.html')).href);
  assert(await page.locator('#advanceStage').isHidden());assert(await page.locator('#nextLesson').isDisabled());assert(await page.locator('#createMode').isDisabled());assert.equal(await page.locator('#lessonSelect option').count(),1);
  assert(!(await page.locator('#conceptText').textContent()).includes('割合'));
  let activeStage=0;
  async function select(l){
   while(activeStage<l.stage){await page.locator('#advanceStage').click();activeStage++;}
   while(activeStage>l.stage){await page.locator('#reviewStage').click();activeStage--;}
   await page.locator('#lessonSelect').selectOption(l.id);
  }
  async function solve(m,expression=m.paths[0].work||m.paths[0].expression,reason=m.paths[0].id){
   await page.locator(`[data-role="${m.unknown}"]`).click();await page.locator('#expression').fill(expression);await page.locator('#answer').fill(E.format(m.answer));await page.locator(`input[name=reason][value="${reason}"]`).check();await page.locator('#solveForm button[type=submit]').click();
   assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('success')),m.id+' '+await page.locator('#feedback').textContent());
  }
  for(const l of E.lessons){
   await select(l);const m=E.model(l);assert.equal(await page.locator('#question').textContent(),m.question);assert(await page.locator('#solutions').isHidden());
   assert((await page.locator('#storyPictures img').count())>0,l.id+' illustration');
   await page.locator('#storyPictures img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   assert(await page.locator('#storyPictures img').evaluateAll(imgs=>imgs.every(img=>img.naturalWidth>0)),l.id+' image loading');
   await page.locator('#hints details').nth(2).locator(':scope > summary').click();
   const guide=page.locator('#hints .interactiveGuide');
   const guideExpected=['area','percent','discount','ratio','proportion'].includes(m.kind);
   assert.equal(await guide.count(),guideExpected?1:0,l.id+' guided diagram');
   if(guideExpected){
    await guide.locator(':scope > summary').click();
    if(m.kind==='percent'||m.kind==='discount'){
     assert(await guide.locator('.percentExplore').isHidden());
     await guide.locator('[data-base=total]').click();assert(await guide.locator('.percentExplore').isHidden());
     await guide.locator('[data-base=a]').click();assert(await guide.locator('.percentExplore').isVisible());
     assert.equal(await guide.locator('.hundredGrid > span').count(),100);
     assert(await guide.locator('.hundredGrid').evaluate(node=>getComputedStyle(node).display==='grid'&&node.getBoundingClientRect().height>200),'percentage grid must be visible');
     if(m.unknown==='b'){assert.equal(await guide.locator('.hundredGrid').getAttribute('aria-label'),'100%の枠。色を付ける割合はまだ分からない。');await guide.getByRole('button',{name:'人数から、割合の図をたしかめる'}).click();}
     assert.equal(await guide.locator('.hundredGrid > span').evaluateAll(cells=>cells.reduce((sum,x)=>sum+Number(x.dataset.fill),0)),m.params[1]);
     if(m.unknown==='a')assert(!(await guide.locator('.percentExplore').textContent()).includes('200人'));
     if(m.kind==='discount'){await guide.getByRole('button',{name:'値引きと、払う分を分けて見る'}).click();assert((await guide.locator('.guideStatus').textContent()).includes('80%'));}
    }
    if(m.kind==='ratio'){
     assert.equal(await guide.locator('.guideBeads').count(),0);
     await guide.getByRole('button',{name:'同じ一つ分を、全部から求める'}).click();
     const parts=m.params[0]+m.params[1],unit=m.params[2]/parts;
     assert.equal(await guide.locator('.exploreRatio > div').count(),parts);
     assert.equal(await guide.locator('.guideBeads img').count(),m.params[2]);
     for(const group of await guide.locator('.guideBeads').all())assert.equal(await group.locator('img').count(),unit);
    }
    if(m.kind==='proportion'){
     await guide.locator('button[data-count="2"]').click();assert.equal(await guide.locator('.activeCorrespondence').count(),2);assert((await guide.locator('table').textContent()).includes('160円'));
     await guide.locator('button[data-count="3"]').click();assert.equal(await guide.locator('.activeCorrespondence').count(),2);assert((await guide.locator('table').textContent()).includes('240円'));
    }
    if(m.kind==='area'){
     assert.equal(await guide.locator('.countedSquare').count(),0);await guide.getByRole('button',{name:'一列ずつ、数えてみる'}).click();assert.equal(await guide.locator('.countedSquare').count(),m.params[1]);
     for(let i=1;i<m.params[0];i++)await guide.getByRole('button',{name:'一列ずつ、数えてみる'}).click();assert.equal(await guide.locator('.countedSquare').count(),24);
     await guide.getByRole('button',{name:'はじめから見る'}).click();assert.equal(await guide.locator('.countedSquare').count(),0);
    }
    await guide.screenshot({path:out+'/'+l.id+'-interactive.png'});
   }
   const sceneKey=Scenes.keyFor(m);
   assert.equal(await page.locator('#hints .actionScene').count(),sceneKey?1:0,l.id+' scene mapping');
   if(sceneKey){
    await page.locator('#hints .actionScene > summary').click();
    assert.equal(await page.locator('#hints .actionScene').getAttribute('data-scene'),sceneKey);
    await page.locator('#hints .actionScene > img').evaluate(img=>img.decode());
    const asked=page.locator('#hints .askedQuantity');
    if(Scenes.scenes[sceneKey].roles.length){assert.equal(await asked.count(),1);assert.equal(await asked.getAttribute('data-quantity'),m.unknown);assert((await asked.textContent()).includes('□'));}
   }
   if(l.id==='equal-share'){
    assert.equal(await page.locator('#hints .plate').count(),3);await page.getByRole('button',{name:'一つずつ 同じ数に配ってみる'}).click();await page.waitForFunction(()=>document.querySelectorAll('#hints .plate .dots span').length===12);assert.equal(await page.locator('#hints .plate .dots span').count(),12);await page.waitForTimeout(650);
    assert.equal(await page.locator('#hints .plate .dots img').count(),12);assert.equal(await page.locator('#hints .dots img').count(),12);
    await page.screenshot({path:out+'/grade3-equal-share-desktop.png',fullPage:true});
   }
   if(l.id==='how-many-groups'){await page.getByRole('button',{name:'同じ数ずつ 取り分けてみる'}).click();await page.waitForFunction(()=>document.querySelectorAll('#hints .plate').length===4);assert.equal(await page.locator('#hints .plate').count(),4);}
   if(l.id==='flowers'){assert.equal(await page.locator('#hints img[src$="red-flower.png"]').count(),4);assert.equal(await page.locator('#hints img[src$="white-flower.png"]').count(),3);await page.screenshot({path:out+'/grade1-flowers-desktop.png',fullPage:true});}
   if(l.id==='candy-left'){assert.equal(await page.locator('#hints .dots > span').count(),8);assert.equal(await page.locator('#hints .eaten').count(),3);}
   if(l.id==='stickers'){assert.equal(await page.locator('#hints .comparisonPairs img').count(),13);assert.equal(await page.locator('#hints .unpaired').count(),3);}
   if(l.id==='average-books'){assert(!(await page.locator('#knownNumbers').textContent()).includes('三日間の合計'));assert.equal(await page.locator('#hints .bookPiles img').count(),15);await page.getByRole('button',{name:'同じ大きさに ならしてみる'}).click();assert.deepEqual(await page.locator('#hints .averageColumns div').allTextContents(),['5','5','5']);assert.equal(await page.locator('#hints .bookPiles img').count(),15);for(const pile of await page.locator('#hints .bookPiles > div').all())assert.equal(await pile.locator('img').count(),5);await page.screenshot({path:out+'/grade5-average-scenes.png',fullPage:true});}
   if(l.id==='fraction-pieces'){await page.getByRole('button',{name:'一本分ずつ 区切ってみる'}).click();assert.equal(await page.locator('#hints .ribbon span').count(),6);}
   if(l.id==='percentage-part')await page.screenshot({path:out+'/grade5-percent-desktop.png',fullPage:true});
   if(l.id==='ratio-parts')await page.screenshot({path:out+'/grade6-ratio-desktop.png',fullPage:true});
   await solve(m);
   if(l.id==='same-groups')await solve(m,m.paths[1].expression,m.paths[1].id);
   if(l.id==='two-step'){
    await solve(m,m.paths[1].work,m.paths[1].id);
    await page.locator('#expression').fill(m.paths[0].work);await page.locator(`input[value="${m.paths[1].id}"]`).check();await page.locator('#solveForm button[type=submit]').click();assert(!(await page.locator('#feedback').evaluate(el=>el.classList.contains('success'))));
    await solve(m);
   }
   const stageLast=E.lessons.filter(x=>x.stage===l.stage).at(-1).id===l.id;
   if(stageLast){
    assert(await page.locator('#nextLesson').isDisabled());assert(await page.locator('#createMode').isEnabled());
    if(l.stage<5)assert(await page.locator('#advanceStage').isVisible());else assert(await page.locator('#advanceStage').isHidden());
    // Every grade has an actual problem-posing flow, restricted to learned templates.
    await page.locator('#createMode').click();
    assert.equal(await page.locator('#createKind option').count(),E.lessons.filter(x=>x.stage===l.stage).length);
    await page.locator('#createForm button[type=submit]').click();assert(await page.locator('#tryCreated').isVisible());
    await page.locator('#tryCreated').click();const custom=await page.evaluate(()=>JSON.parse(localStorage.getItem('word-problem-lab-v3')).custom);await solve(E.model(custom));
    await page.locator('#lessonSelect').selectOption(l.id);
   }
  }
  assert((await page.locator('#stageStatus').textContent()).includes('6年生まで'));
  // Custom percentages can have a partially filled 1% cell.
  await page.evaluate(()=>{const model=WordProblemEngine.model({id:'custom',stage:4,kind:'percent',params:[200,47.5],unknown:'total'});const guide=WordProblemInteractiveGuides.draw(model);guide.id='guideFixture';guide.open=true;document.body.append(guide);});
  await page.locator('#guideFixture [data-base=a]').click();assert.equal(await page.locator('#guideFixture [data-fill="0.5"]').count(),1);assert.equal(await page.locator('#guideFixture .hundredGrid > span').evaluateAll(cells=>cells.reduce((sum,x)=>sum+Number(x.dataset.fill),0)),47.5);await page.locator('#guideFixture').evaluate(node=>node.remove());
  await page.reload();assert((await page.locator('#stageLabel').textContent()).startsWith('6年'));
  await page.setViewportSize({width:390,height:844});
  for(const id of['fraction-times','ratio-parts','inverse-workers','percentage-base','equal-share','flowers','before-eating','average-books','rectangle-area','proportional-cost']){
   await select(E.lessons.find(l=>l.id===id));await page.locator('#hints details').nth(2).locator(':scope > summary').click();if(await page.locator('#hints .actionScene').count()){await page.locator('#hints .actionScene > summary').click();await page.locator('#hints .actionScene > img').evaluate(img=>img.decode());}
   const guide=page.locator('#hints .interactiveGuide');if(await guide.count()){
    await guide.locator(':scope > summary').click();
    if(id==='percentage-base')await guide.locator('[data-base=a]').click();
    if(id==='ratio-parts'){await guide.getByRole('button',{name:'同じ一つ分を、全部から求める'}).click();const widths=await guide.locator('.exploreRatio > div').evaluateAll(nodes=>nodes.map(x=>x.getBoundingClientRect().width));assert(Math.max(...widths)-Math.min(...widths)<1,'equal ratio units must have equal widths');}
    if(id==='proportional-cost')await guide.locator('button[data-count="2"]').click();
    if(id==='rectangle-area')await guide.getByRole('button',{name:'一列ずつ、数えてみる'}).click();
    await guide.screenshot({path:out+'/'+id+'-interactive-mobile.png'});
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow');await page.screenshot({path:out+'/'+id+'-mobile.png',fullPage:true});
  }
  await page.locator('.teacher summary').click();await page.locator('#clearProgress').click();activeStage=0;
  assert(await page.locator('#advanceStage').isHidden());assert(await page.locator('#createMode').isDisabled());assert.equal(await page.locator('#lessonSelect option').count(),1);
  await page.reload();assert((await page.locator('#stageLabel').textContent()).startsWith('1年'));
  // Out-of-order saved completions cannot skip the sequence.
  await page.evaluate(()=>localStorage.setItem('word-problem-lab-v3',JSON.stringify({completed:['fraction-times'],stage:5,currentId:'fraction-times'})));
  await page.reload();assert((await page.locator('#stageLabel').textContent()).startsWith('1年'));assert.equal(await page.locator('#lessonSelect option').count(),1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,grades:6,lessons:E.lessons.length,modelChecks,sequentialProgression:true,distinctDivisionActions:true,multiplePaths:true,intermediateWork:true,posingAllGrades:true,persistence:true,mobileOverflow:false,screenshots:out},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

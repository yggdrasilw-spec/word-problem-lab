const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../curriculum.js');
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
   await page.locator('#hints details').nth(2).locator('summary').click();
   if(l.id==='equal-share'){
    assert.equal(await page.locator('#hints .plate').count(),3);await page.getByRole('button',{name:'一つずつ 同じ数に配ってみる'}).click();await page.waitForFunction(()=>document.querySelectorAll('#hints .plate .dots span').length===12);assert.equal(await page.locator('#hints .plate .dots span').count(),12);await page.waitForTimeout(650);
    await page.screenshot({path:out+'/grade3-equal-share-desktop.png',fullPage:true});
   }
   if(l.id==='how-many-groups'){await page.getByRole('button',{name:'同じ数ずつ 取り分けてみる'}).click();await page.waitForFunction(()=>document.querySelectorAll('#hints .plate').length===4);assert.equal(await page.locator('#hints .plate').count(),4);}
   if(l.id==='average-books'){assert(!(await page.locator('#knownNumbers').textContent()).includes('三日間の合計'));await page.getByRole('button',{name:'同じ大きさに ならしてみる'}).click();assert.deepEqual(await page.locator('#hints .averageColumns div').allTextContents(),['5','5','5']);}
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
  await page.reload();assert((await page.locator('#stageLabel').textContent()).startsWith('6年'));
  await page.setViewportSize({width:390,height:844});
  for(const id of['fraction-times','ratio-parts','inverse-workers','percentage-base','equal-share']){
   await select(E.lessons.find(l=>l.id===id));await page.locator('#hints details').nth(2).locator('summary').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow');await page.screenshot({path:out+'/'+id+'-mobile.png',fullPage:true});
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

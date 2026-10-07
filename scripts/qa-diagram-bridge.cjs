const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const E=require('../curriculum.js'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'image/png');res.end(data);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');
  const seed=async l=>{await page.evaluate(({ids,l})=>localStorage.setItem('word-problem-lab-v3',JSON.stringify({completed:ids,stage:l.stage,currentId:l.id})),{ids:E.lessons.map(x=>x.id),l});await page.reload();};
  const launch=async()=>{await page.locator('#openDiagram').click();await page.locator('#diagramLoading').waitFor({state:'hidden'});return page.frameLocator('#diagramFrame');};
  const compatible=E.lessons.filter(l=>l.stage<=1&&E.kinds.includes(l.kind));
  for(const l of compatible){
   await seed(l);await page.locator('#expression').fill('途中の式');await page.locator('#answer').fill('7');
   const f=await launch(),m=E.model(l);
   assert((await f.locator('#storyText').textContent()).includes(m.question));
   const current=await f.locator('body').evaluate(()=>window.TapeLessonApp.current());
   assert.equal(current.kind,m.kind);assert.equal(current.left,m.a);assert.equal(current.right,m.b);assert.equal(current.unknown,{a:'left',b:'right',total:'total'}[m.unknown]);
   await f.locator('body').evaluate(()=>window.TapeLessonApp.start(window.TapeLessonApp.current(),7));
   await f.getByRole('button',{name:'この図を お話へもどす',exact:true}).click();
   await page.locator('.diagramDialog').waitFor({state:'hidden'});assert.equal(await page.locator('#expression').inputValue(),'途中の式');assert.equal(await page.locator('#answer').inputValue(),'7');
   assert.equal(await page.locator('#returnedDiagram img').count(),1);
  }
  await seed(E.lessons.find(l=>l.id==='candy-left'));
  const f=await launch();await f.locator('#workshopButton').click();await f.locator('.practiceChoice').nth(3).click();
  await f.getByRole('button',{name:'左の部分から',exact:true}).click();assert((await f.locator('#workshopFeedback').textContent()).includes('全体'));
  await f.getByRole('button',{name:'全体から',exact:true}).click();
  for(let i=0;i<2;i++)await f.getByRole('button',{name:'お手本と いっしょに描く',exact:true}).click();
  for(const role of ['total','left','right']){await f.locator('[data-fact="'+role+'"]').click();await f.locator('[data-range="'+role+'"]').click();}
  await f.getByRole('button',{name:'図を たしかめる',exact:true}).click();
  await f.getByRole('button',{name:'この図を お話へもどす',exact:true}).click();
  await page.locator('.diagramDialog').waitFor({state:'hidden'});
  assert((await page.locator('#returnedDiagram').textContent()).includes('関係を確かめました'));
  fs.mkdirSync(path.join(root,'qa-output'),{recursive:true});await page.locator('#returnedDiagram').screenshot({path:path.join(root,'qa-output/diagram-return.png')});
  await page.reload();assert.equal(await page.locator('#returnedDiagram img').count(),1);
  // A changed question in the diagram workshop must not be attached to this problem.
  const changed=await launch();await changed.locator('#workshopButton').click();await changed.locator('.practiceChoice').nth(1).click();
  await changed.getByRole('button',{name:'全体を □にする',exact:true}).click();
  await changed.getByRole('button',{name:'この図を お話へもどす',exact:true}).click();assert(await page.locator('.diagramDialog').isVisible());
  assert((await changed.locator('.integrationBar').textContent()).includes('もとのお話の図にもどって'));
  await page.locator('#closeDiagram').click();
  // Custom exercises transfer their new quantities, and do not inherit another diagram.
  await seed(E.lessons[0]);await page.locator('#createMode').click();await page.locator('#createKind').selectOption('flowers');
  await page.locator('#createA').fill('9');await page.locator('#createB').fill('2');await page.locator('#createForm button[type=submit]').click();await page.locator('#tryCreated').click();
  assert.equal(await page.locator('#returnedDiagram img').count(),0);
  const custom=await launch();assert.equal(await custom.locator('body').evaluate(()=>window.TapeLessonApp.current().left),9);await page.locator('#closeDiagram').click();
  await seed(E.lessons.find(l=>l.id==='same-groups'));assert(await page.locator('#openDiagram').isHidden());
  await seed(E.lessons[0]);await page.setViewportSize({width:390,height:844});await launch();assert(await page.locator('.diagramDialog').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#closeDiagram').click();
  await page.locator('.teacher summary').click();await page.locator('#clearProgress').click();assert.equal(await page.locator('#returnedDiagram img').count(),0);
  // file:// remains supported, without a web server.
  await page.goto(require('node:url').pathToFileURL(path.join(root,'index.html')).href);const offline=await launch();await offline.locator('body').evaluate(()=>window.TapeLessonApp.start(window.TapeLessonApp.current(),7));
  await offline.getByRole('button',{name:'この図を お話へもどす',exact:true}).click();await page.locator('.diagramDialog').waitFor({state:'hidden'});assert.equal(await page.locator('#returnedDiagram img').count(),1);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,stories:compatible.length,drawAndReturn:true,draftPreserved:true,persistence:true,mobile:true,fileMode:true,custom:true,changedQuestionRejected:true}));
 }finally{await browser.close();server.close();}
})().catch(e=>{server.close();console.error(e);process.exitCode=1;});

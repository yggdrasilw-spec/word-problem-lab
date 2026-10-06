(function(root){
  'use strict';
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  function percentFill(rate){
    if(!Number.isFinite(rate)||rate<0||rate>100)throw RangeError('割合は0〜100');
    return Array.from({length:100},(_,i)=>Math.min(1,Math.max(0,rate-i)));
  }
  function draw(m){
    if(!((['percent','discount'].includes(m.kind)&&m.stage>=4)||(['ratio','proportion'].includes(m.kind)&&m.stage>=5)||(m.kind==='area'&&m.stage>=3)))return null;
    const E=root.WordProblemEngine,q=id=>m.quantities.find(x=>x.id===id);
    const shown=id=>(id===m.unknown?'□':q(id).display||E.format(q(id).value))+q(id).unit;
    const d=el('details',undefined,'interactiveGuide');d.dataset.guide=m.kind;
    d.append(el('summary','操作して、関係をたしかめる'));
    const status=el('p','', 'guideStatus');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    function button(text,run,cls='quiet'){const b=el('button',text,cls);b.type='button';b.addEventListener('click',run);return b;}
    function beads(count,key){const dots=el('div',undefined,'guideBeads');dots.setAttribute('role','img');dots.setAttribute('aria-label',count+'こ');for(let i=0;i<count;i++)dots.append(root.WordProblemIllustrations.token(key));return dots;}
    if(m.kind==='percent'||m.kind==='discount'){
      d.append(el('h3','まず、100%にする量をえらぼう'));
      const choices=el('div',undefined,'guideChoices'),graphic=el('div',undefined,'percentExplore');graphic.hidden=true;
      const grid=el('div',undefined,'hundredGrid');grid.setAttribute('role','img');
      function paint(rate){grid.replaceChildren();percentFill(rate).forEach(fill=>{const cell=el('span');cell.dataset.fill=String(fill);cell.style.background=`linear-gradient(to right,#377b67 ${fill*100}%,#eef4ee ${fill*100}%)`;grid.append(cell);});grid.setAttribute('aria-label',`100マスのうち${E.format(rate)}%の部分`);}
      const label=el('p'),explanation=el('p');
      graphic.append(el('strong','この枠ぜんぶが100%'),grid,label,explanation);
      let selected=false;
      ['total','a'].forEach(id=>{const b=button(`${q(id).label} ${shown(id)}`,()=>{
        if(id!=='a'){status.textContent=m.kind==='discount'?'払う代金は、値引きしたあとの量だね。何の代金を100%としているかな？':'比べる量は、全体の中の図書委員の人数だね。もとにしている全体はどれかな？';return;}
        selected=true;choices.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
        graphic.hidden=false;status.textContent=`${q('a').label} ${shown('a')}が100%だね。求める量が分からなくても、基準の量はえらべるよ。`;
        if(m.unknown==='b'){paint(0);grid.setAttribute('aria-label','100%の枠。色を付ける割合はまだ分からない。');label.textContent='図書委員に当たる割合は、まだ□%。';explanation.textContent='全体の人数と図書委員の人数を比べて、100分のいくつかを考えよう。';}
        else{paint(q('b').value);label.textContent=m.kind==='discount'?`色の部分は値引きする${shown('b')}。白い部分が払う割合。`:`色の部分が${shown('b')}に当たるよ。`;explanation.textContent=m.unknown==='a'?'100%に当たる人数は□人。分かっている人数は、色の部分の人数だね。':`一マスは1%で、${E.format(q('a').value/100)}${q('a').unit}分だよ。一マスを1人・1円だと思わないでね。`;}
      });b.dataset.base=id;b.setAttribute('aria-pressed','false');choices.append(b);});
      d.append(choices,status,graphic);
      if(m.unknown==='b')d.append(button('人数から、割合の図をたしかめる',()=>{if(!selected){status.textContent='先に、100%にする量をえらぼう。';return;}const rate=q('total').value/q('a').value*100;paint(rate);label.textContent=`${shown('total')}は${shown('a')}の${E.format(rate)}%。`;explanation.textContent=`比べる人数 ÷ 全体の人数 × 100。${E.format(q('total').value)} ÷ ${E.format(q('a').value)} × 100 で確かめられるね。`;}));
      if(m.kind==='discount')d.append(button('値引きと、払う分を分けて見る',()=>{if(!selected){status.textContent='先に、100%にする量をえらぼう。';return;}const remain=100-q('b').value;status.textContent=`値引きは${shown('b')}。払う分は100% − ${shown('b')} ＝ ${E.format(remain)}%。定価に、この残る割合をかける道筋もあるよ。`;}));
    }else if(m.kind==='ratio'){
      d.append(el('h3','比の数は、玉の個数？'),el('p',`赤：白は ${q('a').value}：${q('b').value}。同じ大きさの一つ分を並べよう。`));
      const units=el('div',undefined,'exploreRatio'),onePart=q('c').value/(q('a').value+q('b').value);
      for(let i=0;i<q('a').value+q('b').value;i++){const unit=el('div',undefined,i<q('a').value?'ratioRed':'ratioWhite');unit.dataset.color=i<q('a').value?'red':'white';unit.append(el('strong',i<q('a').value?'赤の一つ分':'白の一つ分'),el('p','□こ'));units.append(unit);}
      const questions=el('div',undefined,'guideChoices');
      questions.append(button(`赤は${q('a').value}こ、と決めてよい？`,()=>{status.textContent=`${q('a').value}は、赤のまとまりの数だよ。一つのまとまりに何こ入るかは、全部の${shown('c')}から考えよう。`;}));
      questions.append(button('同じ一つ分を、全部から求める',()=>{
        const parts=q('a').value+q('b').value;
        status.textContent=`同じ一つ分は全部で${parts}個。${q('c').value} ÷ ${parts} ＝ ${E.format(onePart)}こずつだね。`;
        for(const unit of units.children){unit.querySelector('p').textContent=E.format(onePart)+'こ';unit.querySelector('.guideBeads')?.remove();if(onePart<=12)unit.append(beads(onePart,unit.dataset.color==='red'?'red-bead':'white-bead'));}
      }));
      d.append(units,questions,status,el('p','赤も白も、一つ分の大きさは同じ。赤の一つ分がいくつあるかを見て、赤の数を求めよう。'));
    }else if(m.kind==='proportion'){
      d.append(el('h3','冊数と代金を、同じ列で見よう'),el('p',`1冊の代金は${m.unknown==='a'?'□':E.format(q('a').value)}円。単価は一定で、追加の料金はないよ。`));
      const table=el('table'),head=el('tr'),cost=el('tr');head.append(el('th','冊数'));cost.append(el('th','代金'));
      const cells=[];for(let count=1;count<=4;count++){const h=el('td',count+'冊'),c=el('td','□円');h.dataset.count=String(count);head.append(h);cost.append(c);cells.push({h,c,count});}
      table.append(el('caption','一つの列が、対応する冊数と代金'),head,cost);
      const choices=el('div',undefined,'guideChoices');
      [1,2,3,4].forEach(count=>{const b=button(count+'冊の代金を見る',()=>{for(const cell of cells){cell.h.classList.toggle('activeCorrespondence',cell.count===count);cell.c.classList.toggle('activeCorrespondence',cell.count===count);if(cell.count===count){cell.c.textContent=E.format(q('a').value*count)+'円';}}
        choices.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));status.textContent=count===1?'1冊の代金が基準になるよ。':`冊数が1冊の${count}倍なら、代金も${count}倍。単価が同じで、追加料金がないからだよ。`;});b.dataset.count=String(count);b.setAttribute('aria-pressed','false');choices.append(b);});
      const exception=el('details');exception.append(el('summary','追加料金があったら？'),el('p','例えば袋代50円を一度だけ加えると、冊数が2倍でも、代金ぜんぶは2倍にならないね。「増えるから比例」ではなく、条件と対応を確かめよう。'));
      d.append(table,choices,status,exception);
    }else{
      const a=q('a').value,b=q('b').value;if(!Number.isInteger(a)||!Number.isInteger(b)||a>12||b>12)return null;
      d.append(el('h3','一列の数と、列の数で数えよう'));
      const grid=el('div',undefined,'unitGrid areaExplore');grid.style.gridTemplateColumns=`repeat(${b},1fr)`;
      for(let i=0;i<a*b;i++){const tile=el('span');tile.dataset.row=String(Math.floor(i/b));tile.append(root.WordProblemIllustrations.image('unit-square',true));grid.append(tile);}
      const choices=el('div',undefined,'guideChoices');let visible=0;
      choices.append(button('一列ずつ、数えてみる',()=>{if(visible<a)visible++;[...grid.children].forEach(tile=>tile.classList.toggle('countedSquare',Number(tile.dataset.row)<visible));status.textContent=`一列は${b}個。${visible}列で、1cm²が${visible*b}個分だね。`;}),button('はじめから見る',()=>{visible=0;[...grid.children].forEach(tile=>tile.classList.remove('countedSquare'));status.textContent='小さい正方形一つが1cm²。長さを足すのと、正方形の数を数えるのは違うね。';}));
      d.append(grid,choices,status);
    }
    return d;
  }
  const api={draw,percentFill};if(typeof module!=='undefined')module.exports=api;
  root.WordProblemInteractiveGuides=api;
})(typeof window==='undefined'?globalThis:window);

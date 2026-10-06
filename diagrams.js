(function(root){
  'use strict';
  const E=root.WordProblemEngine;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  function draw(m){
    const box=el('div',undefined,'learningDiagram');
    const q=id=>m.quantities.find(x=>x.id===id);
    const label=id=>`${q(id).label}　${id===m.unknown?'□':q(id).display||E.format(q(id).value)}${q(id).unit}`;
    function dots(count,cross=0,key=WordProblemIllustrations.object(m,'a')||'candy'){
      const n=el('div',undefined,'dots pictureDots');n.setAttribute('role','img');
      n.setAttribute('aria-label',`${count}こ${cross?`のうち${cross}こを取る`:''}`);
      for(let i=0;i<count;i++)n.append(WordProblemIllustrations.token(key,i<cross?'eaten':''));return n;
    }
    function row(name,value){const line=el('div',undefined,'diagramRow');line.append(el('strong',name),el('span',value));box.append(line);return line;}
    function note(text){box.append(el('p',text,'tiny'));}
    function animate(title,run){const b=el('button',title,'quiet');b.type='button';b.addEventListener('click',()=>{run();b.disabled=true;});box.append(b);}
    if(m.diagram==='additive'&&m.stage===0){
      box.classList.add('concreteDiagram');
      if(m.kind==='decrease'){row('はじめの数',E.format(m.total)+'こ');box.append(dots(m.total,m.a));note('線のついた分が食べた分。線のない分を数えよう。');}
      else if(m.kind==='compare'){
        const pairs=el('div',undefined,'comparisonPairs');
        const headings=el('div',undefined,'comparisonPair');headings.append(el('strong',m.names.a),el('strong',m.names.total));pairs.append(headings);
        for(let i=0;i<m.total;i++){
          const pair=el('div',undefined,'comparisonPair');
          pair.append(i<m.a?WordProblemIllustrations.token('sticker'):el('span','', 'emptyPartner'),WordProblemIllustrations.token('sticker',i>=m.a?'unpaired':''));pairs.append(pair);
        }
        box.append(pairs);note('横に一つずつ組にすると、相手のないシールはどれかな？');
      }else{['a','b'].forEach(id=>{row(m.names[id],E.format(m[id])+m.unit);box.append(dots(m[id],0,WordProblemIllustrations.object(m,id)));});note('二つのまとまりを合わせて数えよう。');}
    }else if(m.diagram==='additive'){
      box.classList.add('tape');row('全体',label('total'));const parts=el('div',undefined,'partTape');['a','b'].forEach(id=>parts.append(el('span',label(id),id===m.unknown?'unknown':'')));box.append(parts);note('全体と部分の位置を見よう。模式図なので長さを測って答えを出す図ではありません。');
      if(m.stage===1){
        const concrete=el('div',undefined,'partPictures');
        ['a','b'].forEach(id=>{
          const part=el('div');part.append(el('strong',q(id).label));
          if(id===m.unknown)part.append(el('p','□','pictureUnknown'));
          else if(q(id).value<=20)part.append(dots(q(id).value,m.kind==='decrease'&&id==='a'?q(id).value:0,WordProblemIllustrations.object(m,id)));
          else part.append(el('p',E.format(q(id).value)+q(id).unit));
          concrete.append(part);
        });box.append(concrete);note('聞かれた部分は□。分かっている部分と、全体をつなげて見よう。');
      }
    }else if(m.kind==='groups'){
      const area=el('div',undefined,'groupArea');box.append(area);
      if(m.unknown==='total'){
        row('一皿分と、いくつ分か',`${E.format(m.a??q('a').value)}こずつ × ${q('b').value}皿`);
        for(let i=0;i<q('b').value;i++){const plate=el('div',undefined,'plate');plate.append(dots(q('a').value));area.append(plate);}note('一つの囲みが一皿分。同じ囲みがいくつあるかな？');
      }else if(m.unknown==='a'){
        row('ぜんぶのあめ',label('total'));for(let i=0;i<q('b').value;i++)area.append(el('div','□こ','plate'));
        const supply=el('div');supply.append(dots(q('total').value));box.append(supply);
        note('お皿の数は分かっているよ。一つずつ順番に配って、どの皿も同じ数にしよう。');
        animate('一つずつ 同じ数に配ってみる',()=>{
          const plates=[...area.children];plates.forEach(plate=>plate.replaceChildren(dots(0)));
          const status=el('p','0こ 配ったよ。','tiny');status.setAttribute('aria-live','polite');box.append(status);
          let count=0;function distribute(){
            if(!box.isConnected||count>=q('total').value)return;
            supply.querySelector('.dots > span')?.remove();plates[count%plates.length].querySelector('.dots').append(WordProblemIllustrations.token('candy','appear'));count++;
            plates.forEach(plate=>plate.querySelector('.dots').setAttribute('aria-label',plate.querySelector('.dots').children.length+'こ'));
            supply.querySelector('.dots').setAttribute('aria-label',(q('total').value-count)+'こ');
            status.textContent=`${count}こ 配ったよ。どのお皿も同じ数になるかな？`;
            if(count<q('total').value)setTimeout(distribute,200);
          }distribute();
        });
      }else{
        row('ぜんぶのあめ',label('total'));const supply=el('div');supply.append(dots(q('total').value));box.append(supply);row('一皿に入れる数',label('a'));note('一皿分ずつ取り分けて、できたお皿を数えよう。');
        animate('同じ数ずつ 取り分けてみる',()=>{
          let count=0;function takeGroup(){
            if(!box.isConnected||count>=q('b').value)return;
            for(let i=0;i<q('a').value;i++)supply.querySelector('.dots > span')?.remove();
            const plate=el('div',undefined,'plate appear');plate.append(dots(q('a').value));area.append(plate);count++;
            supply.querySelector('.dots').setAttribute('aria-label',(q('total').value-count*q('a').value)+'こ');
            if(count<q('b').value)setTimeout(takeGroup,500);
          }takeGroup();
        });
      }
    }else if(m.kind==='compound'){
      row('一人分',`${label('a')} ＋ ${label('b')}`);
      const cards=el('div',undefined,'onePersonCards');
      if(q('a').value+q('b').value<=24)cards.append(dots(q('a').value,0,'red-card'),dots(q('b').value,0,'blue-card'));
      box.append(cards);
      const branches=el('div',undefined,'branches');branches.append(el('div','一人分を合わせる → 人数分にする'),el('div','赤を人数分・青を人数分 → 合わせる'));box.append(branches);row('人数',label('c'));row('聞かれた数',label('total'));note('赤い絵と青い絵は一人分。色と人数のどちらからまとめるかを考えよう。');
    }else if(m.kind==='area'){
      row('たてと横',`${label('a')} ／ ${label('b')}`);const grid=el('div',undefined,'unitGrid');const a=q('a').value,b=q('b').value;
      if(Number.isInteger(a)&&Number.isInteger(b)&&a<=12&&b<=12){grid.style.gridTemplateColumns=`repeat(${b},1fr)`;for(let i=0;i<a*b;i++)grid.append(el('span',''));box.append(grid);note('小さい正方形は1cm²。一列の数と、列の数から数えられるね。');}else note('1cm²の正方形を、たてと横に並べると考えよう。');
    }else if(m.kind==='percent'||m.kind==='discount'){
      row('100%に当たる量',label('a'));const bar=el('div',undefined,'percentBar');bar.append(el('span','100%（もとを1）'));box.append(bar);
      if(m.unknown!=='b'){
        const parts=el('div',undefined,'percentageParts'),piece=el('span',q('b').value+'%'),rest=el('span',(100-q('b').value)+'%');
        piece.style.flex=String(q('b').value);rest.style.flex=String(100-q('b').value);piece.className='percentagePiece';parts.append(piece,rest);box.append(parts);
      }
      const percent=q('b');if(m.unknown==='b')row('割合','□%');else row('割合',`${percent.value}% ＝ ${E.format(percent.value/100)}`);
      if(m.kind==='discount')row('払う割合',`100% − ${percent.value}%`);
      row('聞かれた量',label(m.unknown));note('もとにする量と比べる量を同じ単位でそろえ、どちらが100%か確かめよう。');
    }else if(m.kind==='ratio'){
      const a=q('a').value,b=q('b').value;row('赤：白',`${a}：${b}`);const groups=el('div',undefined,'ratioUnits');
      for(let i=0;i<a+b;i++)groups.append(el('span','一つ分',i<a?'redUnit':'whiteUnit'));box.append(groups);row('全部',label('c'));note(`同じ大きさの一つ分が全部で${a+b}個。赤はそのうち${a}個分だよ。`);
    }else if(m.kind==='average'){
      row('一日目・二日目・三日目',`${E.format(m.params[1])}冊 ／ ${E.format(m.params[2])}冊 ／ ${E.format(m.params[0]-m.params[1]-m.params[2])}冊`);
      const columns=el('div',undefined,'averageColumns');[m.params[1],m.params[2],m.params[0]-m.params[1]-m.params[2]].forEach(n=>{const bar=el('div',String(n));bar.style.height=Math.max(20,n*9)+'px';columns.append(bar);});box.append(columns);
      note('全部の本の数を変えずに、三日とも同じ数になるようにならすよ。');animate('同じ大きさに ならしてみる',()=>[...columns.children].forEach(n=>{n.style.height=Math.max(20,m.answer*9)+'px';n.textContent=E.format(m.answer);}));
    }else if(m.kind==='fractiondiv'){
      row('全部の長さ',label('a'));row('一本分',label('b'));const ribbon=el('div','リボンの全部','ribbon');box.append(ribbon);note('一本分を、同じ長さずつ並べよう。全部に何本分入るかを数えるよ。');
      if(m.answer<=16)animate('一本分ずつ 区切ってみる',()=>{ribbon.replaceChildren();for(let i=0;i<m.answer;i++)ribbon.append(el('span',E.format(q('b').value)+'m'));});
    }else if(m.kind==='fractionmul'||m.kind==='decimalmul'||m.kind==='times'){
      row('もとの量を1とする',label('a'));row('何倍か',label('b'));row('比べる量',label('total'));
      const line=el('div',undefined,'doubleLine');line.append(el('div',`基準の対応：1倍 ↔ ${m.unknown==='a'?'□':q('a').display||E.format(q('a').value)}${q('a').unit}`),el('div',`比べる対応：${m.unknown==='b'?'□':q('b').display||E.format(q('b').value)}倍 ↔ ${m.unknown==='total'?'□':q('total').display||E.format(q('total').value)}${q('total').unit}`));box.append(line);note('どの量を1倍としているかを見よう。比べる量が小さくても、何倍かの関係を使えるよ。');
    }else if(m.kind==='inverse'){
      row('同じ仕事',label('total'));const table=el('table');table.append(el('caption','人数が変わると、時間は？'));
      [['人数','1人',label('a')],['時間',E.format(q('total').value)+'分',label('b')]].forEach(cells=>{const tr=el('tr');cells.forEach((t,i)=>tr.append(el(i===0?'th':'td',t)));table.append(tr);});box.append(table);note('人数×時間が一定。同じ仕事・同じ速さ・分担できるという条件が必要だよ。');
    }else{
      const table=el('table');table.append(el('caption',m.kind==='speed'?'同じ速さで進むときの対応':m.kind==='proportion'?'追加料金のないノートの代金':'一つ分と、いくつ分かの対応'));
      const top=el('tr'),bottom=el('tr');top.append(el('th',q('b').label),el('td','1'),el('td',m.unknown==='b'?'□':E.format(q('b').value)));
      bottom.append(el('th',q('total').label),el('td',m.unknown==='a'?'□':E.format(q('a').value)),el('td',m.unknown==='total'?'□':E.format(q('total').value)));table.append(top,bottom);box.append(table);
      note(m.kind==='speed'?'速さは1時間当たりの道のり。時間と道のりの単位をそろえよう。':'上下の数を対応させて、一つ分・いくつ分・全部のどれが未知かを見よう。');
    }
    return box;
  }
  root.WordProblemDiagrams={draw};
})(window);

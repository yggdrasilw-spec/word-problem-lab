(function(root){
  'use strict';
  const scenes={
    gather:{title:'二つのまとまりを 合わせる',alt:'赤い花と白い花を、左右から同じ花びんへ集める動き',cue:'二つのまとまりを、一つに集めるよ。',roles:['a','b','total']},
    receive:{title:'受け取ると、どう変わる？',alt:'差し出されたあめを、子どもが手のひらで受け取る動き',cue:'はじめに持っていた分に、もらった分が加わるよ。',roles:['a','b','total']},
    remove:{title:'取り去ると、どう変わる？',alt:'お皿から取ったあめを食べる動き',cue:'はじめにあった分は、食べた分と残りの分に分かれるよ。',roles:['total','a','b']},
    compare:{title:'一つずつ 相手を見つける',alt:'二人のシールを横に一つずつ組にして並べる動き',cue:'一つずつ組にして、相手のない分を見るよ。',roles:['a','total','b']},
    repeat:{title:'同じ一皿分が、いくつ分？',alt:'同じ一皿分を用意するため、あめをお皿に置く動き',cue:'一皿分の数をそろえて、同じまとまりを作るよ。',roles:['a','b','total']},
    share:{title:'お皿を決めて、一つずつ配る',alt:'先に置いたお皿へ、あめを一つずつ順番に配る動き',cue:'お皿の数は決まっているよ。一つずつ順番に配り、一皿にいくつ入るかを見るよ。',roles:['total','b','a']},
    take:{title:'一皿分を決めて、取り分ける',alt:'一皿分のまとまりを、大きな袋からお皿へ取り分ける動き',cue:'小袋は一皿分のまとまりの見本だよ。一皿に入れる数を決め、その分ずつ取って、できた皿を数えるよ。',roles:['total','a','b']},
    cards:{title:'一人分を、どうまとめる？',alt:'赤いカードと青いカードを並べて、一人分の組を作る動き',cue:'赤と青を合わせて一人分を作れるね。色ごとに人数分を考える道筋もあるよ。',roles:['a','b','c','total']},
    measure:{title:'どの長さを基準にする？',alt:'リボンと基準の帯を並べて長さを確かめる動き',cue:'絵の帯の長さは見本。下の図で、単位や、もとにする長さを確かめよう。',roles:['a','b','total']},
    cut:{title:'一本分を、何回取れる？',alt:'一本分を取り分けるため、リボンをはさみで切る動き',cue:'一本分の長さずつ区切るよ。下の図で、全体に何本分入るかを確かめよう。',roles:['a','b','total']},
    average:{file:'average-v2',title:'全部を変えずに、ならす',alt:'同じ大きさの容器の間で、本を移して配り直す動き',cue:'本を移しても、全部の数は変わらないね。下の図で、三日分を同じ数にならそう。',roles:[]},
    rate:{file:'rate-v2',title:'同じ時間に、同じ道のり',alt:'一人の子どもが道に沿って歩く動き',cue:'一定の速さで進むよ。目印の絵から距離を測らず、下の対応する時間と道のりを見よう。',roles:['a','b','total']},
    work:{title:'同じ仕事を、分担する',alt:'二人が同じ箱の仕事を分担して、それぞれ同じ作業をする様子',cue:'同じ量の仕事を、同じ速さで分担する場合だよ。人数が変わると、時間はどう変わるかな？',roles:['total','a','b']}
  };
  function keyFor(m){
    if(m.kind==='combine')return 'gather';if(m.kind==='increase')return 'receive';
    if(m.kind==='decrease')return 'remove';if(m.kind==='compare')return 'compare';
    if(m.kind==='groups')return m.unknown==='a'?'share':m.unknown==='b'?'take':'repeat';
    if(m.kind==='compound')return 'cards';if(m.kind==='average')return 'average';
    if(m.kind==='fractiondiv')return 'cut';if(m.kind==='speed')return 'rate';
    if(m.kind==='inverse')return 'work';
    if(['times','lengthgroups','unitprice','decimalmul','fractionmul','decimaladd'].includes(m.kind))return 'measure';
    return null;
  }
  function draw(m){
    const key=keyFor(m);if(!key)return null;const scene=scenes[key];
    const details=document.createElement('details');details.className='actionScene';details.dataset.scene=key;
    const summary=document.createElement('summary');summary.textContent='動きの絵で たしかめる';
    const heading=document.createElement('h3');heading.textContent=scene.title;
    const img=document.createElement('img');img.src='assets/scenes/'+(scene.file||key)+'.png';img.alt=scene.alt;img.width=640;img.height=400;img.decoding='async';
    const sample=document.createElement('p');sample.className='tiny';sample.textContent='動きの見本だよ。絵の個数や長さは、今のお話の数を表していないよ。';
    const cue=document.createElement('p');cue.textContent=scene.cue;
    details.append(summary,heading,img,sample,cue);
    const places=document.createElement('div');places.className='sceneQuantities';
    for(const id of scene.roles){
      const q=m.quantities.find(q=>q.id===id);if(!q||q.derived)continue;
      const card=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');
      card.className=id===m.unknown?'askedQuantity':'knownQuantity';card.dataset.quantity=id;
      label.textContent=q.label;number.textContent=(id===m.unknown?'□':q.display||root.WordProblemEngine.format(q.value))+q.unit;
      card.append(label,number);if(id===m.unknown){const ask=document.createElement('small');ask.textContent='ここを聞いているよ';card.append(ask);}places.append(card);
    }
    if(places.children.length){details.append(places);const focus=document.createElement('p');focus.textContent=m.stage===0?'何の数を聞いているか、□の場所をたしかめよう。':'動きの言葉だけで計算を決めず、□がどの量かをたしかめよう。';details.append(focus);}
    return details;
  }
  const api={scenes,keyFor,draw};
  if(typeof module!=='undefined')module.exports=api;
  root.WordProblemActionScenes=api;
})(typeof window==='undefined'?globalThis:window);

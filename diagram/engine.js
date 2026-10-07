(function(root){
  'use strict';
  const kinds=['combine','increase','decrease','compare'];
  const typeNames={combine:'あわせて',increase:'ふえると',decrease:'のこりは',compare:'ちがいは'};
  const steps=['お話','動き','絵から○','○の図','描くところ','１本め','つづきを描く','名前と数','式'];
  function validate(data){
    if(!data || typeof data!=='object' || !kinds.includes(data.kind)) throw Error('お話の種類をえらんでください。');
    for(const k of ['left','right']) if(!Number.isInteger(data[k]) || data[k]<1 || data[k]>99) throw Error('部分の数は1〜99の整数にしてください。');
    if(!['left','right','total'].includes(data.unknown)) throw Error('わからない場所をえらんでください。');
    for(const k of ['title','unit','iconA','iconB','nameA','nameB']) if(typeof data[k]!=='string' || !data[k].trim() || data[k].length>80) throw Error('名前・絵・単位を入力してください（80文字まで）。');
    if(data.story!==undefined && (!Array.isArray(data.story) || data.story.length>3 || data.story.some(s=>typeof s!=='string' || s.length>500))) throw Error('お話は３行までにしてください。');
    if(data.continuous!==undefined && typeof data.continuous!=='boolean') throw Error('量の種類を確認してください。');
    for(const k of ['imageA','imageB']) if(data[k]!==undefined && (typeof data[k]!=='string'||data[k].length>1400000||!(/^(?:assets\/(?:white|red)-flower\.png|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)$/.test(data[k])))) throw Error('画像はPNG・JPEG・WebP・GIF（1MBまで）にしてください。');
    return {...data,total:data.left+data.right};
  }
  function model(data){
    const m=validate(data);
    m.typeName=typeNames[m.kind];
    m.names=m.kind==='increase'?{left:'はじめ',right:m.nameB,total:'ぜんぶ'}:m.kind==='decrease'?{left:m.nameA,right:'のこり',total:'はじめ'}:m.kind==='compare'?{left:m.nameA,right:'ちがい',total:m.nameB}:{left:m.nameA,right:m.nameB,total:'ぜんぶ'};
    m.start=m.kind==='decrease'||m.kind==='compare'?'total':'left';
    if(data.quantityNames){
      for(const role of ['left','right','total']){
        const name=data.quantityNames[role];
        if(typeof name!=='string'||!name.trim()||name.length>80)throw Error('量の名前を確認してください。');
      }
      m.names={...data.quantityNames};
    }
    m.display=(role,reveal=false)=>m.unknown===role&&!reveal?'□':String(m[role]);
    m.label=(role,reveal=false)=>`${m.names[role]} ${m.display(role,reveal)}${m.unit}`;
    m.equation=m.unknown==='total'?`${m.left} ＋ ${m.right} ＝ ${m.total}`:m.unknown==='left'?`${m.total} − ${m.right} ＝ ${m.left}`:`${m.total} − ${m.left} ＝ ${m.right}`;
    m.reason=m.unknown==='total'?'ぜんたいが わからないので、ぶぶんと ぶぶんを たします。':'ぶぶんが わからないので、ぜんたいから わかっている ぶぶんを ひきます。';
    const v=r=>m.display(r)==='□'?'何'+m.unit+'か':m[r]+m.unit;
    m.quantityName=r=>m.names[r]+(/[ただ]$/.test(m.names[r])?'':'の')+(m.continuous?'長さ':'数');
    const question=`${m.quantityName(m.unknown)}は 何${m.unit}でしょう。`;
    m.lines=m.story?.length?m.story:m.kind==='increase'?[`はじめに ${v('left')} ありました。`,`${m.quantityName('right')}は ${v('right')}。${m.unknown==='total'?'':`ぜんぶで ${m.total}${m.unit}に なりました。`}`,question]:m.kind==='decrease'?[`はじめに ${v('total')} ありました。`,`${m.quantityName('left')}は ${v('left')}。${m.unknown==='right'?'':`のこりは ${m.right}${m.unit}です。`}`,question]:m.kind==='compare'?[`${m.nameB}は ${v('total')}、${m.nameA}は ${v('left')}です。`,question]:[`${m.nameA}が ${v('left')}、${m.nameB}が ${v('right')} あります。`,question];
    // Preserve the relative size of the parts; keep tiny parts usable on a touch screen.
    m.ratio=Math.max(.18,Math.min(.82,m.left/m.total));
    return m;
  }
  function rangeArc(start,end,baseline,bend=-14){return `M ${start} ${baseline} Q ${(start+end)/2} ${baseline+2*bend} ${end} ${baseline}`;}
  const api={kinds,typeNames,steps,validate,model,rangeArc};
  if(typeof module!=='undefined') module.exports=api;
  root.TapeLessonEngine=api;
})(typeof window!=='undefined'?window:globalThis);

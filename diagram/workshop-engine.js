(function(root){
  'use strict';
  const roles=['total','left','right'];
  function assignments(map){return roles.every(role=>map[role]===role);}
  function feedback(model,map){
    if(roles.some(role=>!map[role]))return 'まだ名前がない範囲があります。３つの弧に、名前と数を置こう。';
    if(map.total!=='total')return model.kind==='decrease'?'へる話の「はじめ」は、出ていった分とのこりを合わせた全体だね。全体の弧を確かめよう。':'２つの部分を合わせた範囲が、全体だね。上の弧を確かめよう。';
    if(map.left!=='left'||map.right!=='right')return '２つの部分の名前が、お話と合っているかな？弧の両端を確かめよう。';
    return '３つの範囲に、名前と数を正しく置けたね。';
  }
  function stroke(kind,stage,existing,start,end){
    if(!start||!end||![start.x,start.y,end.x,end.y].every(Number.isFinite))return {ok:false,message:'左から右へ、指で線を引いてみよう。'};
    if(kind==='decrease'&&stage===1){
      if(end.x<=existing.a+35||end.x>=existing.b-35)return {ok:false,message:'テープの中で、２つの部分に分けよう。'};
      return {ok:true,geometry:{...existing,cut:end.x}};
    }
    const width=end.x-start.x;
    if(Math.abs(end.y-start.y)>70)return {ok:false,message:'線は、左から右へ横に描いてみよう。'};
    if(stage===0){
      const upper=['increase','combine'].includes(kind)?680:830;
      if(start.x<60||end.x>upper||width<100)return {ok:false,message:kind==='increase'||kind==='combine'?'左の部分を描こう。右の部分をつなぐ場所も残しておこう。':'まとまりがわかるように、少し長く左から右へ描こう。'};
      return {ok:true,geometry:{a:start.x,b:end.x}};
    }
    if(kind==='compare'){
      if(Math.abs(start.x-existing.a)>45)return {ok:false,message:'２本の線は、同じ左端から描こう。'};
      if(end.x-existing.a<50||end.x>=existing.b-25)return {ok:false,message:'少ないほうは、多いほうより短い線にしよう。'};
      return {ok:true,geometry:{...existing,cut:end.x}};
    }
    if(Math.abs(start.x-existing.b)>45)return {ok:false,message:'はじめに描いた部分の右端から、つなごう。'};
    if(end.x>830||end.x-existing.b<50)return {ok:false,message:'右の部分も、少し長く描いてみよう。'};
    return {ok:true,geometry:{a:existing.a,b:end.x,cut:existing.b}};
  }
  const api={roles,assignments,feedback,stroke};if(typeof module!=='undefined')module.exports=api;root.TapeWorkshopEngine=api;
})(typeof window!=='undefined'?window:globalThis);

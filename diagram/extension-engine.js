(function(root){
  'use strict';
  function number(n,min,max,name){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(`${name}は ${min}〜${max}の数にしてください。`);}
  function percent(data){
    number(data.base,1,1000,'もとにする量');number(data.compared,0,2000,'くらべる量');
    if(!['ratio','compared','base'].includes(data.unknown))throw Error('求める量をえらんでください。');
    if(data.unknown==='base'&&data.compared===0)throw Error('もとにする量を求めるときは、くらべる量を0より大きくしてください。');
    const ratio=data.compared/data.base;
    return {...data,ratio,percent:ratio*100,scale:Math.max(1,ratio),question:data.unknown==='ratio'?'くらべる量は、もとにする量の何倍？ 何％？':data.unknown==='compared'?'もとにする量と割合から、くらべる量を求めよう。':'くらべる量と割合から、もとにする量を求めよう。'};
  }
  function ratio(data){
    for(const k of ['a','b'])if(!Number.isInteger(data[k])||data[k]<1||data[k]>10)throw Error('比の数は1〜10の整数にしてください。');
    if(!Number.isInteger(data.total)||data.total<1||data.total>1000)throw Error('ぜんぶの数は1〜1000の整数にしてください。');
    if(data.total%(data.a+data.b)!==0)throw Error(`１つ分が整数になるように、ぜんぶの数を ${data.a+data.b}の倍数にしてください。`);
    const one=data.total/(data.a+data.b);
    return {...data,one,left:data.a*one,right:data.b*one,shares:data.a+data.b};
  }
  const api={percent,ratio};if(typeof module!=='undefined')module.exports=api;root.TapeExtensionEngine=api;
})(typeof window!=='undefined'?window:globalThis);

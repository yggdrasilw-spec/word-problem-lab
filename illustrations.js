(function(root){
  'use strict';
  const catalog={
    'candy':'あめ','red-flower':'赤い花','white-flower':'白い花','sticker':'シール',
    'red-card':'赤いカード','blue-card':'青いカード','book':'本','notebook':'ノート',
    'red-ribbon':'赤いリボン','blue-ribbon':'青いリボン','red-bead':'赤い玉','white-bead':'白い玉',
    'unit-square':'小さい正方形','walker':'歩く人','worker':'仕事をする人','price-tag':'値札','student':'児童'
  };
  function image(key,decorative=false){
    const img=document.createElement('img');img.src='assets/illustrations/'+key+'.png';
    img.alt=decorative?'':catalog[key];img.width=96;img.height=96;img.decoding='async';
    img.addEventListener('error',()=>{const fallback=document.createElement('span');fallback.textContent=decorative?'●':catalog[key];img.replaceWith(fallback);},{once:true});return img;
  }
  function object(m,role){
    if(m.kind==='combine')return role==='a'?'red-flower':'white-flower';
    if(m.kind==='compare')return 'sticker';
    if(['increase','decrease','groups'].includes(m.kind))return 'candy';
    if(m.kind==='compound')return role==='a'?'red-card':'blue-card';
    return null;
  }
  function token(key,cls=''){
    const span=document.createElement('span');span.className='pictureToken '+cls;
    span.append(image(key,true));return span;
  }
  function samples(m){
    const keys=m.kind==='combine'?['red-flower','white-flower']:
      ['increase','decrease','groups'].includes(m.kind)?['candy']:
      m.kind==='compare'?['sticker']:m.kind==='compound'?['red-card','blue-card']:
      m.kind==='ratio'?['red-bead','white-bead']:m.kind==='average'?['book']:
      m.kind==='area'?['unit-square']:m.kind==='speed'?['walker']:
      m.kind==='inverse'?['worker']:m.kind==='percent'?['student']:
      m.kind==='discount'?['price-tag']:m.kind==='proportion'?['notebook']:
      ['red-ribbon','blue-ribbon'];
    const section=document.createElement('div');section.className='objectSamples';
    keys.forEach(key=>{const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=catalog[key];figure.append(image(key),caption);section.append(figure);});
    const caption=document.createElement('p');caption.className='tiny';caption.textContent='ものの見本だよ。数や長さは、お話の文でたしかめよう。';
    const wrapper=document.createElement('div');wrapper.className='storyPictures';wrapper.append(section,caption);return wrapper;
  }
  root.WordProblemIllustrations={catalog,image,object,token,samples};
})(window);

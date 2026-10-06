(function(root) {
  'use strict';
  const base = typeof module !== 'undefined' ? require('./engine.js') : root.WordProblemEngine;
  const near = (a,b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) < 1e-8 * Math.max(1,Math.abs(a),Math.abs(b));
  function normalize(s) { return base.normalize(s).replace(/[×xｘ·]/g,'*').replace(/÷/g,'/'); }
  function parse(input) {
    const s=normalize(input); if (!s || s.length>160) throw Error('式は160文字までで書こう。');
    const tokens=s.match(/\d+(?:\.\d+)?|\.\d+|□|[()+*/%-]/g)||[];
    if(tokens.join('')!==s || tokens.length>100) throw Error('式の書き方を確かめよう。');
    let i=0,depth=0;
    const num=v=>({type:'num',value:v});
    function atom(){
      if(++depth>20)throw Error('かっこが多すぎます。');
      let a,t=tokens[i++];
      if(t==='('){a=sum();if(tokens[i++]!==')')throw Error('かっこを閉じよう。');}
      else if(t==='□')a={type:'box'};
      else if(t && /^(\d|\.)/.test(t))a=num(Number(t));
      else throw Error('数を入れよう。');
      if(tokens[i]==='%'){i++;a={type:'/',left:a,right:num(100)};}
      depth--;return a;
    }
    function product(){let a=atom();while(['*','/'].includes(tokens[i])){const op=tokens[i++];a={type:op,left:a,right:atom()};}return a;}
    function sum(){let a=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++];a={type:op,left:a,right:product()};}return a;}
    const a=sum();if(i!==tokens.length)throw Error('式の書き方を確かめよう。');return a;
  }
  function evaluate(t,box=NaN){
    if(t.type==='num')return t.value;if(t.type==='box')return box;
    const a=evaluate(t.left,box),b=evaluate(t.right,box);
    if(t.type==='+')return a+b;if(t.type==='-')return a-b;if(t.type==='*')return a*b;
    if(b===0)throw Error('0では割れないよ。');return a/b;
  }
  function canonical(t){
    if(t.type==='num')return 'n'+Number(t.value.toPrecision(12));if(t.type==='box')return '□';
    if(['*','/'].includes(t.type)){
      const top=[],bottom=[];function collect(n,inverse=false){if(n.type==='*'){collect(n.left,inverse);collect(n.right,inverse);}else if(n.type==='/'){collect(n.left,inverse);collect(n.right,!inverse);}else(inverse?bottom:top).push(canonical(n));}collect(t);
      return 'product('+top.sort().join(',')+';'+bottom.sort().join(',')+')';
    }
    if(t.type==='+'){
      const list=[];function collect(n){if(n.type===t.type){collect(n.left);collect(n.right);}else list.push(canonical(n));}collect(t);
      return t.type+'('+list.sort().join(',')+')';
    }return t.type+'('+canonical(t.left)+','+canonical(t.right)+')';
  }
  function match(actual,expected,nested=false){
    // A fractional numeral may replace a numeric leaf, but cannot replace a whole calculation.
    if(expected.type==='num') {try{return (actual.type==='num'||(actual.type==='/'&&actual.left.type==='num'&&actual.right.type==='num'))&&near(evaluate(actual),expected.value);}catch(_){return false;}}
    if(expected.type==='box')return actual.type==='box';
    if(nested&&actual.type==='num'&&expected.type==='/'&&expected.left.type==='num'&&expected.right.type==='num')return near(actual.value,evaluate(expected));
    if(canonical(actual)===canonical(expected))return true;
    if(actual.type!==expected.type)return false;
    return (match(actual.left,expected.left,true)&&match(actual.right,expected.right,true)) ||
      (['+','*'].includes(expected.type)&&match(actual.left,expected.right,true)&&match(actual.right,expected.left,true));
  }
  function format(n){
    if(Number.isInteger(n))return String(n);
    const rounded=Number(n.toFixed(8));
    if(Math.abs(rounded*1000-Math.round(rounded*1000))<1e-7)return String(rounded);
    for(let d=2;d<=100;d++)if(near(Math.round(n*d)/d,n))return `${Math.round(n*d)}/${d}`;
    return String(rounded);
  }
  const exprNumber=n=>Number.isInteger(n)?String(n):'('+format(n)+')';
  function fraction(n){for(let d=1;d<=1000;d++)if(near(Math.round(n*d)/d,n))return d===1?String(Math.round(n)):Math.round(n*d)+'/'+d;return format(n);}
  const levels=[
    {title:'1年生｜あわせる・のこり・ちがい',bridge:'ものを合わせたり、取ったり、一つずつ組にしたりして、数の関係を見よう。'},
    {title:'2年生｜聞く場所と、同じ一つ分',bridge:'お話の動きだけでなく、どの数が分からないかを見るよ。同じ一つ分がいくつ分あるかも考えよう。'},
    {title:'3年生｜一つ分・いくつ分・途中の量',bridge:'かけざんの関係から、一つ分やいくつ分も求められるよ。先に何が分かるとよいかも考えよう。'},
    {title:'4年生｜式をまとめる・倍で比べる',bridge:'途中の量をかっこでまとめられるよ。差で比べることと、何倍かで比べることを分けよう。'},
    {title:'5年生｜もとを1に・割合・1当たり',bridge:'一つ分を1mや1時間と考えたり、もとにする量を1と考えたりして、二つの量を対応させよう。'},
    {title:'6年生｜分数・比・比例の関係',bridge:'数が分数になっても、数量の関係を使えるよ。比の一つ分や、変わらない関係から考えよう。'}
  ];
  function model(data){
    if(base.kinds.includes(data.kind)){
      const m=base.model(data);m.stage=data.stage??base.learningStage(data);
      m.quantities=base.roles.map(id=>({id,label:m.names[id],value:m[id],unit:m.unit}));
      m.paths=[{id:m.operation,title:m.operation==='join'?'まとまりを合わせる':'全体から部分をひく',expression:m.expression,reason:m.reason}];
      if(m.operation==='join')m.paths.push({id:'swap',title:'合わせる順番をかえる',expression:`${m.b}+${m.a}`,reason:m.reason});
      m.equations=[`${m.value('a')}+${m.value('b')}=${m.value('total')}`,`${m.value('total')}-${m.value('a')}=${m.value('b')}`,`${m.value('total')}-${m.value('b')}=${m.value('a')}`];
      m.concept=m.stage===0?'合わせた数・ふえたあとの数は、たしざんで。のこりや、二つの数のちがいは、ひきざんで考えられるよ。何の数を聞かれているかも確かめよう。':'へるお話でも、はじめの数を聞かれることがあるよ。全体を知りたいなら部分を合わせ、部分を知りたいなら全体からほかの部分をひこう。';
      m.faq=m.stage===0?[[m.kind==='compare'?'へっていないのに、ひきざん？':'どの数を使う？',m.reason]]:[['ふえる・へるだけで式を決める？','お話の動きと、聞かれた数は分けて考えよう。全体と部分の関係で確かめるよ。']];
      m.diagram='additive';m.paramLabels=['左の部分','右の部分'];m.params=[m.a,m.b];
      return finish(m);
    }
    const kind=data.kind,p=data.params?.map(n=>typeof n==='number'?n:evaluate(parse(n)));
    if(!p || p.length<2 || p.some(n=>!Number.isFinite(n)||n<=0||n>10000))throw Error('数は0より大きく、10000までにしよう。');
    const [a,b,c=4]=p, unknown=data.unknown||'total';
    let names,units,values,story,concept,faq,diagram='correspondence',paths=[],equations=[],paramLabels,op='*';
    const fractional=['fractionmul','fractiondiv'].includes(kind);
    const numeral=n=>fractional?'('+fraction(n)+')':exprNumber(n);
    const val=id=>id===unknown?'□':numeral(values[id]);
    const say=id=>id===unknown?'何'+units[id]+'か':(fractional?fraction(values[id]):format(values[id]))+units[id];
    const productFamily=['groups','times','lengthgroups','unitprice','decimalmul','speed','fractionmul','proportion','inverse'];
    if(productFamily.includes(kind)){
      const dict={
        groups:[['一皿分','お皿の数','ぜんぶ'],['こ','皿','こ'],['一皿分の数','お皿の数'],'同じ数ずつのまとまりは、一つ分の数と、いくつ分かを使って、かけざんで表せるよ。'],
        times:[['もとの長さ','何倍','比べる長さ'],['cm','倍','cm'],['もとの長さ','何倍か'],'差ではなく、もとの長さがいくつ分あるかで比べるとき、倍を使うよ。'],
        lengthgroups:[['一本の長さ','本数','全長'],['m','本','m'],['一本の長さ（m）','本数'],'一本の長さが小数でも、同じ長さが何本分あるかを考えられるよ。'],
        unitprice:[['1mの代金','長さ','代金ぜんぶ'],['円/m','m','円'],['1mの代金','長さ'],'1m分の代金と、何m分かを対応させて考えよう。'],
        decimalmul:[['もとの長さ','何倍','比べる長さ'],['m','倍','m'],['もとの長さ','何倍か'],'倍が小数でも、もとの量を1として、その何倍かを考えられるよ。'],
        speed:[['速さ','時間','道のり'],['km/時','時間','km'],['速さ（km/時）','時間'],'1時間当たりの道のりが速さ。一定の速さでは、時間と道のりが対応するよ。'],
        fractionmul:[['もとの長さ','何倍','比べる長さ'],['m','倍','m'],['もとの長さ（分数も可）','何倍か（分数も可）'],'何倍かが分数でも、もとの量と比べる量の関係を使うよ。1より小さい数をかけると小さくなるね。'],
        proportion:[['1冊の代金','冊数','代金ぜんぶ'],['円/冊','冊','円'],['1冊の代金','冊数'],'1冊の代金が一定で、追加の料金がないとき、冊数と代金は比例するよ。'],
        inverse:[['人数','かかる時間','1人ならかかる時間'],['人','分','分'],['人数','かかる時間'],'同じ仕事を、同じ速さで分担すると、人数×時間が一定になるよ。この条件で人数と時間は反比例するね。']
      };
      const d=dict[kind];names=Object.fromEntries(['a','b','total'].map((r,i)=>[r,d[0][i]]));units=Object.fromEntries(['a','b','total'].map((r,i)=>[r,d[1][i]]));paramLabels=d[2];concept=d[3];values={a,b,total:a*b};
      if(kind==='groups' && (!Number.isInteger(a)||!Number.isInteger(b)||a>12||b>12))throw Error('一皿分とお皿の数は1〜12の整数にしよう。');
      if(kind==='lengthgroups'&&!Number.isInteger(b))throw Error('本数は整数にしよう。');
      if(kind==='times'&&data.stage<3&&(!Number.isInteger(a)||!Number.isInteger(b)))throw Error('この段階では長さと倍を整数にしよう。');
      if(kind==='times'&&data.stage===3&&!Number.isInteger(b))throw Error('この型では、何倍かを整数にしよう。');
      if(kind==='decimalmul'&&data.stage===3&&(!Number.isInteger(a)||!near(a*b,Math.round(a*b))))throw Error('4年生のこの型では、二つの長さを整数にして、小数の倍を求めよう。');
      if(['proportion','inverse'].includes(kind)&&(!Number.isInteger(b)||!Number.isInteger(a)))throw Error('このお話の数は整数にしよう。');
      story=kind==='groups'?[`あめが 一皿に ${say('a')}ずつ、${say('b')} あります。`,`あめは ぜんぶで ${say('total')}です。`]
        : ['times','decimalmul','fractionmul'].includes(kind)?[`もとのリボンの長さは ${say('a')}です。`,`もう一つのリボンは もとの ${say('b')}で、長さは ${say('total')}です。`]
          : kind==='speed'?[`一定の速さ ${say('a')}で、${say('b')} 進みます。`,`道のりは ${say('total')}です。`]
            : kind==='inverse'?[`1人なら ${say('total')} かかる仕事を、${say('a')}で 分担します。`,`全員が同じ速さで働き、かかる時間は ${say('b')}です。`]
              : kind==='lengthgroups'?[`一本 ${say('a')}のリボンが ${say('b')} あります。`,`つないだ全長は ${say('total')}です。`]
              : kind==='proportion'?[`1冊 ${say('a')}のノートを ${say('b')} 買います。追加の料金はありません。`,`代金ぜんぶは ${say('total')}です。`]
                : [`1m ${say('a')}のリボンを ${say('b')} 買います。`,`代金ぜんぶは ${say('total')}です。`];
      const expression=unknown==='total'?`${val('a')}*${val('b')}`:unknown==='a'?`${val('total')}/${val('b')}`:`${val('total')}/${val('a')}`;
      const reason=unknown==='total'?`${names.a}と${names.b}をかけると、${names.total}になるから。`:`${names.a}×${names.b}＝${names.total}の関係から、${names[unknown]}を求めるから。`;
      paths.push({id:'main',title:unknown==='total'?'対応する二つの量から':'かけざんの逆の関係から',expression,reason});
      if(kind==='groups'&&unknown==='total')paths.push({id:'repeat',title:'同じ数を足して',expression:Array(b).fill(String(a)).join('+'),reason:`一皿分の${a}こを、${b}皿分合わせるから。`});
      equations=[`${val('a')}*${val('b')}=${val('total')}`,`${val('total')}/${val('a')}=${val('b')}`,`${val('total')}/${val('b')}=${val('a')}`];
      diagram=kind==='groups'?'groups':kind==='inverse'?'inverse':kind==='proportion'?'proportion':'correspondence';
      faq=kind==='groups'?[['何を「同じ」にするの？',unknown==='a'?'どのお皿にも同じ数になるよう配るよ。お皿の数は分かっていて、一皿分を求めるね。':unknown==='b'?'一皿に入れる数を同じにして取り分けるよ。いくつのお皿ができるかを求めるね。':'一皿に入っている数が同じだね。その一皿分が、いくつ分あるかを考えよう。']]
        : kind==='inverse'?[['人数が増えたら、時間も増える？','同じ仕事で全員の速さが同じなら、人数が増えると時間は短くなるよ。人数×時間が同じか確かめよう。']]
          : kind==='proportion'?[['二つの量が増えれば、比例？','それだけでは決められないよ。片方が2倍、3倍のとき、もう片方も2倍、3倍になる関係を確かめよう。']]
            : data.stage<4?[['何の数を求めている？',reason]]:[['かけると、必ず大きくなる？','何倍かが1より小さいと、比べる量はもとの量より小さくなるよ。数の大小だけで演算を決めず、関係を使おう。']];
      if(kind==='groups'&&unknown==='a'){concept='全部を、分かっているお皿の数に同じ数ずつ配ろう。一皿にいくつ入るかを求めるわりざんだよ。';paths[0].reason='全部のあめを、同じ数ずつ3皿に配って、一皿分の数を求めるから。'.replace('3皿',b+'皿');}
      if(kind==='groups'&&unknown==='b'){concept='一皿に入れる数を決めて、同じ数ずつ取り分けよう。何皿できるかを求めるわりざんだよ。';paths[0].reason=`全部のあめを${a}こずつ取り分けて、できるお皿の数を求めるから。`;}
      if(kind==='groups'&&unknown==='a')story=[`${values.total}このあめを、${b}皿に 同じ数ずつ分けます。`];
      if(kind==='groups'&&unknown==='b')story=[`${values.total}このあめを、一皿 ${a}こずつ 取り分けます。`];
    } else if(kind==='fractiondiv'){
      names={a:'ぜんぶの長さ',b:'一本分の長さ',total:'本数'};units={a:'m',b:'m/本',total:'本'};values={a,b,total:a/b};op='/';paramLabels=['ぜんぶの長さ','一本分の長さ'];
      if(!Number.isInteger(Math.round(values.total))||!near(values.total,Math.round(values.total)))throw Error('切り分ける本数が整数になる数にしよう。');
      story=[`${say('a')}のリボンを、一本 ${say('b')}ずつに切ります。`,`本数は ${say('total')}です。`];concept='一本分が分数でも、全部の長さに一本分がいくつ入るかを考えると、わりざんを使えるよ。';
      paths=[{id:'main',title:'いくつ分かを求める',expression:`${val('a')}/${val('b')}`,reason:'全部の長さに、一本分の長さがいくつ入るかを求めるから。'},{id:'reciprocal',title:'逆数を使って計算する',expression:`${val('a')}*(1/${val('b')})`,reason:'同じ長さを一本分の単位で数える。分数で割る計算は、その逆数をかけても求められるから。'}];
      equations=[`${val('b')}*${val('total')}=${val('a')}`,`${val('a')}/${val('b')}=${val('total')}`];diagram='groups';faq=[['割ると、必ず小さくなる？','一本分が1mより短いなら、本数の数値が全体のmの数値より大きくなることもあるよ。単位と意味も見よう。']];
    } else if(kind==='compound'){
      if(![a,b,c].every(Number.isInteger))throw Error('カードの枚数と人数は整数にしよう。');
      names={a:'赤いカード（一人分）',b:'青いカード（一人分）',c:'人数',total:'カードぜんぶ'};units={a:'枚',b:'枚',c:'人',total:'枚'};values={a,b,c,total:(a+b)*c};paramLabels=['赤いカード（一人分）','青いカード（一人分）','人数'];
      story=[`一人に 赤いカード ${say('a')}と 青いカード ${say('b')}を 配ります。`,`${say('c')}分のカードは ${say('total')}です。`];concept='先に一人分を求めても、赤と青を別々に求めてもよいよ。途中の数に名前をつけ、かっこで式をまとめよう。';
      paths=[{id:'combine-first',title:'先に一人分を合わせる',expression:`(${a}+${b})*${c}`,reason:'赤と青を合わせた一人分を求め、それを人数分にするから。'},{id:'colors-first',title:'色ごとに求めて合わせる',expression:`${a}*${c}+${b}*${c}`,reason:'赤の全員分と青の全員分を別々に求めて、最後に合わせるから。'}];equations=[`${paths[0].expression}=□`,`${paths[1].expression}=□`];diagram='compound';faq=[['文が二つなら、計算も二回？','文の数で決めないよ。求めたい数のために、先にどの数が必要かを考えよう。']];
      if(data.stage===2){concept='先に一人分を求めても、赤と青を別々に求めてもよいよ。途中で求める数にも名前をつけよう。';paths[0].work=`${a}+${b}=${a+b}\n${a+b}*${c}=${values.total}`;paths[1].work=`${a}*${c}=${a*c}\n${b}*${c}=${b*c}\n${a*c}+${b*c}=${values.total}`;}
    } else if(kind==='area'){
      if(data.stage===3&&![a,b].every(Number.isInteger))throw Error('この段階の長方形は、たてと横を整数cmにしよう。');
      names={a:'たて',b:'横',total:'面積'};units={a:'cm',b:'cm',total:'cm²'};values={a,b,total:a*b};paramLabels=['たて（cm）','横（cm）'];
      story=[`長方形のたては ${say('a')}、横は ${say('b')}です。`,`面積は ${say('total')}です。`];concept='面積は、1cm²の正方形がいくつ分あるかで考えるよ。たてと横の長さから、その数を求められるね。';paths=[{id:'main',title:'単位の正方形を並べる',expression:`${a}*${b}`,reason:'1cm²の正方形が、たての個数×横の個数だけ並ぶから。'}];equations=[`${a}*${b}=□`];diagram='area';faq=[['たてと横を足せば、面積？','足した数は1cm²の正方形の数ではないね。長さと面積は単位も違うよ。']];
    } else if(kind==='decimaladd'){
      names={a:'赤いリボン',b:'青いリボン',total:'合わせた長さ'};units={a:'m',b:'m',total:'m'};values={a,b,total:a+b};paramLabels=['赤いリボン（m）','青いリボン（m）'];op='+';
      story=[`赤いリボン ${say('a')}と、青いリボン ${say('b')}を つなぎます。`,`合わせた長さは ${say('total')}です。`];concept='小数でも、同じ種類の量を合わせるときは足せるよ。数の表し方が変わっても、合わせる関係は同じだね。';paths=[{id:'main',title:'同じ単位の長さを合わせる',expression:`${a}+${b}`,reason:'二つのリボンの長さを同じmの単位で合わせるから。'}];equations=[`${a}+${b}=□`];diagram='additive';faq=[['小数だから、特別な式が必要？','何を合わせるかは整数のときと同じだよ。計算するときは位をそろえよう。']];
    } else if(kind==='average'){
      names={a:'三日間の合計',b:'日数',c:'二日目',day1:'一日目',day3:'三日目',total:'一日当たりの平均'};units={a:'冊',b:'日',c:'冊',day1:'冊',day3:'冊',total:'冊/日'};values={a,b:3,c,day1:b,day3:a-b-c,total:a/3};paramLabels=['三日間の合計（冊）','一日目（冊）','二日目（冊）'];
      if(![a,b,c].every(Number.isInteger))throw Error('本の冊数は整数にしよう。');
      if(b+c>=a)throw Error('一日目と二日目の合計は、三日間の合計より小さくしよう。');
      story=[`本を、一日目に ${format(b)}冊、二日目に ${format(c)}冊、三日目に ${format(a-b-c)}冊 借りました。`,`一日当たりの平均は ${say('total')}です。`];concept='平均は、合計を同じ大きさにならして、一つ分を求める考え方だよ。';paths=[{id:'main',title:'合計を日数でならす',expression:`(${b}+${c}+${a-b-c})/3`,reason:'三日間の合計を3日で等しくならし、一日当たりを求めるから。'},{id:'sum-first',title:'合計から求める',expression:`${a}/3`,reason:'三日間の合計を、3日で割って一日当たりを求めるから。'}];equations=[`□*3=${a}`];diagram='average';faq=[['一番多い日の数が、平均？','平均は一番多い値ではないよ。すべてを合わせて、等しくならした値を考えよう。']];
    } else if(kind==='percent'||kind==='discount'){
      names={a:kind==='discount'?'定価':'もとにする量',b:kind==='discount'?'値引きの割合':'割合',total:kind==='discount'?'払う代金':'比べる量'};units={a:kind==='discount'?'円':'人',b:'%',total:kind==='discount'?'円':'人'};values={a,b,total:a*(kind==='discount'?1-b/100:b/100)};paramLabels=[kind==='discount'?'定価（円）':'もとにする量（人）','割合（%）'];
      if(b>=100)throw Error('割合は0より大きく、100より小さくしよう。');
      if(kind==='percent'&&(!Number.isInteger(a)||!near(values.total,Math.round(values.total))))throw Error('人数が整数になる全体と割合にしよう。');
      story=kind==='discount'?[`定価 ${say('a')}の品物が ${say('b')}引きです。`,`払う代金は ${say('total')}です。`]:[`全体は ${say('a')}で、その ${say('b')}が図書委員です。`,`図書委員は ${say('total')}です。`];
      concept='もとにする量を100%（1）と考えよう。割合・もとにする量・比べる量の、どれを聞いているかを確かめるよ。';
      const scaled=b/100;
      if(kind==='discount')paths=[{id:'remaining',title:'残る割合から',expression:`${a}*(1-${b}/100)`,reason:'定価を100%として、値引きの割合を引いた残りの割合をかけるから。'},{id:'subtract-discount',title:'値引き額を求めて引く',expression:`${a}-${a}*(${b}/100)`,reason:'値引きされる金額を求めて、定価から引くから。'}];
      else if(unknown==='total')paths=[{id:'main',title:'もと×割合で',expression:`${a}*(${b}/100)`,reason:'全体を1としたとき、その割合に当たる人数を求めるから。'},{id:'decimal',title:'割合を小数にして',expression:`${a}*${format(scaled)}`,reason:'百分率を100で割って小数にし、もとにする量にかけるから。'}];
      else if(unknown==='a')paths=[{id:'main',title:'もとにする量を逆に求める',expression:`${exprNumber(values.total)}/(${b}/100)`,reason:'もとにする量×割合＝比べる量の関係から、比べる量を割合で割るから。'}];
      else paths=[{id:'main',title:'割合を百分率で求める',expression:`${exprNumber(values.total)}/${a}*100`,reason:'比べる量をもとにする量で割り、100をかけて百分率にするから。'}];
      equations=kind==='discount'?[`${a}*(1-${b}/100)=□`]:[`${val('a')}*(${val('b')}/100)=${val('total')}`];diagram='percent';faq=[['「%」の数を、そのままかける？','20%は20倍ではなく、100分の20、つまり0.2だよ。まず割合の表し方をそろえよう。'],['「全体」なら、足す？','割合のお話では、もと×割合＝比べる量の関係だよ。加減のお話の全体・部分と同じ演算になるとは限らないね。']];
    } else if(kind==='ratio'){
      names={a:'赤の比',b:'白の比',c:'全部の数',total:'赤の数'};units={a:'',b:'',c:'こ',total:'こ'};values={a,b,c,total:c*a/(a+b)};paramLabels=['赤の比','白の比','全部の数'];
      if(![a,b,c].every(Number.isInteger)||!Number.isInteger(c/(a+b)))throw Error('比は整数で、全部の数は比の合計で割り切れる数にしよう。');
      if(a>12||b>12)throw Error('図で確かめられるよう、比の数は12までにしよう。');
      story=[`赤と白の玉の数の比は ${a}：${b}です。`,`全部で ${c}こあり、赤の数は ${say('total')}です。`];concept='比の数を、そのまま個数と思わず、一つ分のまとまりと考えよう。比の合計から、一つ分を求められるよ。';paths=[{id:'one-part',title:'比の一つ分から',expression:`${c}/(${a}+${b})*${a}`,reason:'全部を比の合計で割って一つ分を求め、赤の比の分だけ取るから。'},{id:'fraction',title:'全体に対する割合から',expression:`${c}*(${a}/(${a}+${b}))`,reason:'赤の全体に対する割合は、赤の比÷比の合計なので、その割合を全部にかけるから。'}];equations=[`□+□/${a}*${b}=${c}`];diagram='ratio';faq=[['2：3なら、赤は2こ？','2と3は比のまとまりを表す数だよ。実際の個数は、全部の数と比の関係から求めるよ。']];
    } else throw Error('お話の型を確認しよう。');
    if(!Object.hasOwn(values,unknown))throw Error('聞きたい量を確認しよう。');
    // These composite templates currently ask only for their final quantity.
    if(['compound','area','decimaladd','average','discount','ratio','fractiondiv'].includes(kind)&&unknown!=='total')throw Error('この型では最後の量を聞こう。');
    const m={...data,stage:data.stage??2,params:p,paramLabels,names,values,unknown,unit:units[unknown],story,question:`${names[unknown]}は いくつでしょう。`,concept,paths,equations,relation:equations[0],diagram,faq};
    m.quantities=Object.entries(values).map(([id,value])=>({id,label:names[id],value,unit:units[id],display:fractional?fraction(value):format(value),derived:kind==='average'&&id==='a'}));
    m.value=id=>id===unknown?'□':format(values[id]);m.expression=paths[0].expression;m.reason=paths[0].reason;m[unknown]=values[unknown];
    if(kind==='average')m.relation=`□*3=${b}+${c}+${a-b-c}`;
    if(kind==='compound'&&data.stage===2)m.relation='一人分のカード × 人数 ＝ 全部のカード';
    return finish(m);
  }
  function finish(m){
    m.answer=m.quantities.find(q=>q.id===m.unknown).value;
    m.known=m.quantities.filter(q=>q.id!==m.unknown).map(q=>q.id);
    m.paths=m.paths.map(p=>({...p,ast:parse(p.expression)}));
    m.reasonOptions=m.paths.map(p=>({id:p.id,text:p.reason,correct:true}));
    if(m.stage>0&&base.kinds.includes(m.kind))m.reasonOptions.push({id:'relation',text:(m.kind==='decrease'||m.kind==='compare')?`${m.names.total}から${m.names.a}をひくと${m.names.b}になる。その関係から、聞かれた数を求めるから。`:`${m.names.a}と${m.names.b}を合わせると${m.names.total}になる。その関係から、聞かれた数を求めるから。`,correct:true});
    m.reasonOptions.push({id:'keyword',text:'お話の言葉だけで、使う計算を決めたから。',correct:false},{id:'numbers',text:'出てきた数を、順番どおりに計算すればよいから。',correct:false});
    m.reasonOptions=m.reasonOptions.filter((p,i,a)=>a.findIndex(x=>x.text===p.text)===i);
    return m;
  }
  function checkExpression(input,m){
    if(base.kinds.includes(m.kind))return base.checkExpression(input,m);
    try{
      const s=normalize(input),parts=s.split('=');if(parts.length>2||parts.some(x=>!x))return{ok:false,code:'format'};
      const trees=parts.map(parse);
      if(parts.length===1){const path=m.paths.find(p=>match(trees[0],p.ast));return{ok:!!path,code:path?'compute':'relation',pathId:path?.id};}
      if(!near(evaluate(trees[0],m.answer),evaluate(trees[1],m.answer)))return{ok:false,code:'calculation'};
      const isAnswer=t=>t.type==='box'||(t.type==='num'&&near(t.value,m.answer))||(['num','/'].includes(t.type)&&near(evaluate(t),m.answer));
      for(let i=0;i<2;i++)if(isAnswer(trees[1-i])){const path=m.paths.find(p=>match(trees[i],p.ast));if(path)return{ok:true,code:s.includes('□')?'relation-equation':'verified-equation',pathId:path.id};}
      for(const equation of m.equations){const e=normalize(equation).split('=').map(parse);if((match(trees[0],e[0])&&match(trees[1],e[1]))||(match(trees[0],e[1])&&match(trees[1],e[0])))return{ok:true,code:'relation-equation'};}
      return{ok:false,code:'relation'};
    }catch(_){return{ok:false,code:'format'};}
  }
  function checkAnswer(input,m){try{const s=normalize(input);if(!/^(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(s))return false;return near(evaluate(parse(s)),m.answer);}catch(_){return false;}}
  function checkWork(input,m){
    const lines=String(input).split(/[\n;；]+/).map(s=>s.trim()).filter(Boolean);
    if(lines.length===1)return checkExpression(lines[0],m);
    if(!lines.length||lines.length>8)return{ok:false,code:'format'};
    try{
      const history=[];
      const expand=t=>{if(t.type==='num'){const item=[...history].reverse().find(h=>near(h.value,t.value));return item?item.tree:t;}if(t.type==='box')return t;return{...t,left:expand(t.left),right:expand(t.right)};};
      function contains(tree,step){return match(step,tree)||(tree.left&&(contains(tree.left,step)||contains(tree.right,step)));}
      for(let i=0;i<lines.length-1;i++){
        const pair=normalize(lines[i]).split('=');if(pair.length!==2)return{ok:false,code:'format'};
        const left=parse(pair[0]),right=parse(pair[1]);
        if(right.type!=='num'||!near(evaluate(left),evaluate(right)))return{ok:false,code:'calculation'};
        const expanded=expand(left);if(!m.paths.some(p=>contains(p.ast,expanded)))return{ok:false,code:'relation'};
        history.push({value:evaluate(right),tree:expanded});
      }
      const direct=checkExpression(lines[lines.length-1],m);if(direct.ok)return direct;
      const pair=normalize(lines[lines.length-1]).split('=');if(pair.length>2)return{ok:false,code:'format'};
      const t=expand(parse(pair[0]));const path=m.paths.find(p=>match(t,p.ast));
      if(!path)return{ok:false,code:'relation'};
      if(pair.length===2&&!near(evaluate(parse(pair[1]),m.answer),m.answer))return{ok:false,code:'calculation'};
      return{ok:true,code:'compute',pathId:path.id};
    }catch(_){return{ok:false,code:'format'};}
  }
  const lessons=base.lessons.map(l=>({...l}));
  function add(stage,id,title,kind,params,unknown='total'){lessons.push({stage,id,title,kind,params,unknown});}
  add(1,'same-groups','同じ数ずつの お皿','groups',[3,4]);
  add(1,'groups-repeat','同じ数を 足すと？','groups',[2,5]);
  add(1,'integer-times','何倍の 長さ？','times',[4,3]);
  add(2,'equal-share','一人分は いくつ？','groups',[4,3],'a');
  add(2,'how-many-groups','何皿に 分けられる？','groups',[3,4],'b');
  add(2,'times-unknown','何倍に なっている？','times',[5,3],'b');
  add(2,'times-base','もとの長さは？','times',[4,3],'a');
  add(2,'two-step','先に一人分を 求めよう','compound',[2,3,4]);
  add(2,'decimal-length','小数の長さを 合わせる','decimaladd',[1.2,0.5]);
  add(3,'two-paths','二つの道筋を 一つの式に','compound',[3,2,6]);
  add(3,'rectangle-area','1cm²が いくつ分？','area',[6,4]);
  add(3,'decimal-integer','小数でも 同じ一つ分','lengthgroups',[2.5,4]);
  add(3,'decimal-times','差と倍は どうちがう？','times',[8,3]);
  add(3,'decimal-ratio','小数で 何倍？','decimalmul',[8,1.5],'b');
  add(4,'small-multiplier','1より小さい 倍','decimalmul',[8,0.5]);
  add(4,'decimal-price','1mの代金と 小数の長さ','unitprice',[120,1.5]);
  add(4,'unit-price-unknown','1m当たりは いくら？','unitprice',[120,1.5],'a');
  add(4,'percentage-part','20%に当たる 人数','percent',[200,20]);
  add(4,'percentage-base','もとにする人数は？','percent',[200,20],'a');
  add(4,'percentage-rate','何%に 当たる？','percent',[200,20],'b');
  add(4,'discount','20%引きの 代金','discount',[500,20]);
  add(4,'average-books','一日当たりに ならす','average',[15,4,5]);
  add(4,'constant-speed','速さと時間から 道のり','speed',[4,1.5]);
  add(4,'speed-time','道のりから 時間','speed',[4,1.5],'b');
  add(5,'fraction-times','分数の倍でも 同じ関係','fractionmul',[0.75,2/3]);
  add(5,'fraction-base','分数の倍から もとを求める','fractionmul',[0.75,2/3],'a');
  add(5,'fraction-pieces','一本分が分数の リボン','fractiondiv',[0.75,0.125]);
  add(5,'ratio-parts','比の一つ分を 見つける','ratio',[2,3,25]);
  add(5,'ratio-other','全体に対する割合で 考える','ratio',[3,2,30]);
  add(5,'proportional-cost','冊数と代金の 比例','proportion',[80,3]);
  add(5,'proportional-count','比例の関係を 逆に使う','proportion',[80,3],'b');
  add(5,'inverse-workers','人数と時間の 反比例','inverse',[3,8],'b');
  lessons.sort((a,b)=>a.stage-b.stage);
  const api={...base,model,lessons,levels,normalize,parse,evaluate,format,fraction,near,checkExpression,checkAnswer,checkWork};
  if(typeof module!=='undefined')module.exports=api;
  root.WordProblemEngine=api;
})(typeof window==='undefined'?globalThis:window);

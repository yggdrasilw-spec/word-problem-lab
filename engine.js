(function (root) {
  'use strict';
  const roles = ['a', 'b', 'total'];
  const kinds = ['combine', 'increase', 'decrease', 'compare'];
  function model(data) {
    if (!kinds.includes(data.kind) || !roles.includes(data.unknown)) throw Error('お話と質問をえらんでね。');
    if (![data.a, data.b].every(n => Number.isInteger(n) && n >= 1 && n <= 50)) throw Error('数は1〜50にしてね。');
    const m = { ...data, total: data.a + data.b, unit: 'こ' };
    m.names = data.kind === 'combine' ? { a: '赤い花', b: '白い花', total: '花ぜんぶ' }
      : data.kind === 'increase' ? { a: 'はじめ', b: 'もらった', total: 'あと' }
        : data.kind === 'decrease' ? { a: '食べた', b: 'のこり', total: 'はじめ' }
          : { a: 'ゆいさん', b: 'ちがい', total: 'そうたさん' };
    if (data.kind === 'combine') m.unit = '本';
    const v = r => r === m.unknown ? '何' + m.unit + 'か' : m[r] + m.unit;
    m.story = data.kind === 'combine' ? [`赤い花が ${v('a')}、白い花が ${v('b')} あります。`]
      : data.kind === 'increase' ? [`あめが はじめに ${v('a')} ありました。`, `${v('b')} もらって、${v('total')}に なりました。`]
        : data.kind === 'decrease' ? [`あめが はじめに ${v('total')} ありました。`, `${v('a')} 食べて、${v('b')} のこりました。`]
          : [`ゆいさんは シールを ${v('a')}、そうたさんは ${v('total')} 持っています。`, `そうたさんのほうが ${v('b')} 多いです。`];
    m.question = data.kind === 'compare' && m.unknown === 'b' ? 'そうたさんのほうが 何こ 多いでしょう。' : `${m.names[m.unknown]}の数は 何${m.unit}でしょう。`;
    // Do not state the same unknown comparison twice.
    if (data.kind === 'compare' && m.unknown === 'b') m.story.pop();
    m.value = r => r === m.unknown ? '□' : String(m[r]);
    m.relation = data.kind === 'decrease' ? `${m.value('total')} − ${m.value('a')} ＝ ${m.value('b')}`
      : data.kind === 'compare' ? `${m.value('total')} − ${m.value('a')} ＝ ${m.value('b')}`
        : `${m.value('a')} ＋ ${m.value('b')} ＝ ${m.value('total')}`;
    m.known = roles.filter(r => r !== m.unknown);
    m.operation = m.unknown === 'total' ? 'join' : 'remove';
    m.operands = m.unknown === 'total' ? ['a', 'b'] : ['total', m.unknown === 'a' ? 'b' : 'a'];
    const [x, y] = m.operands;
    m.expression = `${m[x]} ${m.operation === 'join' ? '＋' : '−'} ${m[y]}`;
    m.reason = m.operation === 'join' ? `${m.names.a}と${m.names.b}を合わせると、${m.names.total}の数になるから。`
      : `${m.names.total}から${m.names[y]}をひくと、${m.names[m.unknown]}の数になるから。`;
    return m;
  }
  function normalize(s) {
    return String(s).normalize('NFKC').replace(/[\s　]/g, '').replace(/[−ー–]/g, '-').replace(/[?？]/g, '□');
  }
  function parse(s) {
    const match = normalize(s).match(/^(\d{1,3}|□)(?:([+-])(\d{1,3}|□))?$/);
    return match && { x: match[1], op: match[2] || '', y: match[3] || '' };
  }
  function value(t, m) { return t === '□' ? m[m.unknown] : Number(t); }
  function result(p, m) { return p.op === '+' ? value(p.x, m) + value(p.y, m) : p.op === '-' ? value(p.x, m) - value(p.y, m) : value(p.x, m); }
  function checkExpression(input, m) {
    const parts = normalize(input).split('=');
    if (parts.length > 2 || parts.some(s => !s)) return { ok: false, code: 'format' };
    const p = parts.map(parse);
    if (p.some(x => !x)) return { ok: false, code: 'format' };
    if (p.length === 1) {
      const t = p[0], [x, y] = m.operands;
      const good = t.op === (m.operation === 'join' ? '+' : '-') && t.x !== '□' && t.y !== '□'
        && ((Number(t.x) === m[x] && Number(t.y) === m[y]) || (m.operation === 'join' && Number(t.x) === m[y] && Number(t.y) === m[x]));
      return { ok: good, code: good ? 'compute' : 'relation' };
    }
    if (result(p[0], m) !== result(p[1], m)) return { ok: false, code: 'calculation' };
    // Both sides must express the three quantities, not an arbitrary equation with the same answer.
    const complex = p[0].op ? p[0] : p[1], single = p[0].op ? p[1] : p[0];
    if (!complex.op || single.op) return { ok: false, code: 'relation' };
    const tokens = [complex.x, complex.y, single.x];
    if (tokens.filter(t => t === '□').length > 1) return { ok: false, code: 'relation' };
    const [x, y, z] = tokens.map(t => value(t, m));
    const good = complex.op === '+' ? z === m.total && ((x === m.a && y === m.b) || (x === m.b && y === m.a))
      : x === m.total && ((y === m.a && z === m.b) || (y === m.b && z === m.a));
    // A □ replaces the target; non-unknown values must still be the two given quantities.
    return { ok: good, code: good ? (tokens.includes('□') ? 'relation-equation' : 'verified-equation') : 'relation' };
  }
  const lessons = [
    { id: 'flowers', title: '花を かざろう', stage: 0, kind: 'combine', a: 4, b: 3, unknown: 'total' },
    { id: 'candy-more', title: 'あめを もらったよ', stage: 0, kind: 'increase', a: 5, b: 3, unknown: 'total' },
    { id: 'candy-left', title: 'あめを 食べたよ', stage: 0, kind: 'decrease', a: 3, b: 5, unknown: 'b' },
    { id: 'stickers', title: 'シールを くらべよう', stage: 0, kind: 'compare', a: 5, b: 3, unknown: 'b' },
    { id: 'before-eating', title: '食べる前は？', stage: 1, kind: 'decrease', a: 3, b: 5, unknown: 'total' },
    { id: 'before-receiving', title: 'もらう前は？', stage: 1, kind: 'increase', a: 5, b: 3, unknown: 'a' },
    { id: 'received', title: 'もらった数は？', stage: 1, kind: 'increase', a: 5, b: 3, unknown: 'b' },
    { id: 'eaten', title: '食べた数は？', stage: 1, kind: 'decrease', a: 3, b: 5, unknown: 'a' },
    { id: 'white', title: '白い花は？', stage: 1, kind: 'combine', a: 4, b: 3, unknown: 'b' },
    { id: 'red', title: '赤い花は？', stage: 1, kind: 'combine', a: 4, b: 3, unknown: 'a' },
    { id: 'more-stickers', title: 'そうたさんの数は？', stage: 1, kind: 'compare', a: 5, b: 3, unknown: 'total' },
    { id: 'fewer-stickers', title: 'ゆいさんの数は？', stage: 1, kind: 'compare', a: 5, b: 3, unknown: 'a' }
  ];
  const directUnknown = kind => (kind === 'combine' || kind === 'increase') ? 'total' : 'b';
  const learningStage = data => data.unknown === directUnknown(data.kind) ? 0 : 1;
  const api = { roles, kinds, model, lessons, normalize, checkExpression, directUnknown, learningStage };
  if (typeof module !== 'undefined') module.exports = api;
  root.WordProblemEngine = api;
})(typeof window === 'undefined' ? globalThis : window);

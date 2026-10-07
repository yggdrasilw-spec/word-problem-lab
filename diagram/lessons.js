window.TAPE_LESSONS=[
 {id:'combine-small',kind:'combine',title:'花を あわせて',left:8,right:7,unknown:'total',unit:'本',iconA:'🌺',iconB:'🌼',nameA:'赤い花',nameB:'白い花',story:['赤い花が 8本、白い花が 7本 あります。','ぜんぶで 何本 あるでしょうか。'],source:'2〜4'},
 {id:'combine-large',kind:'combine',title:'数が ふえたら？',left:38,right:17,unknown:'total',unit:'本',iconA:'🌺',iconB:'🌼',nameA:'赤い花',nameB:'白い花',story:['赤い花が 38本、白い花が 17本 あります。','ぜんぶで 何本 あるでしょうか。'],source:'5〜14'},
 {id:'increase-small',kind:'increase',title:'りんごを もらった',left:5,right:3,unknown:'total',unit:'こ',iconA:'🍎',iconB:'🍎',nameA:'はじめ',nameB:'もらった',story:['りんごが はじめに 5こ ありました。','3こ もらいました。','ぜんぶで 何こに なったでしょうか。']},
 {id:'decrease-small',kind:'decrease',title:'りんごを 食べた',left:3,right:5,unknown:'right',unit:'こ',iconA:'🍎',iconB:'🍎',nameA:'食べた',nameB:'のこり',story:['りんごが はじめに 8こ ありました。','3こ 食べました。','のこりは 何こでしょうか。']},
 {id:'compare-small',kind:'compare',title:'どちらが 何こ 多い？',left:5,right:3,unknown:'right',unit:'こ',iconA:'🍏',iconB:'🍎',nameA:'青いりんご',nameB:'赤いりんご',story:['赤いりんごが 8こ、青いりんごが 5こ あります。','赤いりんごは 青いりんごより 何こ 多いでしょうか。']},
 {id:'mikan',kind:'increase',title:'みかんを 買った',left:15,right:17,unknown:'right',unit:'こ',iconA:'🍊',iconB:'🍊',nameA:'はじめ',nameB:'買った',story:['みかんが はじめに 15こ ありました。','何こか 買って、ぜんぶで 32こに なりました。','買ったのは 何こでしょうか。'],source:'15'},
 {id:'juice',kind:'decrease',title:'ジュースを くばった',left:26,right:8,unknown:'total',unit:'本',iconA:'🧃',iconB:'🧃',nameA:'くばった',nameB:'のこり',story:['ジュースが はじめに 何本か ありました。','26本 くばったら、のこりは 8本でした。','はじめに 何本 あったでしょうか。'],source:'16'},
 {id:'classroom',kind:'increase',title:'教室に 子どもが 来た',left:15,right:8,unknown:'left',unit:'人',iconA:'🧒',iconB:'🧒',nameA:'はじめ',nameB:'来た',story:['教室に はじめに 何人か いました。','8人 来て、みんなで 23人に なりました。','はじめに 何人 いたでしょうか。'],source:'17・20'},
 {id:'ribbon',kind:'decrease',title:'リボンを つかった',left:7,right:5,unknown:'left',unit:'m',iconA:'🎀',iconB:'🎀',nameA:'つかった',nameB:'のこり',continuous:true,story:['リボンが はじめに 12m ありました。','何mか つかって、のこりは 5mです。','つかったのは 何mでしょうか。'],source:'18'},
 {id:'go-home',kind:'decrease',title:'子どもが 帰った',left:18,right:12,unknown:'left',unit:'人',iconA:'🧒',iconB:'🧒',nameA:'帰った',nameB:'のこり',story:['はじめに 子どもが 30人 いました。','何人か 帰って、のこりは 12人です。','帰ったのは 何人でしょうか。'],source:'19'},
 {id:'strawberry',kind:'increase',title:'いちごを 買った',left:28,right:22,unknown:'right',unit:'こ',iconA:'🍓',iconB:'🍓',nameA:'はじめ',nameB:'買った',story:['いちごが はじめに 28こ ありました。','何こか 買って、ぜんぶで 50こに なりました。','買ったのは 何こでしょうか。'],source:'21'},
 {id:'flowers-given',kind:'decrease',title:'花を くばった',left:15,right:9,unknown:'total',unit:'本',iconA:'🌼',iconB:'🌼',nameA:'くばった',nameB:'のこり',story:['花が はじめに 何本か ありました。','15本 くばったら、のこりは 9本です。','はじめに 何本 あったでしょうか。'],source:'22'}
];
window.TAPE_LESSONS.filter(l=>l.id.startsWith('combine-')).forEach(l=>{l.imageA='assets/red-flower.png';l.imageB='assets/white-flower.png';});

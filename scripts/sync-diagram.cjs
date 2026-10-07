// Import the standalone teaching module; do not edit diagram/ directly.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const source=path.resolve(process.argv[2]||'../tape-diagram');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'diagram');
const files=['index.html','style.css','engine.js','lessons.js','app.js','intro.js','extension-engine.js','extension.js','workshop-engine.js','workshop.js','integration.js','groups.html','groups.js','assets/red-flower.png','assets/white-flower.png'];
const revision=cp.execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(const file of files){const target=path.join(destination,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(source,'app',file),target);}
fs.writeFileSync(path.join(destination,'SOURCE.json'),JSON.stringify({repository:'https://github.com/yggdrasilw-spec/tape-diagram',revision,contract:'diagram-bridge-v1'},null,2)+'\n');
console.log('Imported diagram module: '+revision);

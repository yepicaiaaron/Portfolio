import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'sharp');
const out='dist/assets/optimised';
const html=await(await fetch('https://www.yepic.ai/')).text();
const names=['Chicago Transit Authority','Acronis','Concentrix','Roche','LEAP','GAIN','COMEX','Deriv','Lumen5','GymNation','XRSpace','Seniorly'];
const assets=names.map((name,i)=>{const tag=[...html.matchAll(/<img[^>]+>/g)].map(m=>m[0]).find(t=>t.includes(`alt="${name}"`));if(!tag)throw new Error('Logo missing: '+name);return {name,url:tag.match(/src="([^"]+)"/)[1],file:`yepic-client-${i}.webp`,source:'https://www.yepic.ai/',relationship:'Projects led and delivered by Aaron Jones as Yepic founder and CEO, confirmed directly by Aaron on 11 September 2026. Logo sourced from the Yepic website.'};});
assets.push({name:'StoryMachine casting study',url:'https://www.storymachine.ai/casting/mara-turnaround-v1.png',file:'storymachine-casting.webp',source:'https://www.storymachine.ai/'},{name:'StoryMachine visual direction',url:'https://www.storymachine.ai/projects/after-hours/frame-01.jpg',file:'storymachine-direction.webp',source:'https://www.storymachine.ai/'});
for(const a of assets){const res=await fetch(a.url);if(!res.ok)throw new Error(a.url+' '+res.status);await sharp(Buffer.from(await res.arrayBuffer())).resize({width:a.file.startsWith('yepic')?240:1000,withoutEnlargement:true}).webp({quality:80}).toFile(`${out}/${a.file}`);}
await fs.writeFile('feedback-assets.json',JSON.stringify(assets,null,2));
console.log('Downloaded and optimised '+assets.length+' source assets.');

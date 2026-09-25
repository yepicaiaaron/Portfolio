import fs from 'node:fs';
import {createHash} from 'node:crypto';
import './collection-data.mjs';
import './narrative-data.mjs';

const original=fs.readFileSync('original.html','utf8');
let head=original.split('  <!-- ============ SCREEN LOCK:')[0];
head=head.replace(/<title>[\s\S]*?<\/title>/,'<title>Aaron Jones — Building what comes next</title>');
head=head.replace('Aaron Jones BEM is a creative technologist, AI builder and storyteller who turns frontier research into products, experiences and movements.','Aaron Jones. Builder, technologist and strategist pioneering new ways to learn, connect and create. Projects, speaking and consulting.');
head=head.replace('Aaron Jones BEM | A storyteller who ships code','Aaron Jones — Building what comes next').replace('From real-time AI avatars and world models to live creative experiences and international hackathons. Research understood, code shipped, people brought with it.','From social enterprise and visual search to generative video, live AI experiences and world models.');
head=head.replace(/<link href="https:\/\/fonts.googleapis.com\/css2[^"]+" rel="stylesheet">/,'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">');
head=head.replace('css/style.css','css/base.css').replace('</head>','<link rel="stylesheet" href="css/pioneer.css"></head>');
head=head.replace('</head>','<link rel="preload" href="assets/fonts/homemade.woff2" as="font" type="font/woff2" crossorigin></head>');
head=head.replace('</head>','<link rel="stylesheet" href="css/feedback.css"></head>');
head=head.replaceAll('#mind-os','#work').replaceAll('#server-room','#frontier').replaceAll('#about','#contact');
head=head.replace('menu ↓','Explore the story ↓').replace('href="#contact">Explore the story','href="#work">Explore the story');
head=head.replace('I carry difficult ideas','Before anything, I’m a builder.').replace('all the way <em>through.</em>','I’ve spent my career building what comes next.');
head=head.replace('aria-label="creative technologist">creative technologist','aria-label="Builder, Creative Technologist, Speaker">Builder | Creative Technologist | Speaker');
const story=fs.readFileSync('story.html','utf8');
const scripts=['media-assets','media-runtime','pioneer-intro','pioneer-morph','digit-hero','opening','collection-data','narrative','story-motion','project-reader','booking'];
// Keep originals for re-encoding; only compact, demand-loaded variants reach the page.
head=head.replace('muted autoplay loop playsinline preload="auto"','muted loop playsinline preload="none" data-src="assets/optimised/audience-desktop.mp4" data-mobile-src="assets/optimised/audience-mobile.mp4"');
head=head.replace('muted playsinline preload="auto"','muted playsinline preload="none" data-src="assets/optimised/turn-desktop.mp4" data-mobile-src="assets/optimised/turn-mobile.mp4"');
head=head.replace(/\s*<source src="assets\/aaron-(?:room|pan-to-screen)\.mp4" type="video\/mp4">/g,'');
head=head.replace(/(<img id="hero-image" src=")[^"]+/, '$1assets/aaron-room-poster.jpg');
const assetMap=JSON.parse(fs.readFileSync('dist/js/media-assets.js','utf8').split('=')[1].replace(/;\s*$/,''));
for(const [oldPath,newPath] of Object.entries(assetMap))head=head.replaceAll(oldPath,newPath);
// Keep only the original camera/hero styling. Old page selectors (including
// #contact) must not override the new narrative's typography and layout.
let base=fs.readFileSync('dist/css/original.css','utf8').split('/* ---------- Opening trailer:')[0].replaceAll(/^@font-face.*$/gm,'');
for(const [oldPath,newPath] of Object.entries(assetMap))base=base.replaceAll(oldPath,newPath);
fs.writeFileSync('dist/css/base.css',base);
let pioneer=fs.readFileSync('dist/css/pioneer.css','utf8');
for(const [oldPath,newPath] of Object.entries(assetMap))pioneer=pioneer.replaceAll("../"+oldPath,"../"+newPath);
fs.writeFileSync('dist/css/pioneer.css',pioneer);
fs.writeFileSync('dist/js/opening.js',fs.readFileSync('effects-original.js','utf8').split('  /* ---------- Opening trailer')[0]+'})();');
let html=head+story+scripts.map(name=>'<script src="js/'+name+'.js"></script>').join('')+'</body></html>';
html=html.replace(/(src|href)="((?:js|css)\/[^"?]+)"/g,(match,attr,path)=>{
 const digest=createHash('sha256').update(fs.readFileSync('dist/'+path)).digest('hex').slice(0,10);
 return attr+'="'+path+'?v='+digest+'"';
});
fs.writeFileSync('dist/index.html',html);
console.log('Pioneering narrative built. Original audience video and camera turn preserved.');

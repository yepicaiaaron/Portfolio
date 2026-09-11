import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('dist/js/collection-data.js','utf8'),context);
const records=context.window.portfolioCollection;
assert.equal(records.length,15);
assert.equal(new Set(records.map(r=>r.id)).size,15);
assert.equal(records.filter(r=>r.video).length,5);
for(const record of records){
 assert.ok(record.title&&record.category&&record.role&&record.body.length);
 assert.ok(!record.legacy,'Old case-study routing remains');
 if(record.video)assert.match(record.video,/^[A-Za-z0-9_-]{11}$/);
 for(const image of record.images||[]){
  assert.ok(image.alt);
  if(!image.src.startsWith('https://'))assert.ok(fs.existsSync('dist/'+image.src),image.src);
 }
}
const html=fs.readFileSync('dist/index.html','utf8');
assert.ok(html.indexOf('js/collection-data.js')<html.indexOf('js/narrative.js'));
assert.ok(html.indexOf('js/narrative.js')<html.indexOf('js/project-reader.js'));
assert.ok(html.includes('css/pioneer.css?v='));
const elements=[],stage={append(el){elements.push(el)}};
context.document={querySelector(){return stage},createElement(){return{dataset:{},setAttribute(){}}}};
vm.runInNewContext(fs.readFileSync('dist/js/narrative.js','utf8'),context);
assert.equal(elements.length,12);
assert.equal(new Set(elements.map(el=>el.id)).size,12);
for(const el of elements){
 for(const [,id] of el.innerHTML.matchAll(/data-project="([^"]+)"/g))assert(records.some(r=>r.id===id),'Missing project '+id);
 for(const [,src] of el.innerHTML.matchAll(/src="([^"]+)"/g))if(!src.startsWith('https://'))assert(fs.existsSync('dist/'+src),'Missing chapter image '+src);
 assert(!/<br>\S/.test(el.innerHTML),'Mobile line break removes word spacing');
}
assert(!elements[0].innerHTML.includes('I’ve spent my career'),'Cinema repeats the introduction');
assert(elements[0].innerHTML.includes('data-booking'));
assert(elements[0].innerHTML.includes('https://calendar.app.google/pZkjBD1BnG83RQxi7'));
console.log('15 complete project records, 5 video references, 12 connected chapters and all chapter links/assets passed.');

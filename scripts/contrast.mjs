const hex = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
const L = rgb => 0.2126*lin(rgb[0])+0.7152*lin(rgb[1])+0.0722*lin(rgb[2]);
const ratio = (a,b) => { const [x,y]=[L(a),L(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
const mix = (fg,bg,a) => fg.map((c,i)=>Math.round(a*c+(1-a)*bg[i]));
const toHex = r => '#'+r.map(c=>c.toString(16).padStart(2,'0').toUpperCase()).join('');

const ink=hex('#0C1033'), paper=hex('#F4F3EF'), signal=hex('#1E35F0');
console.log('ink   on paper :', ratio(ink,paper).toFixed(2));
console.log('signal on paper:', ratio(signal,paper).toFixed(2));
console.log('paper on ink   :', ratio(paper,ink).toFixed(2));
console.log('paper on signal:', ratio(paper,signal).toFixed(2));
console.log('');
console.log('pick solid tokens for secondary text (target >= 4.50 for small text):');
for (const a of [0.45,0.5,0.55,0.6,0.62,0.65,0.7,0.72,0.82]) {
  const m = mix(ink,paper,a);
  console.log(`  opacity ${a}  ->  ${toHex(m)}  ratio ${ratio(m,paper).toFixed(2)}  ${ratio(m,paper)>=4.5?'PASS':'fail'}`);
}
console.log('');
console.log('on the dark bar (paper text on ink), and bar__next at .7:');
for (const a of [0.7,0.75,0.8]) {
  const m = mix(paper,ink,a);
  console.log(`  opacity ${a}  ->  ${toHex(m)}  ratio ${ratio(m,ink).toFixed(2)}  ${ratio(m,ink)>=4.5?'PASS':'fail'}`);
}
console.log('');
console.log('bar on hover is signal; paper text on signal:', ratio(paper,signal).toFixed(2));
for (const a of [0.7,0.8]) {
  const m = mix(paper,signal,a);
  console.log(`  opacity ${a} on signal -> ${toHex(m)} ratio ${ratio(m,signal).toFixed(2)} ${ratio(m,signal)>=4.5?'PASS':'fail'}`);
}

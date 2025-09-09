(function(){
  const stage = document.querySelector('.stage');
  const envelope = document.getElementById('envelope');
  const particles = document.getElementById('particles');
  const waxSeal = document.getElementById('waxSeal'); // header seal
  const bow = document.getElementById('bow');
  const message = document.getElementById('message');
  const caret = document.getElementById('caret');
  const monoText = document.getElementById('monoText');
  const monoTextSmall = document.getElementById('monoTextSmall');
  const signatureBlock = document.getElementById('signatureBlock');
  const signatureName = document.getElementById('signatureName');

  // === CONFIG ===
  const MONOGRAM = 'Y ♥ S';   // غيّره مثلاً إلى 'ي ♥ ن'
  const SIGN_NAME = 'يونس كمال'; // غيّر اسم التوقيع
  if(monoText) monoText.textContent = MONOGRAM;
  if(monoTextSmall) monoTextSmall.textContent = MONOGRAM;
  if(signatureName) signatureName.textContent = SIGN_NAME;

  let clicks = 0;
  let sequenceStarted = false;

  const SPEED = 0.70;
  const t = (ms)=> Math.round(ms * SPEED);

  // Hearts
  function heartsBurst(count=9){
    const rect = envelope.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const h = document.createElement('span');
      h.className = 'heart';
      const x = rect.left + rect.width/2 + (Math.random()-0.5) * rect.width * 0.6;
      const y = rect.top + rect.height*0.55 + (Math.random()-0.5) * rect.height * 0.2;
      h.style.left = x+'px'; h.style.top = y+'px';
      const size = 14 + Math.random()*10; h.style.width = size+'px'; h.style.height = size+'px';
      particles.appendChild(h);
      const dx = (Math.random()-0.5) * 160;
      const dy = - (90 + Math.random() * 160);
      const dur = t(900 + Math.random()*900);
      h.animate([{ transform:'translate(0,0) rotate(-45deg)', opacity:0 },{ opacity:1, offset:.2 },{ transform:`translate(${dx}px, ${dy}px) rotate(-45deg)`, opacity:0 }], { duration: dur, easing:'cubic-bezier(.2,.7,.2,1)' }).onfinish = ()=> h.remove();
    }
  }
  function jitter(){ stage.classList.add('shake'); setTimeout(()=> stage.classList.remove('shake'), t(320)); }

  function untieBow(){ if(!bow || bow.classList.contains('untie')) return; bow.classList.add('untie'); setTimeout(()=> bow.remove(), t(700)); }

  // Sounds (simple)
  let audioCtx;
  function initAudio(){ if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } }
  function playSealCrack(){
    if(!audioCtx) return; const dur = 0.16; const sr = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, sr * dur, sr); const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){ const tt=i/sr; let v=0; if(i<360) v+=(Math.random()*2-1)*(1-i/360); if(i>1000&&i<1180) v+=(Math.random()*2-1)*(1-(i-1000)/180); v += (Math.random()*2-1)*Math.exp(-22*tt)*0.22; data[i]=v*0.9; }
    const src = audioCtx.createBufferSource(); src.buffer=buffer; const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1400; hp.Q.value=0.7; src.connect(hp).connect(audioCtx.destination); src.start();
  }
  function playPaperRustle(){
    if(!audioCtx) return; const dur=0.42; const sr=audioCtx.sampleRate; const buffer=audioCtx.createBuffer(1,sr*dur,sr); const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){ const tt=i/sr; const env = Math.exp(-7*tt) * (0.4 + 0.6*Math.max(0, Math.sin(36*tt))); data[i]=(Math.random()*2-1)*env*0.58; }
    const src=audioCtx.createBufferSource(); src.buffer=buffer; const bp=audioCtx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2000; bp.Q.value=0.9; src.connect(bp).connect(audioCtx.destination); src.start();
  }

  function breakSeal(){
    // optional visual if أردت لاحقًا
  }

  function openSequence(){
    if(sequenceStarted) return; sequenceStarted = true;
    initAudio(); playSealCrack(); breakSeal();
    setTimeout(()=>{
      document.body.classList.add('envelope-open');
      setTimeout(()=>{ playPaperRustle(); }, t(220));
      setTimeout(()=>{
        document.body.classList.add('envelope-retreat');
        setTimeout(()=>{ startWriting(); }, t(700));
      }, t(700));
    }, t(180));
  }

  // === Full page handwriting ===
  const content = message?.dataset?.content || '';
  let idx = 0;
  function placeCaret(){
    const range = document.createRange();
    const sel = window.getSelection();
    const last = message.lastChild;
    if(last && last.nodeType === Node.TEXT_NODE){
      range.setStart(last, last.textContent.length);
    }else{
      range.selectNodeContents(message);
      range.collapse(false);
    }
    const rects = range.getClientRects();
    let rect;
    if(rects.length){
      rect = rects[rects.length-1];
    }else{
      const mrect = message.getBoundingClientRect();
      rect = {left:mrect.left+8, top:mrect.top+8, height:18};
    }
    const parentRect = message.closest('.paper-inner').getBoundingClientRect();
    caret.style.left = (rect.left - parentRect.left) + 'px';
    caret.style.top  = (rect.top - parentRect.top) + 'px';
    caret.style.opacity = 1;
  }
  function writeStep(){
    if(idx >= content.length){
      caret.style.opacity = 0;
      // Show bottom signature + seal
      setTimeout(()=>{ signatureBlock.classList.add('show'); }, t(600));
      return;
    }
    const ch = content[idx++];
    // Switch dir automatically
    if(/[\u0600-\u06FF]/.test(ch)){ message.setAttribute('dir','rtl'); }
    else if(/[A-Za-z]/.test(ch)){ message.setAttribute('dir','ltr'); }
    message.append(document.createTextNode(ch));
    placeCaret();
    const container = document.querySelector('.paper-inner');
    container.scrollTop = container.scrollHeight;
    const base = 40;
    const slowChars = '،.،.?!…—- ';
    const delay = slowChars.includes(ch) ? base*2.4 : base * (0.8 + Math.random()*0.6);
    setTimeout(writeStep, t(delay));
  }
  function startWriting(){
    message.textContent=''; idx=0; caret.style.opacity = 1; writeStep();
  }

  // Click logic
  envelope.addEventListener('click', ()=>{
    if(sequenceStarted) return; initAudio();
    clicks++;
    if(clicks === 1){ jitter(); heartsBurst(9); }
    else if(clicks === 2){ jitter(); heartsBurst(12); untieBow(); }
    else if(clicks >= 3){ heartsBurst(16); openSequence(); }
  });

  // Expand tap area near envelope
  document.addEventListener('click', (e)=>{
    if(sequenceStarted) return;
    if(e.target.closest && e.target.closest('#envelope')) return;
    const rect = envelope.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    if(x > rect.left-12 && x < rect.right+12 && y > rect.top-12 && y < rect.bottom+12){
      envelope.click();
    }
  }, {passive:true});

  envelope.addEventListener('touchstart', ()=>{}, {passive:true});
})();
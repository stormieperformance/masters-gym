const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>60));
const hamburger=document.getElementById('hamburger');
const mobileMenu=document.getElementById('mobile-menu');
function closeMobile(){hamburger.classList.remove('open');mobileMenu.classList.remove('active');document.body.style.overflow='';}
hamburger.addEventListener('click',()=>{hamburger.classList.toggle('open');mobileMenu.classList.toggle('active');document.body.style.overflow=mobileMenu.classList.contains('active')?'hidden':''});
document.getElementById('mobile-close').addEventListener('click',closeMobile);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileMenu.classList.contains('active'))closeMobile();});
document.querySelectorAll('.mobile-link').forEach(l=>l.addEventListener('click',e=>{
  const href=l.getAttribute('href');
  const isSamePageAnchor=!!href&&href.charAt(0)==='#';
  const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce){closeMobile();if(!isSamePageAnchor&&href){location.href=href;}return;}
  e.preventDefault();
  document.querySelectorAll('.mobile-link.is-tapped').forEach(x=>x.classList.remove('is-tapped'));
  l.classList.add('is-tapped');
  setTimeout(()=>{closeMobile();l.classList.remove('is-tapped');if(href){if(isSamePageAnchor){location.hash=href;}else{location.href=href;}}},240);
}));
const modal=document.getElementById('modal');
let lastFocusedBeforeModal=null;
function openModal(){
  lastFocusedBeforeModal=document.activeElement;
  modal.classList.add('active');document.body.style.overflow='hidden';
  const firstField=modal.querySelector('input,select,button');
  if(firstField)firstField.focus();
}
function closeModal(){
  modal.classList.remove('active');document.body.style.overflow='';
  if(lastFocusedBeforeModal&&lastFocusedBeforeModal.focus)lastFocusedBeforeModal.focus();
}
document.querySelectorAll('.finder-btn-route').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const route=btn.dataset.route;
    if(!route)return;
    if(route.charAt(0)==='#'){
      const target=document.getElementById(route.slice(1));
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    }else{
      location.href=route;
    }
  });
});

document.querySelectorAll('.finder-btn:not(.finder-btn-route)').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.finder-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const classIndex=btn.dataset.classIndex;
    if(classIndex!==undefined&&classIndex!==''){
      const item=document.getElementById('tl-'+classIndex);
      if(item){
        item.scrollIntoView({behavior:'smooth',block:'center'});
        const card=item.querySelector('.timeline-card')||item;
        card.classList.add('timeline-highlight');
        setTimeout(()=>{card.classList.remove('timeline-highlight');},1600);
      }
    }
  });
});
document.querySelectorAll('.open-modal').forEach(b=>b.addEventListener('click',openModal));

// ── GYMBOT: sticky quick-help widget ──
// Set to true and add schedule-fallback.jpg (or .pdf, adjust the src below) to show
// a manually-updated schedule image/PDF instead of the live calendar feed —
// useful if the GymControl/ICS feed ever breaks or needs a temporary override.
const SCHEDULE_FALLBACK_ACTIVE=false;
const SCHEDULE_FALLBACK_SRC='schedule-fallback.jpg';

try{(function(){
  const root=document.getElementById('gymbot');
  const toggle=document.getElementById('gymbotToggle');
  const closeBtn=document.getElementById('gymbotClose');
  const panel=document.getElementById('gymbotPanel');
  const body=document.getElementById('gymbotBody');
  const greeting=document.getElementById('gymbotGreeting');
  if(!root||!toggle||!panel||!body)return;

  function lang(){return document.documentElement.getAttribute('lang')==='en'?'en':'sv';}

  const COPY={
    sv:{
      menu:[
        {key:'trial',label:'Boka provpass'},
        {key:'offers',label:'Erbjudanden'},
        {key:'pricing',label:'Priser och medlemskap'},
        {key:'schedule',label:'Schema'},
        {key:'question',label:'Övrig fråga'},
        {key:'lang',label:'🇬🇧 Switch to English'}
      ],
      greeting:'Snabbhjälp',
      back:'Gå tillbaks',
      offers_title:'Gratis provträning',
      offers_intro:'Under vecka 34 och 35 tränar du gratis hos oss.',
      offers_list:[
        'Vuxna — mån 12.00, 17.00, 19.20',
        'Vuxna — tis kl. 17.40',
        'Vuxna — ons 12.00, 19.20',
        'Vuxna — fre 12.00, 18.00',
        'Vuxna — sön 11.00, 13.00',
        'Juniorer (v.35) — tis & tors 16.40',
        'Barn (v.34) — ons & fre 17.00'
      ],
      offers_note:'Boka din plats: skicka SMS till 070-942 72 80 med namn och ålder.',
      offers_cta:'SMS:a oss',
      contact_cta:'Kontakta oss',
      pricing_title:'Priser och medlemskap',
      pricing_plans:[
        {name:'Autogiro 12 mån',price:'649 kr / mån',note:'Bäst värde · 12 mån bindning'},
        {name:'Autogiro 6 mån',price:'699 kr / mån',note:'Flexibelt · 6 mån bindning'},
        {name:'Junior 13–17 år',price:'599 kr / mån',note:'Rabatterat för ungdomar'}
      ],
      pricing_cta:'Bli medlem →',
      question_title:'Övrig fråga',
      question_intro:'Hittade du inte svaret du sökte? Skicka din fråga direkt så återkommer vi.',
      question_name:'Ditt namn',
      question_email:'E-postadress',
      question_msg:'Din fråga',
      question_submit:'Skicka fråga',
      question_sending:'Skickar...',
      question_sent:'Skickat! Vi hör av oss snart.',
      question_error:'Något gick fel. Försök igen eller maila oss direkt.',
      question_unset:'Formuläret är inte klart ännu. Maila oss direkt.',
      schedule_title:'Schema',
      schedule_text:'Se hela veckoschemat, eller prenumerera på det så uppdateras det automatiskt i din kalender.',
      schedule_cta:'Se schemat',
      schedule_note:'Schemat visas tillfälligt som bild — kontakta oss om något inte stämmer.',
      class_one:'pass',
      class_many:'pass',
      today_label:'Idag',
      today_none:'Inga fler pass idag',
      upcoming_label:'Nästa pass',
      day_short:{'Måndag':'MÅN','Tisdag':'TIS','Onsdag':'ONS','Torsdag':'TOR','Fredag':'FRE','Lördag':'LÖR','Söndag':'SÖN'}
    },
    en:{
      menu:[
        {key:'trial',label:'Book trial class'},
        {key:'offers',label:'Offers'},
        {key:'pricing',label:'Pricing & memberships'},
        {key:'schedule',label:'Schedule'},
        {key:'question',label:'Other question'},
        {key:'lang',label:'🇸🇪 Byt till svenska'}
      ],
      greeting:'Quick help',
      back:'Go back',
      offers_title:'Free trial week',
      offers_intro:'During weeks 34 and 35 you can train with us for free.',
      offers_list:[
        'Adults — Mon 12:00, 17:00, 19:20',
        'Adults — Tue 17:40',
        'Adults — Wed 12:00, 19:20',
        'Adults — Fri 12:00, 18:00',
        'Adults — Sun 11:00, 13:00',
        'Juniors (wk 35) — Tue & Thu 16:40',
        'Kids (wk 34) — Wed & Fri 17:00'
      ],
      offers_note:'To book your spot, text 070-942 72 80 with your name and age.',
      offers_cta:'Text us',
      contact_cta:'Contact us',
      pricing_title:'Pricing & memberships',
      pricing_plans:[
        {name:'Direct debit 12 mo',price:'649 SEK / mo',note:'Best value · 12-month commitment'},
        {name:'Direct debit 6 mo',price:'699 SEK / mo',note:'Flexible · 6-month commitment'},
        {name:'Junior 13–17 yrs',price:'599 SEK / mo',note:'Discounted for young athletes'}
      ],
      pricing_cta:'Join now →',
      question_title:'Other question',
      question_intro:"Couldn't find what you were looking for? Send your question directly and we'll get back to you.",
      question_name:'Your name',
      question_email:'Email address',
      question_msg:'Your question',
      question_submit:'Send question',
      question_sending:'Sending...',
      question_sent:"Sent! We'll be in touch soon.",
      question_error:'Something went wrong. Try again or email us directly.',
      question_unset:'The form is not set up yet. Please email us directly.',
      schedule_title:'Schedule',
      schedule_text:'See the full weekly schedule, or subscribe so it updates automatically in your calendar.',
      schedule_cta:'View schedule',
      schedule_note:'The schedule is temporarily shown as an image — contact us if anything looks off.',
      class_one:'class',
      class_many:'classes',
      today_label:'Today',
      today_none:'No more classes today',
      upcoming_label:'Coming up',
      day_short:{'Måndag':'MON','Tisdag':'TUE','Onsdag':'WED','Torsdag':'THU','Fredag':'FRI','Lördag':'SAT','Söndag':'SUN'}
    }
  };

  function renderMenu(){
    const t=COPY[lang()];
    if(greeting)greeting.textContent=t.greeting;
    body.innerHTML='<div class="gymbot-menu"></div>';
    const menu=body.querySelector('.gymbot-menu');
    t.menu.forEach(item=>{
      const btn=document.createElement('button');
      btn.type='button';btn.className='gymbot-pill';btn.textContent=item.label;
      btn.addEventListener('click',()=>{
        if(item.key==='trial'){ closePanel(); openModal(); return; }
        if(item.key==='lang'){
          if(typeof toggleLang==='function')toggleLang();
          if(typeof syncLangToggle==='function')syncLangToggle();
          renderMenu();
          return;
        }
        renderScreen(item.key);
      });
      menu.appendChild(btn);
    });
  }

  function backBtn(){
    const t=COPY[lang()];
    const b=document.createElement('button');
    b.type='button';b.className='gymbot-back';
    b.innerHTML='&larr; '+t.back;
    b.addEventListener('click',renderMenu);
    return b;
  }

  function closePanel(){root.classList.remove('open');toggle.setAttribute('aria-expanded','false');}

  function renderScreen(key){
    const t=COPY[lang()];
    body.innerHTML='';
    body.appendChild(backBtn());

    if(key==='offers'){
      const listHtml=t.offers_list.map(line=>'<li>'+line+'</li>').join('');
      body.insertAdjacentHTML('beforeend','<div class="gymbot-screen-title">'+t.offers_title+'</div><p class="gymbot-screen-text">'+t.offers_intro+'</p><ul class="gymbot-offer-list">'+listHtml+'</ul><p class="gymbot-screen-text">'+t.offers_note+'</p><div class="gymbot-screen-actions"><a href="sms:0709427280" class="gymbot-cta">'+t.offers_cta+'</a></div>');
      body.querySelector('.gymbot-cta').addEventListener('click',closePanel);
    }
    else if(key==='pricing'){
      const gcUrl='https://www.gymcontrol.se/global/webshop/index.php?uid=9074&action=membership';
      const cardsHtml=t.pricing_plans.map(p=>'<a href="'+gcUrl+'" target="_blank" rel="noopener noreferrer" class="gymbot-plan-row"><div><span class="gymbot-plan-name">'+p.name+'</span><span class="gymbot-plan-note">'+p.note+'</span></div><span class="gymbot-plan-price">'+p.price+'</span></a>').join('');
      body.insertAdjacentHTML('beforeend','<div class="gymbot-screen-title">'+t.pricing_title+'</div><div class="gymbot-plan-list">'+cardsHtml+'</div><div class="gymbot-screen-actions"><a href="'+gcUrl+'" target="_blank" rel="noopener noreferrer" class="gymbot-cta">'+t.pricing_cta+'</a></div>');
      body.querySelectorAll('.gymbot-plan-row,.gymbot-cta').forEach(el=>el.addEventListener('click',closePanel));
    }
    else if(key==='question'){
      body.insertAdjacentHTML('beforeend','<div class="gymbot-screen-title">'+t.question_title+'</div><p class="gymbot-screen-text">'+t.question_intro+'</p><form class="gymbot-question-form" id="gymbotQuestionForm"><input type="text" name="namn" placeholder="'+t.question_name+'" required><input type="email" name="email" placeholder="'+t.question_email+'" required><textarea name="meddelande" placeholder="'+t.question_msg+'" rows="3" required></textarea><button type="submit" class="gymbot-cta">'+t.question_submit+'</button></form>');
      const form=body.querySelector('#gymbotQuestionForm');
      const btn=form.querySelector('button[type="submit"]');
      form.addEventListener('submit',function(e){
        e.preventDefault();
        if(typeof FORMSPREE_ENDPOINT==='undefined'||!FORMSPREE_ENDPOINT){
          btn.textContent=t.question_unset;
          return;
        }
        btn.textContent=t.question_sending;btn.disabled=true;
        fetch(FORMSPREE_ENDPOINT,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}})
        .then(res=>{
          if(!res.ok)throw new Error('bad response');
          btn.textContent=t.question_sent;
          setTimeout(closePanel,2000);
        })
        .catch(()=>{
          btn.textContent=t.question_error;btn.disabled=false;
        });
      });
    }
    else if(key==='schedule'){
      if(SCHEDULE_FALLBACK_ACTIVE){
        body.insertAdjacentHTML('beforeend','<div class="gymbot-screen-title">'+t.schedule_title+'</div><img class="gymbot-schedule-img" src="'+SCHEDULE_FALLBACK_SRC+'" alt="'+t.schedule_title+'"><p class="gymbot-screen-text">'+t.schedule_note+'</p><div class="gymbot-screen-actions"><a href="index.html#contact" class="gymbot-ghost">'+t.contact_cta+'</a></div>');
        body.querySelector('.gymbot-ghost').addEventListener('click',closePanel);
      }else{
        let previewHtml='';
        if(typeof scheduleData!=='undefined'&&scheduleData.days&&scheduleData.days.length){
          const dagOrderLocal=['Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag','Söndag'];
          const jsDay=new Date().getDay();
          const todayIdx=jsDay===0?6:jsDay-1;
          const now=new Date();
          const nowStr=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');

          const upcoming=[];
          for(let offset=0;offset<7&&upcoming.length<3;offset++){
            const dayIdx=(todayIdx+offset)%7;
            const dayName=dagOrderLocal[dayIdx];
            const rows=(scheduleData.byDay[dayName]||[]).filter(r=>!isCancelled(r)).slice().sort((a,b)=>(a.Tid||'').localeCompare(b.Tid||''));
            rows.forEach(r=>{
              if(upcoming.length>=3)return;
              if(offset===0&&(r.Tid||'')<nowStr)return;
              upcoming.push({day:dayName,offset,row:r});
            });
          }

          if(upcoming.length){
            const rowsHtml=upcoming.map(u=>{
              const pl=splitPassLevel(u.row['Nivå']||u.row['Niv\u00e5']||'');
              const dayLabel=u.offset===0?t.today_label:(t.day_short[u.day]||u.day.slice(0,3).toUpperCase());
              return '<div class="gymbot-upcoming-row"><div class="gymbot-upcoming-time"><span class="gymbot-upcoming-day">'+dayLabel+'</span><span class="gymbot-upcoming-clock">'+esc(u.row.Tid||'')+'</span></div><span class="gymbot-upcoming-name">'+esc(pl.name||u.row.Pass||'')+'</span></div>';
            }).join('');
            previewHtml='<span class="gymbot-upcoming-label">'+t.upcoming_label+'</span><div class="gymbot-upcoming-list">'+rowsHtml+'</div>';
          }else{
            previewHtml='<div class="gymbot-today-card"><span class="gymbot-today-label">'+t.today_label+'</span><div class="gymbot-today-next"><span class="gymbot-today-next-name">'+t.today_none+'</span></div></div>';
          }
        }
        body.insertAdjacentHTML('beforeend','<div class="gymbot-screen-title">'+t.schedule_title+'</div>'+previewHtml+'<div class="gymbot-screen-actions"><a href="schema.html" class="gymbot-cta">'+t.schedule_cta+'</a></div>');
        body.querySelector('.gymbot-cta').addEventListener('click',closePanel);
      }
    }
  }

  toggle.addEventListener('click',()=>{
    toggle.classList.remove('popped');
    const bubbleEl=document.getElementById('gymbotBubble');
    if(bubbleEl)bubbleEl.classList.remove('visible');
    const isOpen=root.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(isOpen));
    if(isOpen)renderMenu();
  });
  if(closeBtn)closeBtn.addEventListener('click',closePanel);
  document.addEventListener('click',e=>{
    if(!root.classList.contains('open'))return;
    const path=typeof e.composedPath==='function'?e.composedPath():[];
    if(path.includes(root))return;
    closePanel();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&root.classList.contains('open'))closePanel();
  });

  const langToggle=document.getElementById('gymbotLangToggle');
  function syncLangToggle(){
    if(!langToggle)return;
    langToggle.innerHTML=lang()==='en'?'🇸🇪 SV':'🇬🇧 EN';
  }
  if(langToggle){
    langToggle.addEventListener('click',e=>{
      e.stopPropagation();
      if(typeof toggleLang==='function')toggleLang();
      syncLangToggle();
      renderMenu();
    });
  }
  syncLangToggle();

  renderMenu();
})();}catch(err){console.error('Gymbot widget failed to init, rest of page unaffected:',err);}

document.getElementById('modal-close').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});

try{
  const subModal=document.getElementById('subscribe-modal');
  const openSubBtn=document.getElementById('open-subscribe-modal');
  const closeSubBtn=document.getElementById('subscribe-modal-close');
  let lastFocusedBeforeSubModal=null;

  function openSubModal(){
    lastFocusedBeforeSubModal=document.activeElement;
    subModal.classList.add('active');document.body.style.overflow='hidden';
    const firstField=subModal.querySelector('a,button');
    if(firstField)firstField.focus();
    track('subscribe_modal_open');
  }
  function closeSubModal(){
    subModal.classList.remove('active');document.body.style.overflow='';
    if(lastFocusedBeforeSubModal&&lastFocusedBeforeSubModal.focus)lastFocusedBeforeSubModal.focus();
  }
  if(openSubBtn)openSubBtn.addEventListener('click',openSubModal);
  if(closeSubBtn)closeSubBtn.addEventListener('click',closeSubModal);
  if(subModal)subModal.addEventListener('click',e=>{if(e.target===subModal)closeSubModal()});
  document.addEventListener('keydown',e=>{
    if(!subModal||!subModal.classList.contains('active'))return;
    if(e.key==='Escape'){closeSubModal();return;}
    if(e.key==='Tab'){
      const focusable=subModal.querySelectorAll('a,button');
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  // Convert https:// subscribe links to webcal:// so Apple/most calendar
  // apps offer a direct "Subscribe" flow instead of downloading a file.
  document.querySelectorAll('.sub-subscribe-btn').forEach(btn=>{
    const absoluteUrl=new URL(btn.getAttribute('href'),window.location.href).href;
    btn.href=absoluteUrl.replace(/^https?:\/\//,'webcal://');
    btn.addEventListener('click',()=>track('schedule_subscribe',{feed:btn.dataset.feed}));
  });

  document.querySelectorAll('.sub-copy-btn').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const feed=btn.dataset.feed;
      const url=new URL('feeds/'+feed+'.ics',window.location.href).href;
      try{
        await navigator.clipboard.writeText(url);
        const original=btn.textContent;
        btn.textContent=(translations[currentLang]&&translations[currentLang].sub_copied_btn)||'Kopierat!';
        btn.classList.add('copied');
        setTimeout(()=>{btn.textContent=original;btn.classList.remove('copied');},2000);
        track('schedule_subscribe_copy',{feed});
      }catch(err){
        console.error('Clipboard write failed:',err);
      }
    });
  });
}catch(err){console.error('Subscribe modal failed to initialize, rest of page unaffected:',err);}

try{
  const alertsModal=document.getElementById('alerts-modal');
  const openAlertsBtn=document.getElementById('open-alerts-modal');
  const closeAlertsBtn=document.getElementById('alerts-modal-close');
  const alertsForm=document.getElementById('alerts-form');
  const alertsSubmitBtn=document.getElementById('alerts-submit');
  let lastFocusedBeforeAlertsModal=null;

  function t(key){return (translations[currentLang]&&translations[currentLang][key])||key;}

  function openAlertsModal(){
    lastFocusedBeforeAlertsModal=document.activeElement;
    alertsModal.classList.add('active');document.body.style.overflow='hidden';
    const firstField=alertsModal.querySelector('input,button');
    if(firstField)firstField.focus();
  }
  function closeAlertsModal(){
    alertsModal.classList.remove('active');document.body.style.overflow='';
    if(lastFocusedBeforeAlertsModal&&lastFocusedBeforeAlertsModal.focus)lastFocusedBeforeAlertsModal.focus();
  }
  if(openAlertsBtn)openAlertsBtn.addEventListener('click',openAlertsModal);
  if(closeAlertsBtn)closeAlertsBtn.addEventListener('click',closeAlertsModal);
  if(alertsModal)alertsModal.addEventListener('click',e=>{if(e.target===alertsModal)closeAlertsModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&alertsModal&&alertsModal.classList.contains('active'))closeAlertsModal();});

  if(alertsForm){
    alertsForm.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!ALERTS_ENDPOINT){
        alertsSubmitBtn.textContent=t('alerts_unset');
        return;
      }
      const email=document.getElementById('alerts-email').value.trim();
      if(!email)return;
      const original=alertsSubmitBtn.textContent;
      alertsSubmitBtn.textContent=t('alerts_sending');
      alertsSubmitBtn.disabled=true;
      try{
        // Apps Script Web Apps don't return CORS headers by default, so the
        // response is opaque here — mode:'no-cors' still delivers the POST,
        // we just can't read a status back. Treat "no network error" as
        // success; the Apps Script side is what actually validates the email.
        await fetch(ALERTS_ENDPOINT,{
          method:'POST',
          mode:'no-cors',
          headers:{'Content-Type':'text/plain'},
          body:JSON.stringify({email})
        });
        alertsSubmitBtn.textContent=t('alerts_sent');
        alertsForm.reset();
        setTimeout(closeAlertsModal,1800);
      }catch(err){
        console.error('Alerts sign-up failed:',err);
        alertsSubmitBtn.textContent=t('alerts_error');
      }finally{
        setTimeout(()=>{alertsSubmitBtn.textContent=original;alertsSubmitBtn.disabled=false;},2200);
      }
    });
  }
}catch(err){console.error('Alerts modal failed to initialize, rest of page unaffected:',err);}

document.addEventListener('keydown',e=>{
  if(!modal.classList.contains('active'))return;
  if(e.key==='Escape'){closeModal();return;}
  if(e.key==='Tab'){
    const focusable=modal.querySelectorAll('input,select,button,a[href]');
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
function track(eventName,props){
  if(typeof window.plausible==='function'){window.plausible(eventName,props?{props}:undefined);}
  else{console.debug('[analytics] would track:',eventName,props||'');}
}
document.addEventListener('click',function(e){
  if(e.target.closest('.open-modal'))track('Trial booking opened');
  const memberLink=e.target.closest('a[href*="gymcontrol.se"]');
  if(memberLink)track('Membership link clicked',{url:memberLink.href});
});
document.getElementById('booking-form').addEventListener('submit',function(e){
  e.preventDefault();
  const btn=document.getElementById('modal-submit');
  if(!FORMSPREE_ENDPOINT){
    console.warn('FORMSPREE_ENDPOINT is not set, form submissions have nowhere to go yet.');
    btn.textContent='Formuläret är inte klart ännu. Maila oss direkt.';
    btn.style.background='rgba(220,80,80,0.15)';btn.style.color='#e05a5a';
    return;
  }
  btn.textContent='...';btn.disabled=true;
  fetch(FORMSPREE_ENDPOINT,{method:'POST',body:new FormData(this),headers:{'Accept':'application/json'}})
  .then(res=>{
    if(!res.ok)throw new Error('bad response');
    track('Trial booking submitted');
    btn.textContent='Skickat! Vi hör av oss snart.';
    btn.style.background='rgba(116,194,188,0.2)';btn.style.color='var(--teal)';
    setTimeout(closeModal,2200);
  })
  .catch(()=>{
    btn.textContent='Något gick fel. Försök igen eller maila oss direkt.';
    btn.style.background='rgba(220,80,80,0.15)';btn.style.color='#e05a5a';btn.disabled=false;
  });
});

function parseCSV(text){
  const rows=[];let headers=null;let i=0;const len=text.length;
  function parseField(){
    if(i<len&&text[i]==='"'){i++;let val='';
      while(i<len){if(text[i]==='"'){if(i+1<len&&text[i+1]==='"'){val+='"';i+=2;}else{i++;break;}}else{val+=text[i++];}}return val;
    }else{let val='';while(i<len&&text[i]!==','&&text[i]!=='\n'&&text[i]!=='\r'){val+=text[i++];}return val.trim();}
  }
  function parseRow(){
    const fields=[];
    while(i<len){fields.push(parseField());
      if(i<len&&text[i]===','){i++;continue;}
      if(i<len&&(text[i]==='\r'||text[i]==='\n')){if(text[i]==='\r'&&i+1<len&&text[i+1]==='\n')i++;i++;}break;
    }return fields;
  }
  while(i<len){
    if(text[i]==='\r'||text[i]==='\n'){i++;continue;}
    const fields=parseRow();
    if(!fields.length||(fields.length===1&&fields[0]===''))continue;
    if(!headers){headers=fields;continue;}
    const obj={};headers.forEach((h,idx)=>obj[h.trim()]=(fields[idx]||'').trim());rows.push(obj);
  }return rows;
}

const CSV_SCHEMA='https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=1060172934&single=true&output=csv';
const CSV_TEMP_PERIODS='https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=1900013866&single=true&output=csv';
const CSV_TEMP_CLASSES='https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=262188045&single=true&output=csv';
const CSV_EXCEPTIONS='https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=826852807&single=true&output=csv';
const FORMSPREE_ENDPOINT='https://formspree.io/f/mzepjype';
// Google Apps Script Web App URL for the schedule-alerts sign-up (Prenumeranter tab).
// Empty until the Apps Script is deployed — see /scripts/apps-script-alerts.gs for the
// code to paste in, and ALERTS_SETUP.md for deployment steps. Once deployed, paste the
// "Web app URL" Google gives you here.
const ALERTS_ENDPOINT='https://script.google.com/macros/s/AKfycbz3kkraPbQGwZfMaECPcX8xKB1iEI9budozd7rpleF19jSpYvCYF2VTEJXsj5wYn5E3/exec';
// News now runs on Sanity instead of the old news CSV — fill these in after creating the Sanity project (see setup notes).
const SANITY_PROJECT_ID='9hvgh1q1';
const SANITY_DATASET='production';
const SANITY_API_VERSION='2024-01-01';
function sanityImageUrl(ref,width){
  if(!ref)return null;
  const parts=ref.replace('image-','').split('-');
  const dims=parts[parts.length-2];
  const format=parts[parts.length-1];
  const assetId=parts.slice(0,parts.length-2).join('-');
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}-${dims}.${format}${width?`?w=${width}`:''}`;
}
const dagOrder=['Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag','Söndag'];

function esc(v){
  if(v===null||v===undefined)return'';
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function splitPassLevel(str){
  // The sheet's "Nivå" column holds "ClassName – Level" combined on purpose
  // (staff enter it that way). Split it here so the class name shows as the
  // heading and the level as the small badge.
  str=str||'';
  const seps=[' – ',' - '];
  for(const sep of seps){
    const idx=str.indexOf(sep);
    if(idx!==-1)return{name:str.slice(0,idx).trim(),level:str.slice(idx+sep.length).trim()};
  }
  return{name:str.trim(),level:''};
}
function normalizeScheduleRow(r){
  // New sheet has separate Start/Slut/Pass/Niva columns plus Aktiv.
  // Old sheet had Tid=start, Pass=end, Niva="Name - Level" combined.
  // Map the new shape onto the old field names so every renderer below
  // (and splitPassLevel) keeps working untouched. Also stays backward
  // compatible if the old sheet is ever pointed at again.
  if(r.Start===undefined&&r.Slut===undefined)return r;
  const name=(r.Pass||'').trim();
  const level=(r['Nivå']||r['Niv\u00e5']||'').trim();
  return Object.assign({},r,{
    Tid:(r.Start||'').trim(),
    Pass:(r.Slut||'').trim(),
    'Nivå':level?name+' \u2013 '+level:name,
    _passName:name
  });
}
function isChecked(v){
  // Strictly false when the column is absent. Never merge this with
  // isActiveRow below, which treats a missing value as TRUE on purpose.
  if(v===undefined||v===null)return false;
  return ['true','sant','ja','x','1','yes'].includes(String(v).trim().toLowerCase());
}
function isActiveRow(r){
  if(r.Aktiv===undefined)return true;   // no Aktiv column at all = everything active
  return isChecked(r.Aktiv);
}
function isCancelled(r){
  return /inställ/i.test(r.Status||'');
}
let scheduleView='day';
let scheduleData={byDay:{},days:[]};
function setScheduleView(view){
  scheduleView=view;
  document.getElementById('view-week').classList.toggle('active',view==='week');
  document.getElementById('view-day').classList.toggle('active',view==='day');
  renderSchedule();
}
function renderSchedule(){
  const{byDay,days}=scheduleData;if(!days.length)return;
  const tabsEl=document.getElementById('schedule-tabs');
  const content=document.getElementById('schedule-content');
  content.style.cssText='display:block;min-height:auto';
  if(scheduleView==='week'){
    tabsEl.style.display='none';
    content.innerHTML=`<div class="week-grid">${days.map(day=>`<div class="week-col"><div class="week-day-header">${esc(day)}</div><div class="week-day-slots">${byDay[day].map(r=>{const pl=splitPassLevel(r['Nivå']||r['Niv\u00e5']||'');return `<div class="week-slot${isCancelled(r)?' is-cancelled':''}"><span class="week-slot-line"></span><div class="week-slot-time">${esc(r.Tid)}${r.Pass?'–'+esc(r.Pass):''}</div><div class="week-slot-name">${esc(pl.name)}</div><span class="week-slot-level">${esc(pl.level)}</span>${isCancelled(r)?' <span class="schedule-cancelled-badge">Inställt</span>':''}</div>`}).join('')}</div></div>`).join('')}</div>`;
  }else{
    tabsEl.style.display='';
    tabsEl.innerHTML='<div class="schedule-tab-pill"></div>'+days.map((d,i)=>`<button class="schedule-tab ${i===0?'active':''}" data-day="${esc(d)}">${esc(d)}</button>`).join('');
    function positionPill(activeBtn){
      const pill=tabsEl.querySelector('.schedule-tab-pill');
      if(!pill||!activeBtn)return;
      pill.style.width=activeBtn.offsetWidth+'px';
      pill.style.height=activeBtn.offsetHeight+'px';
      pill.style.transform='translate('+activeBtn.offsetLeft+'px,'+activeBtn.offsetTop+'px)';
      if(tabsEl.scrollWidth>tabsEl.clientWidth){
        tabsEl.scrollTo({left:activeBtn.offsetLeft-(tabsEl.clientWidth-activeBtn.offsetWidth)/2,behavior:'smooth'});
      }
    }
    const hintEl=document.getElementById('schedule-hint');
    function updateTabAffordance(){
      const overflow=tabsEl.scrollWidth-tabsEl.clientWidth;
      tabsEl.classList.toggle('fade-l',overflow>2&&tabsEl.scrollLeft>2);
      tabsEl.classList.toggle('fade-r',overflow>2&&tabsEl.scrollLeft<overflow-2);
      if(hintEl)hintEl.style.visibility=overflow>2?'':'hidden';
    }
    tabsEl.addEventListener('scroll',()=>{
      updateTabAffordance();
      if(hintEl&&tabsEl.scrollLeft>12)hintEl.classList.add('is-done');
    },{passive:true});
    window.addEventListener('resize',updateTabAffordance);
    requestAnimationFrame(updateTabAffordance);
    function renderDay(day){
      content.innerHTML=`<div class="schedule-grid">${byDay[day].map(r=>{const pl=splitPassLevel(r['Nivå']||r['Niv\u00e5']||'');return `<div class="schedule-card${isCancelled(r)?' is-cancelled':''}"><span class="schedule-card-line"></span><div class="schedule-time">${esc(r.Tid)}${r.Pass?'–'+esc(r.Pass):''}</div><div class="schedule-info"><h3>${esc(pl.name)}${isCancelled(r)?' <span class="schedule-cancelled-badge">Inställt</span>':''}</h3><span class="schedule-level">${esc(pl.level)}</span></div></div>`}).join('')}</div>`;
      addScheduleAnimations();
    }
    renderDay(days[0]);
    positionPill(tabsEl.querySelector('.schedule-tab.active'));
    tabsEl.addEventListener('click',e=>{
      const tab=e.target.closest('.schedule-tab');if(!tab)return;
      tabsEl.querySelectorAll('.schedule-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');renderDay(tab.dataset.day);positionPill(tab);
    });
    window.addEventListener('resize',()=>positionPill(tabsEl.querySelector('.schedule-tab.active')));
  }
}
function updateSubscribeCounts(rows){
  // Counts and class lists are read from the sheet at page load rather than
  // hardcoded, so the modal can never drift from the actual schedule.
  document.querySelectorAll('.sub-option-classes').forEach(el=>{
    // Match the sheet's header case-insensitively — staff retype these by hand
    // and 'Alla Nivåer' must not silently count as zero.
    const norm=t=>String(t).trim().replace(/\s+/g,' ').toLowerCase();
    const cols=(el.dataset.cat||'').split('|').filter(Boolean).map(norm);
    const matched=cols.length?rows.filter(r=>
      Object.keys(r).some(k=>cols.includes(norm(k))&&isChecked(r[k]))
    ):rows;
    const names=[...new Set(matched.map(r=>(r._passName||'').trim()).filter(Boolean))];
    if(!matched.length){el.textContent='';el.closest('.sub-option').style.display='none';return;}
    el.closest('.sub-option').style.display='';
    const t=translations[currentLang]||{};
    const word=matched.length===1?(t.sub_class_one||'pass'):(t.sub_class_many||'pass');
    el.textContent=matched.length+' '+word+' i veckan: '+names.join(', ');
  });
}
const veckodagIndex={'Söndag':0,'Måndag':1,'Tisdag':2,'Onsdag':3,'Torsdag':4,'Fredag':5,'Lördag':6};
function toISODate(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function nextDateForDay(dayName){
  // Same "next occurrence of this weekday" logic as generate_ics.py's
  // next_date_for_weekday, so the website and calendar feeds agree on
  // which real calendar date a weekday tab currently represents.
  const target=veckodagIndex[dayName];
  if(target===undefined)return null;
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const diff=(target-today.getDay()+7)%7;
  const d=new Date(today);d.setDate(d.getDate()+diff);
  return d;
}
function findActivePeriod(periods){
  const todayISO=toISODate(new Date());
  return periods.find(p=>{
    if(!isChecked(p.Aktiv))return false;
    const start=(p.Start||'').trim(),slut=(p.Slut||'').trim();
    // Dates must be typed as YYYY-MM-DD in the sheet — plain string
    // comparison then sorts correctly without a date-parsing dependency.
    if(!start||!slut)return false;
    return start<=todayISO&&todayISO<=slut;
  });
}
async function fetchCSVSafe(url){
  // Any of the three new tabs may be unpublished, empty, or briefly
  // unreachable — none of that should ever break the normal schedule.
  try{
    const res=await fetch(url);
    if(!res.ok)return [];
    return parseCSV(await res.text());
  }catch(e){return [];}
}

async function loadSchedule(){
  try{
    const res=await fetch(CSV_SCHEMA);
    if(!res.ok)throw new Error('bad response');
    const text=await res.text();
    const normalRows=parseCSV(text).filter(isActiveRow).map(normalizeScheduleRow);

    const [periodRows,tempClassRows,exceptionRows]=await Promise.all([
      fetchCSVSafe(CSV_TEMP_PERIODS),fetchCSVSafe(CSV_TEMP_CLASSES),fetchCSVSafe(CSV_EXCEPTIONS)
    ]);
    const activePeriod=findActivePeriod(periodRows);
    const allRows=activePeriod
      ? tempClassRows.filter(isActiveRow).filter(r=>(r.Period||'').trim()===(activePeriod.Namn||'').trim()).map(normalizeScheduleRow)
      : normalRows;

    // Index exceptions by the real calendar date they target, so each
    // weekday tab can look up "does anything override me today?".
    const exceptionsByDate={};
    exceptionRows.forEach(r=>{
      const datum=(r.Datum||'').trim();
      if(!datum)return;
      (exceptionsByDate[datum]=exceptionsByDate[datum]||[]).push(r);
    });

    const rows=allRows.filter(r=>{
      const day=(r.Dag||'').trim();
      const time=(r.Tid||'').trim();
      const name=(r.Pass||'').trim();
      const validDay=dagOrder.includes(day);
      if(!validDay||!time||!name){
        if(day||time||name)console.warn('Skipping malformed schedule row:',r);
        return false;
      }
      return true;
    });
    if(!allRows.length){
      document.getElementById('schedule-content').innerHTML='<p style="color:var(--muted);font-size:13px;padding:20px 0">Schemat är tomt just nu.</p>';
      return;
    }
    if(!rows.length){
      document.getElementById('schedule-content').innerHTML='<p style="color:var(--muted);font-size:13px;padding:20px 0">Schemat kunde inte tolkas. Kontrollera kalkylbladets format.</p>';
      return;
    }

    // Apply one-off exceptions on top of whichever base schedule (normal
    // or temporary) is in effect. Precedence: exception > temporary period
    // > normal schedule — the temp-period swap already happened above, so
    // this layer only has to handle the "one specific date" case.
    const extraMessages=[];
    rows.forEach(r=>{
      const d=nextDateForDay(r.Dag);
      if(!d)return;
      const iso=toISODate(d);
      const matches=(exceptionsByDate[iso]||[]).filter(e=>
        (e.Pass||'').trim().toLowerCase()===(r._passName||r.Pass||'').trim().toLowerCase()
      );
      matches.forEach(e=>{
        const typ=(e.Typ||'').trim().toLowerCase();
        if(typ.includes('inställ')){
          r.Status='Inställt'; // reuses the existing isCancelled() rendering as-is
        }
        if((e.Meddelande||'').trim()){
          extraMessages.push(`${r._passName||r.Pass} (${r.Dag}): ${e.Meddelande.trim()}`);
        }
      });
    });

    updateSubscribeCounts(rows);
    const byDay={};rows.forEach(r=>{if(!byDay[r.Dag])byDay[r.Dag]=[];byDay[r.Dag].push(r);});
    const days=Object.keys(byDay).sort((a,b)=>dagOrder.indexOf(a)-dagOrder.indexOf(b));
    scheduleData={byDay,days};renderSchedule();

    const infoBox=document.getElementById('schedule-info-box');
    const infoMsgs=[]; // Anteckning holds internal staff notes (spelling fixes, QA flags), never meant for public display — the banner is now driven only by active-period/exception messages below.
    if(activePeriod){
      const namn=(activePeriod.Namn||'').trim()||'Tillfälligt schema';
      infoMsgs.unshift(`Just nu gäller ${namn} (${activePeriod.Start.trim()}–${activePeriod.Slut.trim()}).`);
    }
    infoMsgs.push(...extraMessages);
    if(infoMsgs.length){
      infoBox.style.display='flex';
      infoBox.innerHTML=`<span class="schedule-info-icon">i</span><span class="schedule-info-text"><span class="schedule-info-label">Viktig information</span>${infoMsgs.map(esc).join('<br>')}</span>`;
    }else{
      infoBox.style.display='none';
    }
  }catch(err){
    document.getElementById('schedule-content').innerHTML='<p style="color:var(--muted);font-size:13px;padding:20px 0">Kunde inte ladda schemat. Kontrollera din internetanslutning och försök igen.</p>';
  }
}
if(document.getElementById('schedule-tabs'))loadSchedule();

// ── SCHEDULE TEASER (homepage "Nästa pass" preview) ──
async function loadScheduleTeaser(){
  const el=document.getElementById('scheduleTeaserCards');
  if(!el)return;
  try{
    const res=await fetch(CSV_SCHEMA);
    if(!res.ok)throw new Error('bad response');
    const text=await res.text();
    const rows=parseCSV(text).filter(isActiveRow).map(normalizeScheduleRow).filter(r=>{
      const day=(r.Dag||'').trim(),time=(r.Tid||'').trim(),name=(r.Pass||'').trim();
      return dagOrder.includes(day)&&time&&name;
    });
    if(!rows.length){el.innerHTML='<p class="schedule-teaser-empty">Schemat är tomt just nu.</p>';return;}
    const byDay={};rows.forEach(r=>{(byDay[r.Dag]=byDay[r.Dag]||[]).push(r);});
    const dayNames=['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'];
    const now=new Date();
    const nowMinutes=now.getHours()*60+now.getMinutes();
    function timeToMinutes(t){
      const m=/^(\d{1,2}):(\d{2})/.exec((t||'').trim());
      if(!m)return null;
      return parseInt(m[1],10)*60+parseInt(m[2],10);
    }
    let picked=[],pickedDayName='',isToday=false;
    for(let offset=0;offset<7;offset++){
      const d=new Date(now);d.setDate(now.getDate()+offset);
      const dayName=dayNames[d.getDay()];
      let dayRows=(byDay[dayName]||[]).filter(r=>!isCancelled(r));
      if(offset===0){
        dayRows=dayRows.filter(r=>{const mins=timeToMinutes(r.Tid);return mins===null||mins>=nowMinutes;});
      }
      dayRows.sort((a,b)=>(a.Tid||'').localeCompare(b.Tid||''));
      if(dayRows.length){picked=dayRows.slice(0,4);pickedDayName=dayName;isToday=offset===0;break;}
    }
    if(!picked.length){el.innerHTML='<p class="schedule-teaser-empty">Inga kommande pass hittades.</p>';return;}
    const dayLabel=isToday?'Idag · '+pickedDayName:pickedDayName;
    el.innerHTML=picked.map(r=>{
      const pl=splitPassLevel(r['Nivå']||r['Niv\u00e5']||'');
      return `<div class="schedule-teaser-card"><div class="schedule-teaser-day${isToday?' is-today':''}">${esc(dayLabel)}</div><div class="schedule-teaser-time">${esc(r.Tid)}</div><div class="schedule-teaser-name">${esc(pl.name)}</div><span class="schedule-teaser-level">${esc(pl.level)}</span></div>`;
    }).join('');
  }catch(err){
    el.innerHTML='<p class="schedule-teaser-empty">Kunde inte ladda schemat.</p>';
  }
}
if(document.getElementById('scheduleTeaserCards'))loadScheduleTeaser();

async function loadNews(){
  const newsGrid=document.getElementById('news-grid');
  if(!newsGrid)return;
  const query=encodeURIComponent('*[_type == "newsPost" && publishedAt <= now()] | order(publishedAt desc){title, tag, publishedAt, teaser, body, mainImage, interestForm, interestFormQuestion, interestFormButtonText}');
  const url=`https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${query}`;
  try{
    const res=await fetch(url);
    const json=await res.json();
    const rows=(json.result||[]);
    if(!rows.length){newsGrid.innerHTML='<p style="color:var(--muted);font-size:14px">Inga nyheter just nu.</p>';return;}
    newsGrid.innerHTML=rows.map((r,i)=>{
      const tag=(r.tag||'Nyhet').trim();
      const date=r.publishedAt?new Date(r.publishedAt).toLocaleDateString('sv-SE',{year:'numeric',month:'long',day:'numeric'}):'';
      const title=(r.title||'').trim();
      const teaser=(r.teaser||'').trim();
      const body=(r.body||'').trim();
      const imgRef=r.mainImage&&r.mainImage.asset?r.mainImage.asset._ref:null;
      const imgUrl=sanityImageUrl(imgRef,600);
      const imgAlt=(r.mainImage&&r.mainImage.alt)?r.mainImage.alt:'';
      const footerId=`news-body-${i}`;
      const formId=`news-form-${i}`;
      const formHtml=r.interestForm?`
        <form class="news-interest-form" id="${formId}" onsubmit="return submitNewsForm(event,'${formId}','${esc(title).replace(/'/g,"\'")}')">
          <p class="news-interest-label">${esc(r.interestFormQuestion||'')}</p>
          <input type="text" name="namn" placeholder="Namn" required>
          <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
          <input type="email" name="email" placeholder="E-post" required>
          <textarea name="svar" placeholder="${esc(r.interestFormQuestion||'Ditt svar')}" rows="2" required></textarea>
          <button type="submit" class="news-interest-submit">${esc(r.interestFormButtonText||'Skicka')}</button>
          <p class="news-interest-sent" style="display:none">Tack! Vi hör av oss.</p>
        </form>`:'';
      return `<div class="news-card">
        <img class="news-card-img${imgUrl?'':' news-card-img-fallback'}" src="${imgUrl||'MastersGymLogo.png'}" alt="${esc(imgAlt)||'Masters Gym'}" loading="lazy" />
        <div class="news-meta">
          <span class="news-tag">${esc(tag)}</span>
          ${date?`<span class="news-date">${esc(date)}</span>`:''}
        </div>
        <h3 class="news-title">${esc(title)}</h3>
        <p class="news-teaser">${esc(teaser)}</p>
        ${body?`<button type="button" class="news-card-footer clickable" onclick="const el=document.getElementById('${footerId}');el.classList.toggle('open');this.textContent=el.classList.contains('open')?'Visa mindre ←':'Läs mer →';">Läs mer →</button><p class="news-card-body" id="${footerId}">${esc(body)}</p>`:''}
        ${formHtml}
      </div>`;
    }).join('');
  }catch(err){
    newsGrid.innerHTML='<p style="color:var(--muted);font-size:14px">Kunde inte ladda nyheter.</p>';
  }
}
loadNews();

function submitNewsForm(e,formId,postTitle){
  e.preventDefault();
  const form=document.getElementById(formId);
  if(!FORMSPREE_ENDPOINT){
    console.warn('FORMSPREE_ENDPOINT is not set — form submissions have nowhere to go yet.');
    alert('Formuläret är inte klart att skicka ännu. Kontakta oss direkt under tiden.');
    return false;
  }
  const fd=new FormData(form);
  fd.append('inlägg',postTitle);
  const btn=form.querySelector('.news-interest-submit');
  const sent=form.querySelector('.news-interest-sent');
  btn.disabled=true;
  fetch(FORMSPREE_ENDPOINT,{method:'POST',body:fd,headers:{'Accept':'application/json'}})
    .then(res=>{
      if(res.ok){
        form.querySelectorAll('input,textarea,button.news-interest-submit').forEach(el=>el.style.display='none');
        sent.style.display='block';
      }else{
        btn.disabled=false;
        alert('Något gick fel. Försök igen eller kontakta oss direkt.');
      }
    })
    .catch(()=>{btn.disabled=false;alert('Något gick fel. Försök igen eller kontakta oss direkt.');});
  return false;
}

const mapEl=document.getElementById('map');
if(mapEl){
  const map=L.map('map',{scrollWheelZoom:false}).setView([59.3293,18.0440],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
  const icon=L.divIcon({className:'',html:'<div style="width:14px;height:14px;background:#74C1BB;border-radius:50%;border:2px solid #080808;box-shadow:0 0 0 4px rgba(116,194,188,0.3);"></div>',iconSize:[14,14],iconAnchor:[7,7]});
  const marker=L.marker([59.3293,18.0440],{icon,alt:'Masters Gym Stockholm, Norra Agnegatan 36',title:'Masters Gym Stockholm'}).addTo(map).bindPopup('<strong>Masters Gym Stockholm</strong><br>Norra Agnegatan 36').openPopup();
  const markerEl=marker.getElement();
  if(markerEl) markerEl.setAttribute('aria-label','Masters Gym Stockholm, Norra Agnegatan 36');
}

const revealObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}});},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-stagger,.reveal-h2,.values-composition').forEach(el=>revealObserver.observe(el));

function animateCounter(el,target,duration=1800){const num=parseInt(target);if(isNaN(num))return;const start=performance.now();function update(now){const p=Math.min((now-start)/duration,1);const e=1-Math.pow(1-p,3);el.textContent=Math.floor(e*num);if(p<1)requestAnimationFrame(update);else el.textContent=target;}requestAnimationFrame(update);}
const counterObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){animateCounter(e.target,e.target.getAttribute('data-target'));counterObserver.unobserve(e.target);}});},{threshold:0.5});
document.querySelectorAll('.about-stat-num').forEach(el=>{el.setAttribute('data-target',el.textContent.trim());counterObserver.observe(el);});

function addScheduleAnimations(){
  document.querySelectorAll('.schedule-card').forEach((card,i)=>{
    card.style.opacity='0';card.style.transform='translateX(-20px)';
    card.style.transition=`opacity .4s ease ${i*.07}s,transform .4s cubic-bezier(.22,.61,.36,1) ${i*.07}s`;
    setTimeout(()=>{card.style.opacity='1';card.style.transform='translateX(0)';},50);
  });
}

const translations={sv:{bot_greeting:'Snabbhjälp',nav_tagline:'Kick- & Thaiboxning · Stockholm 2016',nav_about:'Om oss',nav_classes:'Våra pass',nav_kids:'Barn & Junior',nav_schedule:'Schema',nav_memberships:'Medlemskap',nav_corporate:'Företag',nav_pt:'PT',nav_coaches:'Coacher',nav_news:'Nyheter',nav_contact:'Kontakt',nav_cta_trial:'Boka provpass',nav_cta_member:'Bli medlem',modal_title:'BOKA PROVPASS',modal_sub:'Prova ditt första pass för 200 kr. Vi återkommer inom 24 timmar.',modal_schedule_hint_q:'Osäker på när du kan träna?',modal_schedule_hint_link:'Se schemat här →',modal_name:'Ditt namn',modal_email:'E-postadress',modal_phone:'Telefonnummer (valfritt)',modal_select:'Vilket pass intresserar dig?',modal_opt1:'Nybörjarpass',modal_opt2:'Fortsättningspass',modal_opt3:'Boxning',modal_opt4:'Fyspass',modal_opt5:'Barnträning',modal_opt6:'Företagsträning',modal_opt7:'Vet inte ännu',modal_opt8:'PT-pass',modal_ref_placeholder:'Hur hörde du talas om oss? (valfritt)',modal_ref1:'Instagram',modal_ref2:'Facebook',modal_ref3:'TikTok',modal_ref4:'Google',modal_ref5:'Vän eller medlem',modal_ref6:'Gick förbi',modal_ref7:'Annat',modal_submit:'Skicka förfrågan →',modal_note:'Ingen bindningstid. Ingen utrustning behövs.',modal_sent:'Skickat! Vi hör av oss snart.',hero_eyebrow:'Stockholm · Kungsholmen · Est. 2016',hero_everybody:'EVERYONE',hero_desc:'Kick- och thaiboxning för alla nivåer. Från nybörjare till världsmästare.',hero_corp_link:'Träning för ditt företag? Se företagspaket →',scroll:'Scroll',mq1:'HARD WORK • RESPECT • COMMUNITY • EVERYONE IS EQUAL •',mq2:'MASTERS GYM STOCKHOLM • NORRA AGNEGATAN 36 • KUNGSHOLMEN • GRUNDAT 2016 •',mq2_1:'MASTERS GYM STOCKHOLM',mq2_2:'NORRA AGNEGATAN 36',mq2_3:'KUNGSHOLMEN',mq2_4:'GRUNDAT 2016',values_label:'Våra värderingar',values_h2:'DISCIPLINE.\nRESPECT.\nCOMMUNITY.',val1_title:'HARD WORK',val1_text:'Oavsett vad ditt mål är hjälper vi dig att nå det.',val2_title:'RESPECT',val2_text:'Alla är välkomna oavsett nivå eller bakgrund.',val3_title:'COMMUNITY',val3_text:'Kom och skaffa vänner för livet.',about_bar:'MASTERS GYM · STOCKHOLM · 2016',about_label:'Om Masters Gym',about_h2:'MER ÄN ETT GYM',about_tagline:'"See you soon, champion!"',about_p1:'Masters Gym grundades 2016 i Kungsholmen och utnämndes till bästa klubb av Svenska Kickboxningsförbundet både 2017 och 2018.',about_p2:'Vi har några av Sveriges bästa tränare. Vår Sofia är landslagsfighter.',about_p3:'Norra Agnegatan 36, 10 min från Centralstationen. T-bana: Rådhuset.',stat1:'Grundat',stat2:'Bästa klubb',stat3_num:'Alla',stat3:'Nivåer välkomna',test1_quote:'"Masters Gym är som min extra familj."',test1_author:'— Medlem',test2_quote:'"Min son önskar att det var barnträning varje dag."',test2_author:'— Mamma till en av våra yngsta',reviews_label:'Recensioner',reviews_h2:'VAD MEDLEMMARNA SÄGER',reviews_sub:'Riktiga röster från gymmet, direkt från Google.',reviews_rating_suffix:'· 83 recensioner på Google',reviews_swipe_hint:'Svep för fler recensioner',reviews_cta:'Skriv en recension på Google →',faq_label:'Vanliga frågor',faq_h2:'FAQ',faq_sub:'Svar på det du undrar innan du kliver in för första gången.',faq_q1:'Måste jag vara vältränad för att börja?',faq_a1_pre:'Nej. ',faq_a1_link:'Alla pass',faq_a1_post:' är byggda för att fungera oavsett var du står idag. Vi anpassar tempo och intensitet efter gruppen, inte tvärtom.',faq_q2:'Måste jag sparras?',faq_a2:'Nej, sparring är alltid frivilligt och sker bara i grupper där det är relevant, med rätt skyddsutrustning.',faq_q4:'Får jag låna utrustning första gången?',faq_a4_pre:'Ja, vid ',faq_a4_link:'provpasset',faq_a4_post:' står vi för handskar och det du behöver för att testa på riktigt.',faq_q5:'Vilken ålder gäller för barnträning?',
faq_q6:'Jag har aldrig tränat kampsport, kan jag börja hos er?',
faq_a6:'Absolut. Nybörjarpassen är gjorda för det, vi börjar med grunderna (slag, sparkar, fotarbete) och bygger på därifrån. Du behöver inte kunna någonting innan ditt första pass.',
faq_q7:'Vad är skillnaden mellan thaiboxning och kickboxning?',
faq_a7:'Båda är stående kampsporter med slag, sparkar och fotarbete. Thaiboxning (muaythai) innehåller även knän, armbågar och clinch. Som nybörjare behöver du inte kunna skillnaden, du hittar din stil längs vägen.',
faq_q8:'Hur skiljer sig kampsport från ett vanligt gympass?',
faq_a8:'På gymmet tränar du ofta en muskelgrupp i taget. I kampsport jobbar hela kroppen samtidigt, balans, koordination och tajming, så du bygger både kondition och en färdighet samtidigt.',
faq_a5_pre:'Se ',faq_a5_post:'-sidan för fullständig åldersindelning och nivåer.',coach_bar:'MASTERS GYM · HEAD COACH',coach_label:'Head Coach',coach_text:'Thamer är huvudtränaren på Masters Gym med imponerande internationell meritlista.',coach_quote:'"Jag älskar kickboxning. Det ger självförtroende och vänner för livet!"',ct1:'Iraq Champion',ct2:'Arabian Champion',ct3:'Fighter of the Year',ct4:'World Cup Champion — Pro Muay Thai',ct5:'World Cup Champion — Amatör Kickboxning',ct6:'Master of Muay Thai (Ajarn)',coach_intl:'Internationella tävlingar i Thailand, Ukraina, Italien, Serbien m.fl.',coaches_link:'Se alla instruktörer →',coaches_label:'Instruktörer',coaches_h2:'VÅRT TEAM',coaches_read_more:'Möt hela tränarteamet →',coach_badge_head:'Head Coach',coach_badge_coach:'Coach',coach_role_thamer:'Grundare & Head Coach',coach_bio_thamer:'Grundare av Masters Gym. Iraq Champion, Arabian Champion, World Cup 2003, Ajarn 2009.',coach_role_andy:'Kickboxning & Thaiboxning',coach_bio_andy:'Andy har tränat sedan 2011. Andy håller i lunchpass samt nybörjarpass, ofta med thaistil.',coach_role_christian:'Instruktör',coach_bio_christian:'Har tränat så länge vi kan minnas! Idag har Cribba lagt tävlandet på hyllan men håller lunchpass på Masters Gym.',coach_role_tanja:'Nybörjar- & fyspass',coach_bio_tanja:'Tanja har tränat kickboxning sedan 2010 och varit coach på Masters Gym sedan 2022. Tanja håller både nybörjar- och fyspass.',coach_role_joonas:'Barnträning & morgonpass',coach_bio_joonas:'Joonas är en av Masters Gyms barnledare sedan 2014 och coachar även morgonpasset. Engagerad och erfaren tränare för våra yngsta utövare.',fight_label:'Tävling',fight_h2:'EVENT',event_upcoming_label:'Kommande',event_tba:'Datum meddelas snart',event_img_placeholder:'Bild kommer',classes_label:'Träning',classes_h2:'VÅRA PASS',classes_intro:'På Masters Gym tränar motionärer sida vid sida med tävlingsaktiva på hög nivå. Klubben har utsetts till "Bästa klubb", och våra fighters har tagit flera medaljer.',sched_teaser_label:'Schema',sched_teaser_h2:'NÄSTA PASS',sched_teaser_full:'Se hela schemat',timeline_h1:'Din väg framåt',timeline_h2:'Pass för alla',dropin_intro:'Vi erbjuder träning som passar in i vardagen, oavsett mål eller schema.',timeline_more:'Mer information',path1_title:'Nybörjarpass',path1_text:'Grunderna. Alla börjar här, ingen erfarenhet krävs.',path2_title:'Fortsättningspass',path2_text:'När nivå 1 & 2 är klara. Taktik, teknik och sparring.',path3_title:'Tävlingsgrupp',path3_text:'På inbjudan av huvudtränaren, för dig som vill tävla.',finder_title:'Hitta rätt träning för dig',finder_sub:'Välj det alternativ som stämmer bäst in på dig.',finder_q1:'Är helt ny inom kick- eller thaiboxning',finder_q2:'Har tränat kampsport tidigare',finder_q3:'Vill tävla',finder_q4:'Vill ha personlig träning',finder_q5:'Vill motionera',finder_q6:'Vill träna med mitt företag',finder_q7:'Söker träning för mitt barn',finder_next:'Nästa tillfälle:',finder_r1_title:'Nybörjarpass',finder_r1_text:'Perfekt start. Vi går igenom grunderna tillsammans, inga förkunskaper behövs.',finder_r2_title:'Fortsättningspass',finder_r2_text:'Boka ett provpass så placerar tränaren dig i rätt grupp utifrån din erfarenhet.',finder_r3_title:'Tävlingsgrupp',finder_r3_text:'Tävlingsgruppen bestäms av huvudtränaren. Kontakta oss så pratar vi om dina mål.',finder_r3_cta:'Kontakta oss',finder_r4_title:'PT med Thamer',finder_r4_text:'Skräddarsydd träning från amatör till elitnivå, i din egen takt.',finder_r5_title:'Boxning, Fyspass eller Morgon/Lunch',finder_r5_text:'Drop-in träning för alla nivåer, ingen tävling. Boxning visas här, men Fyspass och Morgon/Lunch passar precis lika bra.',finder_all_link:'Se alla pass',class1_tag:'Nivå 1 & 2 · Alla välkomna',class1_title:'NYBÖRJARPASS',class1_tagline:'Grunderna i kick- och thaiboxning. Inga förkunskaper krävs.',class2_tagline:'Längre kombinationer, teknisk utveckling och sparring.',class3_tagline:'För dig som vill tävla. Bestäms av huvudtränaren.',class4_tagline:'Funktionell träning för hela kroppen. Du kommer svettas!',class5_tagline:'Skräddarsydd träning från amatör till elitnivå.',class6_tagline:'Rena boxningspass med fokus på teknik. Motionsträning, ej tävling.',class7_tagline:'Träning som passar in i ett hektiskt arbetsschema.',class1_text:'Alla som är nyfikna på kick- och thaiboxning är välkomna – inga förkunskaper krävs. Du lär dig grunderna i slag, sparkar och teknik samtidigt som du bygger upp kondition, koordination och självförtroende. Träningen kombinerar teknik, enklare kombinationer och kortare fyspass.',class1_format:'60 minuter med grundtekniker, blockträning och stretch.',class1_equip:'Lånehandskar finns att låna. När du vill ta nästa steg rekommenderar vi lindor för extra stöd, som finns att köpa i receptionen. Vi hjälper dig gärna att visa hur de används.',class2_tag:'Min. 2 terminer',class2_title:'FORTSÄTTNINGSPASS',class2_text:'När man har klarat av nivå 1 och 2 av nybörjarpassen är man redo att gå vidare till fortsättningsgruppen. I fortsättningspassen fokuserar vi på taktik, teknik samt sparring med full kontroll av coach.',class2_text2:'På den här nivån utvecklar vi tekniken ytterligare genom att träna längre kombinationer med slag, sparkar och knän. Vi arbetar mer med timing, distans, rörelse och försvar, samtidigt som tempot blir högre. Du får även lära dig att läsa motståndaren, skapa öppningar och använda teknikerna i olika situationer.',class2_format:'60 minuters pass med tekniker och mer avancerade kombinationer med mits, sparringövningar, lätt fri sparring, blandat med fysträning och stretch.',class2_equip:'Egna handskar, benskydd och lindor. Tandskydd, hjälm och suspensoar vid sparring.',class3_tag:'På inbjudan',class3_title:'TÄVLINGSGRUPP',class3_text:'Det är huvudtränaren som bestämmer vem som får ingå i tävlingsgruppen. Prata med Thamer och hör efter hur du bäst når dina mål att tävla och ingå i Masters Gyms tävlingsgrupp.',class3_equip:'',class4_tag:'Alla nivåer',class4_title:'FYSPASS',class4_text:'Fyspassen är ett komplement till de övriga passen för att förbättra styrka och kondition. Passen är cirkelfyspass med blandade stationer. Alla nivåer är välkomna.',class4_equip:'Träningen sker barfota. Ta med lätta kläder, liten handduk och vattenflaska.',class5_tag:'Personlig träning',class5_title:'PT MED THAMER',class6_tag:'Alla nivåer',class6_title:'BOXNING',class7_tag:'Alla nivåer',class7_title:'MORGON/LUNCH',class5_text:'Från amatör till elitnivå.',class6_text:'Rena boxningspass med mycket fokus på teknik. Boxningspassen är för alla nivåer med inriktning motionsträning, ej tävling.',class7_text:'Perfekta pass för att få in träning i ett hektiskt arbetsschema. Både morgon- och lunchpassen är för alla nivåer för de som vill ha tuff träning.',pt1_label:'1 timme',pt2_label:'5 × 1 timme',pt3_label:'10 × 1 timme',pt_kids_label:'PT för barn',pt_pricing_heading:'Priser',pt_price_toggle:'Se priser',pt4_label:'1 timme',pt5_label:'5 × 1 timme',pt6_label:'10 × 1 timme',pt_cta:'Boka PT-pass',pt_cta_card:'Boka PT-timme',pt_contact_cta:'Kontakta Thamer',pt_read_more:'Läs mer & se priser →',pt_value:'Träna med en världsmästare och huvudtränare på Masters Gym. Skräddarsydd träning från amatör till elitnivå.',pt_check1:'Lär dig snabbare',pt_check2:'Förbered inför tävling',pt_check3:'Kom i form',pt_check4:'Förbättra tekniken',book_trial:'Boka provpass',book_arrow:'Boka →',schedule_h2:'SCHEMA',schedule_intro:'Lägg till schemat i din kalender en gång — ändringar, nya pass och nya tider dyker upp av sig själva.',schedule_subscribe_btn:'Prenumerera på schemat',schedule_swipe_hint:'Svep för fler dagar',sub_modal_title:'PRENUMERERA PÅ SCHEMAT',sub_modal_sub:'Ändras något i schemat — ny tid, nytt pass, något ställs in — uppdateras det automatiskt i din kalender. Du behöver aldrig kolla sajten för att veta vad som gäller.',sub_full_title:'Fullständigt schema',sub_full_desc:'Hela schemat, alltid aktuellt — utan att du behöver tänka på det.',sub_nyborjare_title:'Nybörjare',sub_nyborjare_desc:'Nybörjarpass och Fortsättning & Nybörjare.',sub_fortsattning_title:'Fortsättning',sub_fortsattning_desc:'Pass från nivå 2 och uppåt, inklusive sparring.',sub_barn_title:'Barn & Junior',sub_barn_desc:'Barnträning och Juniorpass.',sub_oppna_title:'Alla nivåer',sub_oppna_desc:'Pass du kan gå på oavsett hur länge du tränat — fys, lunch, morgon och boxning.',sub_class_one:'pass',sub_class_many:'pass',sub_modal_multi:'Du kan prenumerera på flera. Varje val läggs till som en egen kalender som du kan färgsätta och slå av och på var för sig.',sub_boxning_title:'Boxning',sub_boxning_desc:'Endast boxningspassen.',sub_nyborjare_title:'Nybörjarpass',sub_nyborjare_desc:'Endast nybörjarvänliga pass.',sub_subscribe_btn:'Prenumerera',sub_copy_btn:'Kopiera länk',sub_copied_btn:'Kopierat!',sub_modal_note:'Fungerar med Apple Kalender, Google Kalender och Outlook. På Apple/iPhone öppnar "Prenumerera" kalendern direkt. På Google/Outlook: klicka "Kopiera länk" och klistra in under "Lägg till kalender → Från URL".',schedule_loading:'Laddar schema...',schedule_alerts_btn:'Få avisering vid ändringar',alerts_modal_title:'FÅ AVISERING VID ÄNDRINGAR',alerts_modal_sub:'Du får bara ett mejl när något faktiskt ändras — inställt pass, ny tid, tillfälligt schema. Inget annat.',alerts_email_placeholder:'E-postadress',alerts_submit:'Prenumerera på aviseringar',alerts_sending:'Skickar...',alerts_sent:'Klart! Du får mejl vid ändringar.',alerts_error:'Något gick fel. Försök igen.',alerts_unset:'Aviseringar är inte aktiverade ännu.',alerts_note:'Du kan avsluta prenumerationen när du vill, en länk för det finns i varje mejl.',schedule_note:'Schemat uppdateras varje säsong.',schedule_full:'Se fullständigt schema →',memberships_label:'Priser',memberships_h2:'VÄLJ MEDLEMSKAP SOM PASSAR DIG',memberships_sub:'Flera betalningsalternativ och medlemskap för alla nivåer — hitta det som passar dig bäst.',memberships_tier1:'Mest populära medlemskap',mem2_check1:'Obegränsat antal pass',mem2_check2:'12 månaders bindningstid',mem2_check3:'Passar de flesta medlemmar',mem2_check4:'Enkel och smidig betalning',mem3_check1:'Obegränsat antal pass',mem3_check2:'6 månaders bindningstid',mem3_check3:'Flexibelt alternativ',mem3_check4:'Enkel och smidig betalning',mem4_check1:'För dig mellan 13–17 år',mem4_check2:'6 månaders bindningstid',mem4_check3:'Obegränsat antal pass',mem4_check4:'Rabatterat pris för ungdomar',mem5_check1:'10 pass utan slutdatum',mem5_check2:'Träna när det passar dig',mem5_check3:'Kan delas med en vän',mem6_check1:'Ett år i förskott',mem6_check2:'Obegränsat antal pass',mem6_check3:'Engångsbetalning',mem1_check1:'Prova ett pass',mem1_check2:'Utan att binda dig',mem1_check3:'Ingen utrustning behövs',memf1_title:'Tillgång till gymmet',memf1_text:'Träna på hög nivå med kvalitativ utrustning.',memf2_title:'Alla grupppass',memf2_text:'Delta på alla våra grupppass utan extra kostnad.',memf3_title:'Ingen registreringsavgift',memf3_text:'Du betalar ingen extra startavgift.',memf4_title:'Enkel hantering',memf4_text:'Hantera ditt medlemskap enkelt online.',mem_cta_q:'Söker du andra betalningsalternativ?',mem_cta_all:'Visa alla medlemskap →',mem_cta_secure:'🔒 Säker betalning via Gymcontrol',mem1_ribbon:'Prova på',mem1_title:'Provpass',mem1_price:'200 kr',mem1_desc:'Prova utan att binda dig.',mem2_ribbon:'Bäst värde',mem2_title:'Autogiro 12 mån',mem2_price:'649 kr / mån',mem2_desc:'Obegränsat. 12 mån.',mem3_ribbon:'Flexibelt',mem3_title:'Autogiro 6 mån',mem3_price:'699 kr / mån',mem3_desc:'Obegränsat. 6 mån.',mem4_ribbon:'Ungdom',mem4_title:'Junior',mem4_price:'599 kr / mån',mem4_desc:'Rabatterat för ungdomar.',mem5_ribbon:'10 pass',mem5_title:'Klippkort',mem5_price:'1 500 kr',mem5_desc:'10 pass utan slutdatum.',mem5_btn:'Köp klippkort →',mem6_ribbon:'Helår',mem6_title:'Årskort',mem6_price:'7 750 kr',mem6_desc:'Ett år i förskott.',mem6_btn:'Köp årskort →',join_gymcontrol:'Bli medlem →',mem_cta_text:'Osäker? Kom in på ett provpass för 200 kr.',corp_label:'För företag',corp_h2:'TRÄNA TILLSAMMANS. PRESTERA BÄTTRE.',corp_p1:'Skräddarsydda träningslösningar för företag och team.',corp_p2:'Morgonpass, teambuilding och gruppass.',corp_f1_title:'Morgonträning',corp_f1_text:'Kickstart dagen med träning, och ät frukost tillsammans efteråt om hungern slår till — innan arbetsdagen sätter igång.',corp_f2_title:'Teambuilding',corp_f2_text:'Svensexor, möhippor, födelsedags- och barnkalas, eller ett kul upplägg för kompisgänget.',corp_f4_title:'Gruppass',corp_f4_text:'Som engångsevent eller abonnemang, t.ex. en gång i veckan under hela terminer.',corp_f5_title:'Lokal & catering',corp_f5_text:'Vi hyr ut vår lokal och kan ordna catering till ert event.',corp_cta:'Boka företagsträning',corp_cta_note:'Skräddarsydd offert inom 24 timmar. Inga bindande avtal.',corp_read_more:'Läs mer om företagsträning →',kids_label:'Barn & junior',kids_h2:'TRÄNING FÖR UNGA UTÖVARE',kids_tabs_label:'Välj grupp',kids_tab_barn:'Barn 6–11 år',kids_tab_junior1:'Junior 12–14 år',kids_tab_junior2:'Junior 15–17 år',kids_p1:'Strukturerad träning med respekt och disciplin.',kids_p2:'Säker miljö med erfarna tränare.',kids_junior1_p1:'Fokus på att utveckla tekniker och längre kombinationer. Vi tar din kampsport till nästa nivå, och gör dig som vill redo att närma dig avancerad träning och sparring.',kids_junior1_p2:'Möjlighet att avancera mot tävling.',kids_p1_niva1:'Nivå 1: Fokus på grunderna – sparkar, slag och fotarbete, samt kondition, styrka och smidighet. Inga tidigare erfarenheter krävs. Vi tar hjälp av mitsar. 60 minuters pass med grundtekniker, enklare kombinationer och blockträning blandat med kortare fysträning och stretch.',kids_p1_niva2:'Nivå 2: Mindre lek och mer allvar. Tränar med mitsar och på olika sparringsituationer. 60 minuters pass med grundtekniker, avancerade kombinationer och blockträning blandat med kortare fysträning och stretch. Utöver vanliga passen får nivå 2 delta i sparring, men i väldigt kontrollerade former och med rätt utrustning.',kids_p1_equip:'Utrustning nivå 2: benskydd, tandskydd, handskar, hjälm och suspensoar. Hjälm och tandskydd är krav vid sparring.',kids_junior_equip:'Egna handskar, benskydd, suspensoar och lindor. Hjälm och tandskydd vid sparring.',kids_safety_note:'Gymmet arbetar aktivt för att säkerställa en trygg miljö för unga. Vi tillåter inte mobbning eller annat opassande beteende, och har löpande dialoger om respekt och kamratskap.',kids_junior2_p1:'Fokus på att utveckla tekniker och längre kombinationer. Vi tar din kampsport till nästa nivå, och gör dig som vill redo att närma dig avancerad träning och sparring.',kids_junior2_p2:'Möjlighet att avancera mot tävling.',kids_age1:'Barn 6–11 år',kids_age2:'Junior 12–14 år',kids_age3:'Terminskort',kids_age4:'Junior 15–17 år',kids_cta:'Anmäl ditt barn',kids_read_more:'Läs mer om barn & junior →',news_label:'Nyheter',news_h2:'SENASTE NYTT',news_teaser_link:'Se alla nyheter →',social_h2:'FRÅN GYMMET',social_ig:'Instagram →',social_fb:'Facebook →',social_tt:'TikTok →',contact_h2:'KONTAKT',contact_sub:'Välkommen till oss i Kungsholmen.',contact_addr_label:'Adress',contact_metro_label:'T-bana',contact_metro:'Rådhuset (Röda linjen)',contact_phone_label:'Telefon',contact_social_label:'Sociala medier',contact_hours_label:'Öppettider',contact_hours:'30 min innan första passet och 30 min efter sista',open_maps:'Öppna i Maps',footer_sub:'Stockholm · Kick- & Thaiboxning · Est. 2016',footer_nav:'Navigera',footer_contact:'Kontakt',footer_copy:'© Masters Gym Stockholm 2026',footer_built:'Built by Stormie Studios',banner_notice_prefix:'🚧 Sajt under uppbyggnad, framtagen av ',},en:{bot_greeting:'Quick help',nav_tagline:'Kickboxing & Muay Thai · Stockholm 2016',nav_about:'About',nav_classes:'Classes',nav_kids:'Kids & Junior',nav_schedule:'Schedule',nav_memberships:'Memberships',nav_corporate:'Corporate',nav_pt:'PT',nav_coaches:'Coaches',nav_news:'News',nav_contact:'Contact',nav_cta_trial:'Book trial class',nav_cta_member:'Join now',modal_title:'BOOK A TRIAL CLASS',modal_sub:'Try your first class for 200 SEK. We\'ll get back to you within 24 hours.',modal_schedule_hint_q:'Not sure when you can train?',modal_schedule_hint_link:'See the schedule here →',modal_name:'Your name',modal_email:'Email address',modal_phone:'Phone (optional)',modal_select:'Which class interests you?',modal_opt1:'Beginner class',modal_opt2:'Intermediate class',modal_opt3:'Boxing',modal_opt4:'Fitness class',modal_opt5:'Kids training',modal_opt6:'Corporate training',modal_opt7:"Not sure yet",modal_opt8:'PT session',modal_ref_placeholder:'How did you hear about us? (optional)',modal_ref1:'Instagram',modal_ref2:'Facebook',modal_ref3:'TikTok',modal_ref4:'Google',modal_ref5:'Friend or member',modal_ref6:'Walked by',modal_ref7:'Other',modal_submit:'Send request →',modal_note:'No commitment. No equipment needed.',modal_sent:"Sent! We'll be in touch soon.",hero_eyebrow:'Stockholm · Kungsholmen · Est. 2016',hero_everybody:'EVERYONE',hero_desc:'Kickboxing and Muay Thai for all levels. From beginner to world champion.',hero_corp_link:'Training for your company? See corporate packages →',scroll:'Scroll',mq1:'HARD WORK • RESPECT • COMMUNITY • EVERYONE IS EQUAL •',mq2:'MASTERS GYM STOCKHOLM • NORRA AGNEGATAN 36 • KUNGSHOLMEN • FOUNDED 2016 •',mq2_1:'MASTERS GYM STOCKHOLM',mq2_2:'NORRA AGNEGATAN 36',mq2_3:'KUNGSHOLMEN',mq2_4:'FOUNDED 2016',values_label:'Our values',values_h2:'DISCIPLINE.\nRESPECT.\nCOMMUNITY.',val1_title:'HARD WORK',val1_text:'No matter your goal, we help you achieve it.',val2_title:'RESPECT',val2_text:'Everyone is welcome regardless of background.',val3_title:'COMMUNITY',val3_text:'Come and make friends for life.',about_bar:'MASTERS GYM · STOCKHOLM · 2016',about_label:'About Masters Gym',about_h2:'MORE THAN A GYM',about_tagline:'"See you soon, champion!"',about_p1:'Founded in 2016 in Kungsholmen. Named best club by the Swedish Kickboxing Federation in 2017 and 2018.',about_p2:"Some of Sweden's best coaches. Sofia is a national team fighter.",about_p3:'Norra Agnegatan 36, 10 min from Central Station. Metro: Rådhuset.',stat1:'Founded',stat2:'Best club',stat3_num:'All',stat3:'Levels welcome',test1_quote:'"Masters Gym is like my second family."',test1_author:'— Member',test2_quote:'"My son wishes there was kids training every day."',test2_author:'— Mother of one of our youngest',reviews_label:'Reviews',reviews_h2:'WHAT OUR MEMBERS SAY',reviews_sub:'Real voices from the gym, straight from Google.',reviews_rating_suffix:'· 83 reviews on Google',reviews_swipe_hint:'Swipe for more reviews',reviews_cta:'Write a review on Google →',faq_label:'FAQ',faq_h2:'FAQ',faq_sub:'Answers to what you\'re wondering before you step in for the first time.',faq_q1:'Do I need to be in shape to start?',faq_a1_pre:'No. ',faq_a1_link:'Every class',faq_a1_post:' is built to work no matter where you\'re starting from. We adjust pace and intensity to the group, not the other way around.',faq_q2:'Do I have to spar?',faq_a2:'No, sparring is always optional and only happens in groups where it\'s relevant, with the right protective gear.',faq_q4:'Can I borrow equipment the first time?',faq_a4_pre:'Yes, for your ',faq_a4_link:'trial class',faq_a4_post:' we provide gloves and everything you need to try it out for real.',faq_q5:'What ages does kids training cover?',
faq_q6:"I've never trained a combat sport, can I still start here?",
faq_a6:"Absolutely. Beginner classes are built for exactly that, we start with the basics (punches, kicks, footwork) and build from there. You don't need to know anything before your first class.",
faq_q7:"What's the difference between Muay Thai and kickboxing?",
faq_a7:'Both are standing combat sports with punches, kicks and footwork. Muay Thai also includes knees, elbows and clinch. As a beginner you don\'t need to know the difference, you\'ll find your style along the way.',
faq_q8:'How is combat sport training different from a regular gym session?',
faq_a8:"At a regular gym you often train one muscle group at a time. In combat sports your whole body works together, balance, coordination and timing, so you build fitness and a real skill at the same time.",
faq_a5_pre:'See the ',faq_a5_post:' page for the full age breakdown and levels.',coach_bar:'MASTERS GYM · HEAD COACH',coach_label:'Head Coach',coach_text:'Thamer is the head coach with an impressive international record.',coach_quote:'"I love kickboxing. It builds confidence and friends for life!"',ct1:'Iraq Champion',ct2:'Arabian Champion',ct3:'Fighter of the Year',ct4:'World Cup Champion — Pro Muay Thai',ct5:'World Cup Champion — Amateur Kickboxing',ct6:'Master of Muay Thai (Ajarn)',coach_intl:'International competitions in Thailand, Ukraine, Italy, Serbia and more.',coaches_link:'Meet all coaches →',coaches_label:'Coaches',coaches_h2:'OUR TEAM',coaches_read_more:'Meet the whole coaching team →',coach_badge_head:'Head Coach',coach_badge_coach:'Coach',coach_role_thamer:'Founder & Head Coach',coach_bio_thamer:'Founder with an impressive international record.',coach_role_andy:'Kickboxing & Muay Thai',coach_bio_andy:'Andy has trained since 2011. Andy teaches the lunch class as well as the beginner class, often in a Muay Thai style.',coach_role_christian:'Coach',coach_bio_christian:'Has been training for as long as we can remember! These days Cribba has hung up his competition gloves but still teaches the lunch class at Masters Gym.',coach_role_tanja:'Beginner & fitness classes',coach_bio_tanja:'Tanja has trained kickboxing since 2010 and has been a coach at Masters Gym since 2022. Tanja teaches both beginner and fitness classes.',coach_role_joonas:'Kids Training & Morning Class',coach_bio_joonas:'Joonas has been one of Masters Gym\'s kids coaches since 2014 and also coaches the morning class. A dedicated and experienced coach for our youngest athletes.',fight_label:'Competition',fight_h2:'EVENT',event_upcoming_label:'Upcoming',event_tba:'Date to be announced',event_img_placeholder:'Photo coming soon',classes_label:'Training',classes_h2:'OUR CLASSES',classes_intro:'At Masters Gym, recreational members train side by side with active, high-level fighters. The club has been named "Best Club", and our fighters have won several medals.',sched_teaser_label:'Schedule',sched_teaser_h2:'NEXT UP',sched_teaser_full:'View full schedule',timeline_h1:'Your path forward',timeline_h2:'Classes for everyone',dropin_intro:'We offer training that fits everyday life, whatever your goal or schedule.',timeline_more:'More information',path1_title:'Beginner class',path1_text:'The fundamentals. Everyone starts here, no experience needed.',path2_title:'Intermediate class',path2_text:'Once level 1 & 2 are complete. Tactics, technique and sparring.',path3_title:'Competition group',path3_text:'By invitation from the head coach, for those who want to compete.',finder_title:'Find the right training for you',finder_sub:'Choose the option that fits you best.',finder_q1:'Completely new to kickboxing or Muay Thai',finder_q2:'Has trained martial arts before',finder_q3:'Want to compete',finder_q4:'Want personal training',finder_q5:'Wants to stay active',finder_q6:'Want to train with my company',finder_q7:'Looking for training for my child',finder_next:'Next session:',finder_r1_title:'Beginner class',finder_r1_text:'The perfect start. We go through the fundamentals together, no experience needed.',finder_r2_title:'Intermediate class',finder_r2_text:'Book a trial class and the coach will place you in the right group based on your experience.',finder_r3_title:'Competition group',finder_r3_text:'The competition group is decided by the head coach. Get in touch and let\'s talk about your goals.',finder_r3_cta:'Get in touch',finder_r4_title:'PT with Thamer',finder_r4_text:'Tailored training from beginner to elite level, at your own pace.',finder_r5_title:'Boxing, Fitness Class or Morning/Lunch',finder_r5_text:'Drop-in training for all levels, no competition. Boxing is shown here, but Fitness Class and Morning/Lunch fit just as well.',finder_all_link:'See all classes',class1_tag:'Level 1 & 2 · All welcome',class1_title:'BEGINNER CLASS',class1_tagline:'The fundamentals of kickboxing and Muay Thai. No experience needed.',class2_tagline:'Longer combinations, technical development and sparring.',class3_tagline:'For those who want to compete. Selected by the head coach.',class4_tagline:'Functional training for the whole body. You will sweat!',class5_tagline:'Tailored training from beginner to elite level.',class6_tagline:'Pure boxing classes with a focus on technique. Recreational, not competitive.',class7_tagline:'Training that fits into a busy work schedule.',class1_text:'Everyone curious about kickboxing and Muay Thai is welcome – no previous experience required. You\'ll learn the fundamentals of punches, kicks and technique while building conditioning, coordination and confidence. Training combines technique, simple combinations and short conditioning drills.',class1_format:'60 minutes of fundamental techniques, pad work and stretching.',class1_equip:'Gloves are available to borrow. When you\'re ready for the next step, we recommend hand wraps for extra support, available to buy at reception. We\'re happy to show you how to use them.',class2_tag:'Min. 2 terms',class2_title:'INTERMEDIATE CLASS',class2_text:'Once you have completed level 1 and 2 of the beginner classes, you are ready to move on to the intermediate group. In the intermediate classes we focus on tactics, technique and sparring under the coach\'s full control.',class2_text2:'At this level we develop technique further by training longer combinations of punches, kicks and knees. We work more on timing, distance, movement and defence, while the pace increases. You will also learn to read your opponent, create openings and use techniques in different situations.',class2_format:'60-minute sessions with techniques and more advanced combinations on pads, sparring drills, light free sparring, mixed with conditioning and stretching.',class2_equip:'Own gloves, shin guards and hand wraps required. Mouth guard, headgear and groin guard for sparring.',class3_tag:'By invitation',class3_title:'COMPETITION GROUP',class3_text:'It is the head coach who decides who joins the competition group. Talk to Thamer and find out how you can best reach your goals of competing and becoming part of the Masters Gym competition team.',class3_equip:'',class4_tag:'All levels',class4_title:'FITNESS CLASS',class4_text:'The fitness classes are a complement to the other classes, designed to improve strength and conditioning. These are circuit-style classes with mixed stations. All levels are welcome.',class4_equip:'Training is done barefoot. Bring light clothing, a small towel and a water bottle.',class5_tag:'Personal training',class5_title:'PT WITH THAMER',class6_tag:'All levels',class6_title:'BOXING',class7_tag:'All levels',class7_title:'MORNING/LUNCH',class5_text:'Amateur to elite. Book via contact form.',class6_text:'Pure boxing classes with a strong focus on technique. Open to all levels, geared towards recreational training rather than competition.',class7_text:'The perfect classes for fitting training into a busy work schedule. Both the morning and lunch classes are for all levels who want tough training.',pt1_label:'1 hour',pt2_label:'5 × 1 hour',pt3_label:'10 × 1 hour',pt_kids_label:'PT for kids',pt_pricing_heading:'Pricing',pt_price_toggle:'See pricing',pt4_label:'1 hour',pt5_label:'5 × 1 hour',pt6_label:'10 × 1 hour',pt_cta:'Book PT session',pt_cta_card:'Book a PT hour',pt_contact_cta:'Contact Thamer',pt_read_more:'Learn more & see pricing →',pt_value:'Train with a world champion and head coach at Masters Gym. Tailored training from beginner to elite level.',pt_check1:'Learn faster',pt_check2:'Prepare for competition',pt_check3:'Get in shape',pt_check4:'Improve your technique',book_trial:'Book trial class',book_arrow:'Book →',schedule_h2:'SCHEDULE',schedule_intro:'Add the schedule to your calendar once — changes, new classes and new times appear on their own.',schedule_subscribe_btn:'Subscribe to schedule',schedule_swipe_hint:'Swipe for more days',sub_modal_title:'SUBSCRIBE TO THE SCHEDULE',sub_modal_sub:'If anything in the schedule changes — a new time, a new class, something cancelled — it updates automatically in your calendar. You never have to check the site to know what\'s on.',sub_full_title:'Full schedule',sub_full_desc:'The whole schedule, always current — without you having to think about it.',sub_nyborjare_title:'Beginners',sub_nyborjare_desc:'Beginner classes and Intermediate & Beginner.',sub_fortsattning_title:'Intermediate',sub_fortsattning_desc:'Level 2 and above, sparring included.',sub_barn_title:'Kids & Juniors',sub_barn_desc:'Kids and junior classes.',sub_oppna_title:'All levels',sub_oppna_desc:'Classes you can join no matter how long you have trained — conditioning, lunch, morning and boxing.',sub_class_one:'class',sub_class_many:'classes',sub_modal_multi:'You can subscribe to several. Each one is added as its own calendar, so you can colour them and turn them on and off separately.',sub_boxning_title:'Boxing',sub_boxning_desc:'Boxing classes only.',sub_nyborjare_title:'Beginner classes',sub_nyborjare_desc:'Beginner-friendly classes only.',sub_subscribe_btn:'Subscribe',sub_copy_btn:'Copy link',sub_copied_btn:'Copied!',sub_modal_note:'Works with Apple Calendar, Google Calendar and Outlook. On Apple/iPhone, "Subscribe" opens your calendar directly. On Google/Outlook: click "Copy link" and paste it under "Add calendar → From URL".',schedule_loading:'Loading schedule...',schedule_alerts_btn:'Get notified of changes',alerts_modal_title:'GET NOTIFIED OF CHANGES',alerts_modal_sub:"You'll only get an email when something actually changes — a cancelled class, a new time, a temporary schedule. Nothing else.",alerts_email_placeholder:'Email address',alerts_submit:'Subscribe to alerts',alerts_sending:'Sending...',alerts_sent:"Done! You'll get an email when something changes.",alerts_error:'Something went wrong. Please try again.',alerts_unset:'Alerts are not set up yet.',alerts_note:'You can unsubscribe anytime — a link is included in every email.',schedule_note:'Schedule changes each season.',schedule_full:'View full schedule →',memberships_label:'Pricing',memberships_h2:'CHOOSE THE MEMBERSHIP THAT FITS YOU',memberships_sub:'Multiple payment options and memberships for every level — find what works best for you.',memberships_tier1:'Most popular memberships',mem2_check1:'Unlimited classes',mem2_check2:'12-month commitment',mem2_check3:'Fits most members',mem2_check4:'Easy, smooth payment',mem3_check1:'Unlimited classes',mem3_check2:'6-month commitment',mem3_check3:'A flexible option',mem3_check4:'Easy, smooth payment',mem4_check1:'For ages 13–17',mem4_check2:'6-month commitment',mem4_check3:'Unlimited classes',mem4_check4:'Discounted rate for youth',mem5_check1:'10 sessions, no expiry',mem5_check2:'Train on your own schedule',mem5_check3:'Can be shared with a friend',mem6_check1:'One year, paid upfront',mem6_check2:'Unlimited classes',mem6_check3:'One-time payment',mem1_check1:'Try a single class',mem1_check2:'No commitment',mem1_check3:'No equipment needed',memf1_title:'Access to the gym',memf1_text:'Train at a high level with quality equipment.',memf2_title:'All group classes',memf2_text:'Join any of our group classes at no extra cost.',memf3_title:'No registration fee',memf3_text:'You pay no extra sign-up fee.',memf4_title:'Easy management',memf4_text:'Manage your membership easily online.',mem_cta_q:'Looking for other payment options?',mem_cta_all:'View all memberships →',mem_cta_secure:'🔒 Secure payment via Gymcontrol',mem1_ribbon:'Trial',mem1_title:'Trial class',mem1_price:'200 SEK',mem1_desc:'Try a class with no commitment.',mem2_ribbon:'Best value',mem2_title:'Direct debit 12 mo',mem2_price:'649 SEK / mo',mem2_desc:'Unlimited. 12-month commitment.',mem3_ribbon:'Flexible',mem3_title:'Direct debit 6 mo',mem3_price:'699 SEK / mo',mem3_desc:'Unlimited. 6-month commitment.',mem4_ribbon:'Youth',mem4_title:'Junior',mem4_price:'599 SEK / mo',mem4_desc:'Discounted for young athletes.',mem5_ribbon:'10 classes',mem5_title:'Class pack',mem5_price:'1 500 SEK',mem5_desc:'10 classes, no expiry.',mem5_btn:'Buy class pack →',mem6_ribbon:'Full year',mem6_title:'Annual pass',mem6_price:'7 750 SEK',mem6_desc:'Pay upfront and save.',mem6_btn:'Buy annual pass →',join_gymcontrol:'Join now →',mem_cta_text:'Not sure? Come in for a trial class for 200 SEK.',corp_label:'For companies',corp_h2:'TRAIN TOGETHER. PERFORM BETTER.',corp_p1:'Tailored training solutions for companies and teams.',corp_p2:'Morning sessions, team building and group classes.',corp_f1_title:'Morning training',corp_f1_text:'Kickstart the day with training, and grab breakfast together afterwards if you\'re hungry — before the work day begins.',corp_f2_title:'Team building',corp_f2_text:'Stag dos, hen parties, birthdays and kids\' parties, or a fun day out for a group of friends.',corp_f4_title:'Group classes',corp_f4_text:'As a one-off event or a subscription, e.g. once a week for a full term.',corp_f5_title:'Venue & catering',corp_f5_text:'We rent out our venue and can arrange catering for your event.',corp_cta:'Book corporate training',corp_cta_note:'Custom quote within 24 hours. No binding contracts.',corp_read_more:'Learn more about corporate training →',kids_label:'Kids & junior',kids_h2:'TRAINING FOR YOUNG ATHLETES',kids_tabs_label:'Choose group',kids_tab_barn:'Kids 6–11 years',kids_tab_junior1:'Junior 12–14 years',kids_tab_junior2:'Junior 15–17 years',kids_p1:'Structured training with respect and discipline.',kids_p2:'Safe environment with experienced coaches.',kids_junior1_p1:'Focus on developing technique and longer combinations. We take your martial art to the next level, getting you ready for more advanced training and sparring.',kids_junior1_p2:'Opportunity to advance towards competition.',kids_p1_niva1:'Level 1: Focus on the fundamentals – kicks, punches and footwork, plus conditioning, strength and mobility. No previous experience required. We use pad work. 60-minute sessions with fundamental techniques, simple combinations and blocking drills mixed with short conditioning and stretching.',kids_p1_niva2:'Level 2: Less play, more focus. Trains with pads and various sparring situations. 60-minute sessions with fundamental techniques, advanced combinations and blocking drills mixed with short conditioning and stretching. Beyond the regular classes, level 2 also takes part in sparring, in a very controlled format and with the right equipment.',kids_p1_equip:'Level 2 equipment: shin guards, mouth guard, gloves, headgear and groin guard. Headgear and mouth guard are required for sparring.',kids_junior_equip:'Own gloves, shin guards, groin guard and hand wraps. Headgear and mouth guard for sparring.',kids_safety_note:'The gym actively works to ensure a safe environment for young people. We do not tolerate bullying or other inappropriate behaviour, and we have ongoing conversations about respect and camaraderie.',kids_junior2_p1:'Focus on developing technique and longer combinations. We take your martial art to the next level, getting you ready for more advanced training and sparring.',kids_junior2_p2:'Opportunity to advance towards competition.',kids_age1:'Kids 6–11 years',kids_age2:'Junior 12–14 years',kids_age3:'Term passes',kids_age4:'Junior 15–17 years',kids_cta:'Register your child',kids_read_more:'Learn more about kids & junior →',news_label:'News',news_h2:'LATEST NEWS',news_teaser_link:'See all news →',social_h2:'FROM THE GYM',social_ig:'Instagram →',social_fb:'Facebook →',social_tt:'TikTok →',contact_h2:'CONTACT',contact_sub:'Come train with us in Kungsholmen.',contact_addr_label:'Address',contact_metro_label:'Metro',contact_metro:'Rådhuset (Red line)',contact_phone_label:'Phone',contact_social_label:'Social media',contact_hours_label:'Opening hours',contact_hours:'30 min before first class and 30 min after last',open_maps:'Open in Maps',footer_sub:'Stockholm · Kickboxing & Muay Thai · Est. 2016',footer_nav:'Navigate',footer_contact:'Contact',footer_copy:'© Masters Gym Stockholm 2026',footer_built:'Built by Stormie Studios',banner_notice_prefix:'🚧 Site under construction, built by ',}};

try{
  const backToTop=document.getElementById('backToTop');
  if(backToTop){
    let visible=false;
    function updateBackToTop(){
      const shouldShow=window.scrollY>600;
      if(shouldShow!==visible){
        backToTop.classList.toggle('visible',shouldShow);
        visible=shouldShow;
      }
    }
    window.addEventListener('scroll',updateBackToTop,{passive:true});
    updateBackToTop();
    backToTop.addEventListener('click',()=>{
      const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finderEl=document.getElementById('finder');
      let targetY=0;
      if(finderEl){
        const finderBottom=finderEl.getBoundingClientRect().bottom+window.scrollY;
        const journeyThreshold=finderBottom+window.innerHeight;
        // Still early in the journey (just past the finder, not yet deep into the
        // page): help the user return to the class-picker instead of the hero.
        if(window.scrollY<journeyThreshold){
          targetY=finderEl.getBoundingClientRect().top+window.scrollY-90; // clears the fixed navbar
        }
      }
      window.scrollTo({top:Math.max(targetY,0),behavior:reduceMotion?'auto':'smooth'});
    });
  }
}catch(err){console.error('Back to top button failed to initialize, rest of page unaffected:',err);}

let currentLang='sv';
try{
  const dropinCards=document.getElementById('dropinCards');
  const dropinDots=document.getElementById('dropinDots');
  const dropinPrev=document.getElementById('dropinPrev');
  const dropinNext=document.getElementById('dropinNext');
  if(dropinCards&&dropinDots){
    const cards=Array.from(dropinCards.children);
    dropinDots.innerHTML=cards.map((_,i)=>`<span data-i${i}="${i}"${i===0?' class="active"':''}></span>`).join('');
    const dots=Array.from(dropinDots.children);

    function cardStep(){
      const card=cards[0];
      return card.getBoundingClientRect().width+14; // matches .dropin-cards gap
    }
    function setActiveDot(idx){
      dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
    }
    function nearestIndex(){
      const step=cardStep();
      return Math.round(dropinCards.scrollLeft/step);
    }
    let scrollTimer=null;
    dropinCards.addEventListener('scroll',()=>{
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>setActiveDot(nearestIndex()),80);
    });
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{
      dropinCards.scrollTo({left:i*cardStep(),behavior:'smooth'});
    }));
    if(dropinPrev)dropinPrev.addEventListener('click',()=>{
      dropinCards.scrollBy({left:-cardStep(),behavior:'smooth'});
    });
    if(dropinNext)dropinNext.addEventListener('click',()=>{
      dropinCards.scrollBy({left:cardStep(),behavior:'smooth'});
    });
  }
}catch(err){console.error('Dropin carousel failed to initialize, rest of page unaffected:',err);}

function toggleLang(){
  currentLang=currentLang==='sv'?'en':'sv';
  const legacyLangBtn=document.getElementById('lang-btn');
  if(legacyLangBtn)legacyLangBtn.textContent=currentLang==='sv'?'EN':'SV';
  document.documentElement.lang=currentLang;
  applyTranslations();
}
function applyTranslations(){
  const t=translations[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');if(t[key]===undefined)return;
    if((el.tagName==='H2'||el.tagName==='H1')&&t[key].includes('\n')){el.innerHTML=t[key].replace(/\n/g,'<br>');}
    else{el.textContent=t[key];}
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const key=el.getAttribute('data-i18n-placeholder');if(t[key]!==undefined)el.placeholder=t[key];});
  const select=document.getElementById('modal-select');
  if(select){select.querySelectorAll('option[data-i18n]').forEach(opt=>{const key=opt.getAttribute('data-i18n');if(t[key]!==undefined)opt.textContent=t[key];});}
}

try{
  const kidsTabs=['barn','junior1','junior2'];
  document.querySelectorAll('.kids-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.kids-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const targetId='kids-panel-'+tab.dataset.tab;
      const panels=Array.from(document.querySelectorAll('.kids-panel'));
      const currentActive=panels.find(p=>p.classList.contains('active'));
      panels.forEach(p=>{
        p.classList.remove('prev');
        if(p===currentActive&&p.id!==targetId)p.classList.add('prev');
      });
      panels.forEach(p=>p.classList.toggle('active',p.id===targetId));
      setTimeout(()=>{panels.forEach(p=>{if(p.classList.contains('prev'))p.classList.remove('prev');});},800);
    });
  });
}catch(err){console.error('Kids tab transition failed, rest of page unaffected:',err);}

// EVENT CAROUSEL — slide with arrows
(function(){
  const track=document.getElementById('eventTrack');
  if(!track)return;
  const cards=Array.from(track.children);
  const prevBtn=document.getElementById('eventPrev');
  const nextBtn=document.getElementById('eventNext');
  let index=0;
  function visibleCount(){return window.innerWidth<=768?1:3;}
  function update(){
    const visible=visibleCount();
    const maxIndex=Math.max(0,cards.length-visible);
    index=Math.min(index,maxIndex);
    const gap=20;
    const cardWidth=cards[0].getBoundingClientRect().width;
    track.style.transform='translateX(-'+(index*(cardWidth+gap))+'px)';
    prevBtn.disabled=index===0;
    nextBtn.disabled=index===maxIndex;
  }
  prevBtn.addEventListener('click',()=>{index=Math.max(0,index-1);update();});
  nextBtn.addEventListener('click',()=>{const visible=visibleCount();const maxIndex=Math.max(0,cards.length-visible);index=Math.min(maxIndex,index+1);update();});
  document.addEventListener('keydown',e=>{
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    const tag=document.activeElement&&document.activeElement.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    const rect=track.getBoundingClientRect();
    if(rect.bottom<0||rect.top>window.innerHeight)return;
    if(e.key==='ArrowLeft')prevBtn.click();
    if(e.key==='ArrowRight')nextBtn.click();
  });
  window.addEventListener('resize',update);
  update();
})();

// TIMELINE — next-session badges pulled from live schedule data
try{(function(){
  const CARD_KEYWORDS=['nybörjar','fortsättning',null,'boxning','fys','morgon',null];
  const CARD_STATIC_TIME=[null,null,'Bestäms individuellt',null,null,null,'Efter överenskommelse'];

  function findNextSession(keyword){
    if(!keyword||typeof scheduleData==='undefined'||!scheduleData.days||!scheduleData.days.length)return null;
    const kw=keyword.toLowerCase();
    const dayNames=['söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'];
    const todayIdx=new Date().getDay();
    const orderedDays=scheduleData.days.slice().sort((a,b)=>{
      const ai=dayNames.indexOf((a||'').toLowerCase());
      const bi=dayNames.indexOf((b||'').toLowerCase());
      const aOffset=ai>=0?(ai-todayIdx+7)%7:99;
      const bOffset=bi>=0?(bi-todayIdx+7)%7:99;
      return aOffset-bOffset;
    });
    for(const day of orderedDays){
      const rows=scheduleData.byDay[day]||[];
      for(const r of rows){
        const pass=(r.Pass||'').toLowerCase();
        if(kw==='boxning'){
          if(pass.includes('boxning')&&!pass.includes('kick')&&!pass.includes('thai'))return{day,time:r.Tid};
        }else if(pass.includes(kw)){
          return{day,time:r.Tid};
        }
      }
    }
    return null;
  }

  function populateTimelineNext(){
    if(typeof scheduleData==='undefined'||!scheduleData.days||!scheduleData.days.length){
      console.warn('[schedule-debug] scheduleData not loaded yet at this attempt.');
      return;
    }
    console.log('[schedule-debug] scheduleData.days:',scheduleData.days);
    const allPassValues=[];
    scheduleData.days.forEach(day=>{(scheduleData.byDay[day]||[]).forEach(r=>allPassValues.push(day+' | '+r.Pass+' | '+r.Tid));});
    console.log('[schedule-debug] All rows (day | Pass | Tid):',allPassValues);
    for(let i=0;i<CARD_KEYWORDS.length;i++){
      const item=document.getElementById('tl-'+i);
      if(!item)continue;
      const badge=item.querySelector('.timeline-next');
      if(!badge)continue;
      const keyword=CARD_KEYWORDS[i];
      const session=keyword?findNextSession(keyword):null;
      if(session){
        badge.textContent=session.day+' '+session.time;
        console.log('[schedule-debug] card '+i+' (keyword: '+keyword+') MATCHED:',session);
      }else if(CARD_STATIC_TIME[i]){
        badge.textContent=CARD_STATIC_TIME[i];
      }else if(keyword){
        console.warn('[schedule-debug] card '+i+' (keyword: "'+keyword+'") found NO match in any row above.');
      }
    }
  }

  populateTimelineNext();
  setTimeout(populateTimelineNext,1800);
})();}catch(err){console.error('Timeline next-session population failed, rest of page unaffected:',err);}

try{
  const tl0Btn=document.getElementById('tl0-expand-btn');
  const tl0Body=document.getElementById('tl0-expand-body');
  if(tl0Btn&&tl0Body){
    tl0Btn.addEventListener('click',()=>{
      const isOpen=tl0Body.classList.toggle('open');
      tl0Btn.setAttribute('aria-expanded',String(isOpen));
    });
  }
  const tl1Btn=document.getElementById('tl1-expand-btn');
  const tl1Body=document.getElementById('tl1-expand-body');
  if(tl1Btn&&tl1Body){
    tl1Btn.addEventListener('click',()=>{
      const isOpen=tl1Body.classList.toggle('open');
      tl1Btn.setAttribute('aria-expanded',String(isOpen));
    });
  }
  const founderBtn=document.getElementById('founder-expand-btn');
  const founderBody=document.getElementById('founder-expand-body');
  if(founderBtn&&founderBody){
    founderBtn.addEventListener('click',()=>{
      const isOpen=founderBody.classList.toggle('open');
      founderBtn.setAttribute('aria-expanded',String(isOpen));
    });
  }
  const ptPriceBtn=document.getElementById('pt-price-expand-btn');
  const ptPriceBody=document.getElementById('pt-price-expand-body');
  if(ptPriceBtn&&ptPriceBody){
    ptPriceBtn.addEventListener('click',()=>{
      const isOpen=ptPriceBody.classList.toggle('open');
      ptPriceBtn.setAttribute('aria-expanded',String(isOpen));
    });
  }
}catch(err){console.error('Timeline expand toggle failed, rest of page unaffected:',err);}


// ── TESTIMONIALS CAROUSEL ──
try{(function(){
  const track=document.getElementById('testimonialsTrack');
  const dotsWrap=document.getElementById('testimonialsDots');
  if(!track||!dotsWrap)return;
  const slides=Array.from(track.querySelectorAll('.testimonial-slide'));
  if(!slides.length)return;

  const prefersReducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current=0;
  let autoplayTimer=null;
  let resumeTimer=null;

  slides.forEach((s,i)=>{
    const dot=document.createElement('span');
    if(i===0)dot.classList.add('active');
    dot.addEventListener('click',()=>{goTo(i);pauseThenResume();});
    dotsWrap.appendChild(dot);
  });
  const dots=Array.from(dotsWrap.children);

  function render(){
    slides.forEach((s,i)=>{
      s.classList.remove('active','prev');
      if(i===current)s.classList.add('active');
      else if(i===(current-1+slides.length)%slides.length)s.classList.add('prev');
    });
    dots.forEach((d,i)=>d.classList.toggle('active',i===current));
  }

  function goTo(i){
    current=((i%slides.length)+slides.length)%slides.length;
    render();
  }
  function next(){goTo(current+1);}
  function prev(){goTo(current-1);}

  function startAutoplay(){
    if(prefersReducedMotion)return;
    clearInterval(autoplayTimer);
    autoplayTimer=setInterval(next,8000);
  }
  function stopAutoplay(){
    clearInterval(autoplayTimer);
  }
  function pauseThenResume(){
    stopAutoplay();
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(startAutoplay,5000);
  }

  // Swipe / drag support — pauses autoplay during interaction, resumes after
  let dragStartX=0,dragging=false;
  track.addEventListener('pointerdown',e=>{
    dragStartX=e.clientX;dragging=true;
    stopAutoplay();
    try{track.setPointerCapture(e.pointerId);}catch(e2){}
  });
  track.addEventListener('pointerup',e=>{
    if(!dragging)return;dragging=false;
    const dx=e.clientX-dragStartX;
    if(Math.abs(dx)>40){
      if(dx<0)next();else prev();
    }
    pauseThenResume();
  });
  track.addEventListener('pointercancel',()=>{dragging=false;pauseThenResume();});

  render();
  startAutoplay();
})();}catch(err){console.error('Testimonials carousel failed to initialize, rest of page unaffected:',err);}


// ── REUSABLE MOBILE CAROUSEL (one card at a time, autoplay, swipe, dots) ──
function initMobileCarousel(gridId,dotsId,cardSelector){
  try{
    const isMobile=window.matchMedia&&window.matchMedia('(max-width:768px)').matches;
    if(!isMobile)return;

    const grid=document.getElementById(gridId);
    const dotsWrap=document.getElementById(dotsId);
    if(!grid||!dotsWrap)return;
    const cards=Array.from(grid.querySelectorAll(cardSelector));
    if(!cards.length)return;
    grid.style.touchAction='pan-y';
    grid.style.cursor='grab';

    const prefersReducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current=0;
    let autoplayTimer=null;
    let resumeTimer=null;

    cards.forEach((c,i)=>{
      const dot=document.createElement('span');
      if(i===0)dot.classList.add('active');
      dot.addEventListener('click',()=>{goTo(i);pauseThenResume();});
      dotsWrap.appendChild(dot);
    });
    const dots=Array.from(dotsWrap.children);

    function render(){
      cards.forEach((c,i)=>{
        c.classList.remove('active','prev');
        if(i===current)c.classList.add('active');
        else if(i===(current-1+cards.length)%cards.length)c.classList.add('prev');
      });
      dots.forEach((d,i)=>d.classList.toggle('active',i===current));
    }

    function goTo(i){
      current=((i%cards.length)+cards.length)%cards.length;
      render();
    }
    function next(){goTo(current+1);}
    function prev(){goTo(current-1);}

    function startAutoplay(){
      if(prefersReducedMotion)return;
      clearInterval(autoplayTimer);
      autoplayTimer=setInterval(next,8000);
    }
    function stopAutoplay(){clearInterval(autoplayTimer);}
    function pauseThenResume(){
      stopAutoplay();
      clearTimeout(resumeTimer);
      resumeTimer=setTimeout(startAutoplay,5000);
    }

    let dragStartX=0,dragging=false;
    grid.addEventListener('pointerdown',e=>{
      dragStartX=e.clientX;dragging=true;
      stopAutoplay();
      try{grid.setPointerCapture(e.pointerId);}catch(e2){}
    });
    grid.addEventListener('pointerup',e=>{
      if(!dragging)return;dragging=false;
      const dx=e.clientX-dragStartX;
      if(Math.abs(dx)>40){
        if(dx<0)next();else prev();
      }
      pauseThenResume();
    });
    grid.addEventListener('pointercancel',()=>{dragging=false;pauseThenResume();});

    render();
    startAutoplay();
  }catch(err){console.error('Mobile carousel ('+gridId+') failed to initialize, rest of page unaffected:',err);}
}
initMobileCarousel('membershipsFeatured','membershipsFeaturedDots','.membership-card');
initMobileCarousel('membershipsSecondary','membershipsSecondaryDots','.membership-card');


// ── COACHES 3D CAROUSEL ──
(function(){
  var COACHES_SV = [
    {name:'THAMER',discipline:'Grundare & Head Coach',bio:'Grundare av Masters Gym med imponerande internationell meritlista — Iraq Champion, Arabian Champion och World Cup 2003. Ajarn sedan 2009.',img:'IMG_8269_2.jpg',badge:'Head Coach'},
    {name:'ANDY',discipline:'Kickboxning & Thaiboxning',bio:'Andy har tränat sedan 2011. Andy håller i lunchpass samt nybörjarpass, ofta med thaistil.',img:'Coach-Andy.jpg',badge:'Coach'},
    {name:'CHRISTIAN',discipline:'Instruktör',bio:'Har tränat så länge vi kan minnas! Idag har Cribba lagt tävlandet på hyllan men håller lunchpass på Masters Gym.',img:'Coach-Christian.jpg',badge:'Coach'},
    {name:'TANJA',discipline:'Nybörjar- & fyspass',bio:'Tanja har tränat kickboxning sedan 2010 och varit coach på Masters Gym sedan 2022. Tanja håller både nybörjar- och fyspass.',img:'Coach-Tanja.jpg',badge:'Coach'},
    {name:'JOONAS',discipline:'Barnträning & morgonpass',bio:'Joonas är en av Masters Gyms barnledare sedan 2014 och coachar även morgonpasset. Engagerad och erfaren tränare för våra yngsta utövare.',img:'Coach-Joonas.jpg',badge:'Coach'}
  ];
  var COACHES_EN = [
    {name:'THAMER',discipline:'Founder & Head Coach',bio:'Founder of Masters Gym with an impressive international record — Iraq Champion, Arabian Champion and World Cup 2003. Ajarn since 2009.',img:'IMG_8269_2.jpg',badge:'Head Coach'},
    {name:'ANDY',discipline:'Kickboxing & Muay Thai',bio:'Andy has trained since 2011. Andy teaches the lunch class as well as the beginner class, often in a Muay Thai style.',img:'Coach-Andy.jpg',badge:'Coach'},
    {name:'CHRISTIAN',discipline:'Coach',bio:'Has been training for as long as we can remember! These days Cribba has hung up his competition gloves but still teaches the lunch class at Masters Gym.',img:'Coach-Christian.jpg',badge:'Coach'},
    {name:'TANJA',discipline:'Beginner & fitness classes',bio:'Tanja has trained kickboxing since 2010 and has been a coach at Masters Gym since 2022. Tanja teaches both beginner and fitness classes.',img:'Coach-Tanja.jpg',badge:'Coach'},
    {name:'JOONAS',discipline:'Kids Training & Morning Class',bio:'Joonas has been one of Masters Gym\'s kids coaches since 2014 and also coaches the morning class. A dedicated and experienced coach for our youngest athletes.',img:'Coach-Joonas.jpg',badge:'Coach'}
  ];

  var stage = document.getElementById('coach3dStage');
  var thumbsEl = document.getElementById('coach3dThumbs');
  var nameEl = document.getElementById('coach3dName');
  var bioEl = document.getElementById('coach3dBio');
  var pillEl = document.getElementById('coach3dPill');
  if (!stage) return;

  var current = 0;
  var animating = false;
  var cards = [];
  var thumbEls = [];

  function getCoaches() {
    return (typeof currentLang !== 'undefined' && currentLang === 'en') ? COACHES_EN : COACHES_SV;
  }

  function buildCarousel() {
    var coaches = getCoaches();
    var N = coaches.length;
    // Clear existing cards/thumbs (keep buttons)
    cards.forEach(function(c){ c.remove(); });
    thumbEls.forEach(function(t){ t.remove(); });
    cards = [];
    thumbEls = [];
    thumbsEl.innerHTML = '';

    coaches.forEach(function(c, i){
      // Card
      var el = document.createElement('div');
      el.className = 'coach3d-card';
      el.setAttribute('tabindex','0');
      el.setAttribute('role','button');
      el.setAttribute('aria-label',c.name+', '+c.discipline);
      el.innerHTML = '<img src="'+c.img+'" alt="'+c.name+'" loading="lazy"><div class="coach3d-card-overlay"></div><div class="coach3d-card-info"><div class="coach3d-card-discipline">'+c.discipline+'</div><div class="coach3d-card-name">'+c.name+'</div></div>';
      el.addEventListener('click', (function(idx){ return function(){ if(!animating) goTo(idx); }; })(i));
      el.addEventListener('keydown', (function(idx){ return function(e){ if((e.key==='Enter'||e.key===' ')&&!animating){ e.preventDefault(); goTo(idx); } }; })(i));
      stage.appendChild(el);
      cards.push(el);

      // Thumb
      var t = document.createElement('div');
      t.className = 'coach3d-thumb';
      t.setAttribute('tabindex','0');
      t.setAttribute('role','button');
      t.setAttribute('aria-label',c.name);
      t.innerHTML = '<img src="'+c.img+'" alt="'+c.name+'">';
      t.addEventListener('click', (function(idx){ return function(){ if(!animating) goTo(idx); }; })(i));
      t.addEventListener('keydown', (function(idx){ return function(e){ if((e.key==='Enter'||e.key===' ')&&!animating){ e.preventDefault(); goTo(idx); } }; })(i));
      thumbsEl.appendChild(t);
      thumbEls.push(t);
    });

    layout(current);
    updateInfo(current);
  }

  function layout(idx) {
    var N = cards.length;
    var cardW = stage.querySelector('.coach3d-card') ? stage.querySelector('.coach3d-card').offsetWidth : 300;
    var gap = 36;
    cards.forEach(function(card, i){
      var offset = i - idx;
      if (offset > N/2) offset -= N;
      if (offset < -N/2) offset += N;
      var absOff = Math.abs(offset);
      var isCenter = offset === 0;
      if (absOff > 3) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '0';
        return;
      }
      var x = offset * (cardW + gap);
      var rotateY = offset * -10;
      var scale = isCenter ? 1 : Math.max(0.7, 1 - absOff * 0.13);
      var z = isCenter ? 0 : -absOff * 70;
      var opacity = isCenter ? 1 : Math.max(0.28, 1 - absOff * 0.28);
      card.style.transform = 'translateX('+x+'px) translateZ('+z+'px) rotateY('+rotateY+'deg) scale('+scale+')';
      card.style.opacity = String(opacity);
      card.style.zIndex = String(10 - absOff);
      card.style.pointerEvents = isCenter ? 'none' : 'all';
      card.classList.toggle('active', isCenter);
    });
    thumbEls.forEach(function(t, i){ t.classList.toggle('active', i === idx); });
  }

  function updateInfo(idx) {
    var coaches = getCoaches();
    var c = coaches[idx];
    nameEl.style.opacity = '0';
    bioEl.style.opacity = '0';
    pillEl.style.opacity = '0';
    setTimeout(function(){
      nameEl.textContent = c.name;
      bioEl.textContent = c.bio;
      pillEl.textContent = c.badge + ' — ' + c.discipline;
      nameEl.style.transition = 'opacity .35s ease';
      bioEl.style.transition = 'opacity .35s ease';
      pillEl.style.transition = 'opacity .35s ease';
      nameEl.style.opacity = '1';
      bioEl.style.opacity = '1';
      pillEl.style.opacity = '1';
    }, 140);
  }

  function goTo(idx) {
    if (animating) return;
    animating = true;
    var N = cards.length;
    current = ((idx % N) + N) % N;
    layout(current);
    updateInfo(current);
    setTimeout(function(){ animating = false; }, 580);
  }

  document.getElementById('coach3dPrev').addEventListener('click', function(e){ e.stopPropagation(); goTo(current - 1); });
  document.getElementById('coach3dNext').addEventListener('click', function(e){ e.stopPropagation(); goTo(current + 1); });

  document.addEventListener('keydown', function(e){
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#coaches')) {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    }
  });

  // Touch / drag
  var dragStartX = 0, dragging = false;
  stage.addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('.coach3d-prev,.coach3d-next')) return;
    dragStartX = e.clientX; dragging = true; stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointerup', function(e){
    if (!dragging) return; dragging = false;
    var dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', function(){ dragging = false; });

  // Re-layout on resize
  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ layout(current); }, 120);
  });

  // Hook into lang toggle to update coach text
  var _origToggleLang = typeof toggleLang === 'function' ? toggleLang : null;
  if (_origToggleLang) {
    window._coach3dLangHook = function(){ updateInfo(current); };
  }

  buildCarousel();

  // Patch toggleLang to also refresh coach info
  var _patchLang = setInterval(function(){
    if (typeof toggleLang === 'function') {
      clearInterval(_patchLang);
      var orig = toggleLang;
      toggleLang = function(){
        orig();
        setTimeout(function(){ updateInfo(current); }, 50);
      };
    }
  }, 100);
})();

// ── FINDER 3D CAROUSEL (Hitta rätt träning för dig) ──
(function(){
  var FINDER_SV = [
    {title:'NYBÖRJARE',pill:'Nybörjarpass',bio:'Perfekt start. Vi går igenom grunderna tillsammans, inga förkunskaper behövs.',img:'class-nybörjare.jpg',route:'vara-pass.html#tl-0',cta:'Se pass →'},
    {title:'FORTSÄTTNING',pill:'Fortsättningspass',bio:'Boka ett provpass så placerar tränaren dig i rätt grupp utifrån din erfarenhet.',img:'class-fortsattning.jpg',route:'vara-pass.html#tl-1',cta:'Se pass →'},
    {title:'TÄVLA',pill:'Tävlingsgrupp',bio:'Tävlingsgruppen bestäms av huvudtränaren. Kontakta oss så pratar vi om dina mål.',img:'IMG_5588.JPG',route:'vara-pass.html#tl-2',cta:'Se pass →'},
    {title:'PERSONLIG TRÄNING',pill:'PT med Thamer',bio:'Skräddarsydd träning från amatör till elitnivå, i din egen takt.',img:'IMG_8269_2.jpg',route:'pt.html',cta:'Se PT →'},
    {title:'MOTIONERA',pill:'Boxning, Fyspass, Morgon/Lunch',bio:'Drop-in träning för alla nivåer, ingen tävling. Boxning, Fyspass och Morgon/Lunch passar alla lika bra.',img:'class-fyspass.jpg',route:'vara-pass.html#tl-4',cta:'Se pass →'},
    {title:'FÖRETAG',pill:'Träna med ditt team',bio:'Skräddarsydda träningslösningar för företag och team — morgonpass, teambuilding och gruppass.',img:'corporate-training.jpg',route:'foretag.html',cta:'Se företagspaket →'},
    {title:'BARN & JUNIOR',pill:'Träning för unga utövare',bio:'Strukturerad och trygg träning. Vi lär ut respekt, disciplin och självförtroende.',img:'kids-training.jpg',route:'junior.html',cta:'Se barn & junior →'}
  ];
  var FINDER_EN = [
    {title:'BEGINNER',pill:'Beginner class',bio:'The perfect start. We go through the fundamentals together, no experience needed.',img:'class-nybörjare.jpg',route:'vara-pass.html#tl-0',cta:'View class →'},
    {title:'INTERMEDIATE',pill:'Intermediate class',bio:'Book a trial class and the coach will place you in the right group based on your experience.',img:'class-fortsattning.jpg',route:'vara-pass.html#tl-1',cta:'View class →'},
    {title:'COMPETE',pill:'Competition group',bio:'The competition group is decided by the head coach. Get in touch and let\'s talk about your goals.',img:'IMG_5588.JPG',route:'vara-pass.html#tl-2',cta:'View class →'},
    {title:'PERSONAL TRAINING',pill:'PT with Thamer',bio:'Tailored training from beginner to elite level, at your own pace.',img:'IMG_8269_2.jpg',route:'pt.html',cta:'View PT →'},
    {title:'STAY ACTIVE',pill:'Boxing, Fitness Class, Morning/Lunch',bio:'Drop-in training for all levels, no competition. Boxing, Fitness Class and Morning/Lunch all fit equally well.',img:'class-fyspass.jpg',route:'vara-pass.html#tl-4',cta:'View class →'},
    {title:'CORPORATE',pill:'Train with your team',bio:'Tailored training solutions for companies and teams — morning sessions, team building and group classes.',img:'corporate-training.jpg',route:'foretag.html',cta:'View corporate →'},
    {title:'KIDS & JUNIOR',pill:'Training for young athletes',bio:'Structured and safe training. We teach respect, discipline and confidence.',img:'kids-training.jpg',route:'junior.html',cta:'View kids & junior →'}
  ];

  var stage = document.getElementById('finder3dStage');
  var thumbsEl = document.getElementById('finder3dThumbs');
  var nameEl = document.getElementById('finder3dName');
  var bioEl = document.getElementById('finder3dBio');
  var ctaEl = document.getElementById('finder3dCta');
  if (!stage) return;

  var rotation = 0;
  var targetRotation = 0;
  var jumping = false;
  var lastShownIndex = -1;
  var cards = [];
  var thumbEls = [];

  function getOptions() {
    return (typeof currentLang !== 'undefined' && currentLang === 'en') ? FINDER_EN : FINDER_SV;
  }

  function buildCarousel() {
    var opts = getOptions();
    cards.forEach(function(c){ c.remove(); });
    thumbEls.forEach(function(t){ t.remove(); });
    cards = [];
    thumbEls = [];
    thumbsEl.innerHTML = '';

    opts.forEach(function(o, i){
      var el = document.createElement('div');
      el.className = 'finder3d-card';
      el.setAttribute('tabindex','0');
      el.setAttribute('role','button');
      el.setAttribute('aria-label',o.title);
      el.innerHTML = '<img src="'+o.img+'" alt="'+o.title+'" loading="lazy"><div class="finder3d-card-overlay"></div><div class="finder3d-card-info"><div class="finder3d-card-pill">'+o.pill+'</div><div class="finder3d-card-name">'+o.title+'</div></div>';
      el.addEventListener('click', (function(idx){ return function(){
        pauseAutoplay();
        if(idx===nearestIndex()){ location.href = getOptions()[idx].route; return; }
        goTo(idx);
      }; })(i));
      el.addEventListener('keydown', (function(idx){ return function(e){
        if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pauseAutoplay();
          if(idx===nearestIndex()){ location.href = getOptions()[idx].route; } else { goTo(idx); }
        }
      }; })(i));
      stage.appendChild(el);
      cards.push(el);

      var t = document.createElement('div');
      t.className = 'finder3d-thumb';
      t.setAttribute('tabindex','0');
      t.setAttribute('role','button');
      t.setAttribute('aria-label',o.title);
      t.innerHTML = '<span>'+o.title+'</span>';
      t.addEventListener('click', (function(idx){ return function(){ pauseAutoplay(); goTo(idx); }; })(i));
      t.addEventListener('keydown', (function(idx){ return function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pauseAutoplay(); goTo(idx); } }; })(i));
      thumbsEl.appendChild(t);
      thumbEls.push(t);
    });

    layout(rotation);
    updateInfo(nearestIndex());
  }

  function layout(pos) {
    var N = cards.length;
    var angleStep = 26;
    var radius = 460;
    cards.forEach(function(card, i){
      var offset = i - pos;
      offset = ((offset % N) + N) % N;
      if (offset > N/2) offset -= N;
      var absOff = Math.abs(offset);
      var isCenter = absOff < 0.5;
      if (absOff > Math.floor(N/2) + 0.5) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '0';
        return;
      }
      var angleDeg = offset * angleStep;
      var rad = angleDeg * Math.PI / 180;
      var x = Math.sin(rad) * radius;
      var z = (Math.cos(rad) - 1) * radius;
      var rotateY = -angleDeg;
      var scale = Math.max(0.6, 1 - absOff * 0.14);
      var opacity = Math.max(0.32, 1 - absOff * 0.2);
      card.style.transform = 'translateX('+x+'px) translateZ('+z+'px) rotateY('+rotateY+'deg) scale('+scale+')';
      card.style.opacity = String(opacity);
      card.style.zIndex = String(Math.round(10 - absOff));
      card.style.pointerEvents = 'all';
      card.classList.toggle('active', isCenter);
    });
    var nearest = nearestIndex();
    thumbEls.forEach(function(t, i){ t.classList.toggle('active', i === nearest); });
    updateInfo(nearest);
  }

  function nearestIndex(){
    var N = cards.length;
    return ((Math.round(rotation) % N) + N) % N;
  }

  function updateInfo(idx) {
    if(idx === lastShownIndex) return;
    lastShownIndex = idx;
    var opts = getOptions();
    var o = opts[idx];
    nameEl.style.opacity = '0';
    bioEl.style.opacity = '0';
    ctaEl.style.opacity = '0';
    setTimeout(function(){
      nameEl.textContent = o.title;
      bioEl.textContent = o.bio;
      ctaEl.textContent = o.cta;
      ctaEl.href = o.route;
      nameEl.style.transition = 'opacity .35s ease';
      bioEl.style.transition = 'opacity .35s ease';
      ctaEl.style.transition = 'opacity .35s ease';
      nameEl.style.opacity = '1';
      bioEl.style.opacity = '1';
      ctaEl.style.opacity = '1';
    }, 140);
  }

  function goTo(idx) {
    var N = cards.length;
    idx = ((idx % N) + N) % N;
    // shortest path from current rotation to target index
    var base = Math.round(rotation);
    var diff = idx - ((base % N) + N) % N;
    if (diff > N/2) diff -= N;
    if (diff < -N/2) diff += N;
    targetRotation = rotation + diff;
    jumping = true;
  }

  var prevBtn = document.getElementById('finder3dPrev');
  var nextBtn = document.getElementById('finder3dNext');
  if(prevBtn)prevBtn.addEventListener('click', function(e){ e.stopPropagation(); pauseAutoplay(); goTo(nearestIndex() - 1); });
  if(nextBtn)nextBtn.addEventListener('click', function(e){ e.stopPropagation(); pauseAutoplay(); goTo(nearestIndex() + 1); });

  document.addEventListener('keydown', function(e){
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#classes')) {
      if (e.key === 'ArrowLeft') { pauseAutoplay(); goTo(nearestIndex() - 1); }
      if (e.key === 'ArrowRight') { pauseAutoplay(); goTo(nearestIndex() + 1); }
    }
  });

  var dragStartX = 0, dragging = false, dragStartRotation = 0;
  stage.addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('.finder3d-prev,.finder3d-next')) return;
    pauseAutoplay();
    jumping = false;
    dragStartX = e.clientX; dragging = true; dragStartRotation = rotation;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var dx = e.clientX - dragStartX;
    rotation = dragStartRotation - dx / 140;
  });
  stage.addEventListener('pointerup', function(e){
    if (!dragging) return; dragging = false;
    goTo(nearestIndex());
  });
  stage.addEventListener('pointercancel', function(){ dragging = false; });

  var resizeTimer2;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer2);
    resizeTimer2 = setTimeout(function(){ layout(rotation); }, 120);
  });

  var autoplayOn = true;
  function startAutoplay(){ autoplayOn = true; }
  function pauseAutoplay(){ autoplayOn = false; }
  stage.addEventListener('mouseenter', pauseAutoplay);
  stage.addEventListener('mouseleave', startAutoplay);

  var DRIFT_SPEED = 0.00016; // card-units per ms — super slow continuous drift
  var lastFrameTime = null;
  function tick(t){
    if(lastFrameTime === null) lastFrameTime = t;
    var dt = t - lastFrameTime;
    lastFrameTime = t;

    if(jumping){
      var diff = targetRotation - rotation;
      if(Math.abs(diff) < 0.002){
        rotation = targetRotation;
        jumping = false;
      }else{
        rotation += diff * Math.min(1, dt / 220);
      }
      layout(rotation);
    }else if(dragging){
      layout(rotation);
    }else if(autoplayOn){
      rotation += DRIFT_SPEED * dt;
      layout(rotation);
    }
    requestAnimationFrame(tick);
  }

  buildCarousel();
  requestAnimationFrame(tick);

  var _patchLang2 = setInterval(function(){
    if (typeof toggleLang === 'function') {
      clearInterval(_patchLang2);
      var orig = toggleLang;
      toggleLang = function(){
        orig();
        setTimeout(function(){ buildCarousel(); }, 50);
      };
    }
  }, 100);
})();

// ── GYMBOT: persistent small tab, occasionally pops out with a label ──
// Stays as a small always-clickable tab in the corner. On scroll activity
// (throttled, not a timer) it expands to show a text label for a few
// seconds, then retracts back down on its own if nobody clicks it —
// clicking anywhere collapses it immediately via the click handler above.
(function(){
  var toggleBtn=document.getElementById('gymbotToggle');
  var rootEl=document.getElementById('gymbot');
  if(!toggleBtn||!rootEl)return;
  var lastTriggered=0;
  var lastScrollY=window.scrollY;
  var COOLDOWN_MS=25000;
  var MIN_SCROLL_DISTANCE=400;
  var POP_DURATION_MS=4200;
  var scrolledSinceLastTrigger=0;
  var ticking=false;
  var retractTimer=null;
  var BUBBLE_DURATION_MS=6000;
  var bubbleEl=document.getElementById('gymbotBubble');
  var bubbleShownKey='gymbotLangBubbleShown';
  var bubbleRetractTimer=null;

  function currentLangCode(){return document.documentElement.getAttribute('lang')==='en'?'en':'sv';}

  function maybeShowLangBubble(){
    if(!bubbleEl)return false;
    try{ if(sessionStorage.getItem(bubbleShownKey))return false; }catch(e){}
    bubbleEl.textContent=currentLangCode()==='en'?'🇸🇪 Läs på svenska? Tryck här':'🇬🇧 Prefer English? Tap here';
    bubbleEl.classList.add('visible');
    try{ sessionStorage.setItem(bubbleShownKey,'1'); }catch(e){}
    clearTimeout(bubbleRetractTimer);
    bubbleRetractTimer=setTimeout(function(){bubbleEl.classList.remove('visible');},BUBBLE_DURATION_MS);
    return true;
  }

  if(bubbleEl){
    bubbleEl.addEventListener('click',function(){
      bubbleEl.classList.remove('visible');
      clearTimeout(bubbleRetractTimer);
      if(typeof toggleLang==='function')toggleLang();
    });
  }

  function maybeTrigger(){
    if(rootEl.classList.contains('open'))return; // never distract while the panel is already open
    var now=Date.now();
    if(now-lastTriggered<COOLDOWN_MS)return;
    if(scrolledSinceLastTrigger<MIN_SCROLL_DISTANCE)return;
    lastTriggered=now;
    scrolledSinceLastTrigger=0;
    if(maybeShowLangBubble())return; // first pop of the session offers a language switch instead
    toggleBtn.classList.add('popped');
    clearTimeout(retractTimer);
    retractTimer=setTimeout(function(){toggleBtn.classList.remove('popped');},POP_DURATION_MS);
  }

  window.addEventListener('scroll',function(){
    var y=window.scrollY;
    scrolledSinceLastTrigger+=Math.abs(y-lastScrollY);
    lastScrollY=y;
    if(!ticking){
      ticking=true;
      requestAnimationFrame(function(){maybeTrigger();ticking=false;});
    }
  },{passive:true});
})();

// ── HOMEPAGE NEWS TEASER: sliding image strip pulling from Sanity ──
(function(){
  var track = document.getElementById('newsTeaserTrack');
  if(!track) return;
  var query = encodeURIComponent('*[_type == "newsPost" && publishedAt <= now()] | order(publishedAt desc)[0...10]{title, tag, publishedAt, mainImage}');
  var url = 'https://'+SANITY_PROJECT_ID+'.apicdn.sanity.io/v'+SANITY_API_VERSION+'/data/query/'+SANITY_DATASET+'?query='+query;

  fetch(url).then(function(res){ return res.json(); }).then(function(json){
    var rows = json.result || [];
    if(!rows.length){
      track.innerHTML = '<p style="color:var(--muted);font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:0 40px">Inga nyheter just nu.</p>';
      return;
    }
    var cardsHtml = rows.map(function(r){
      var title = (r.title||'').trim();
      var date = r.publishedAt ? new Date(r.publishedAt).toLocaleDateString(document.documentElement.lang==='en'?'en-GB':'sv-SE',{year:'numeric',month:'long',day:'numeric'}) : '';
      var imgRef = r.mainImage && r.mainImage.asset ? r.mainImage.asset._ref : null;
      var imgUrl = sanityImageUrl(imgRef, 500);
      var tag = (r.tag||'Nyhet').trim();
      return '<a href="nyheter.html" class="news-teaser-card">'
        + '<img src="'+(imgUrl||'MastersGymLogo.png')+'" alt="'+esc(title)+'" loading="lazy">'
        + '<div class="news-teaser-card-info">'
        + '<span class="news-teaser-card-tag">'+esc(tag)+'</span>'
        + '<h4 class="news-teaser-card-title">'+esc(title)+'</h4>'
        + (date ? '<span class="news-teaser-card-date">'+esc(date)+'</span>' : '')
        + '</div></a>';
    }).join('');
    // duplicate for a seamless continuous loop, matching the marquee pattern
    track.innerHTML = cardsHtml + cardsHtml;
  }).catch(function(){
    track.innerHTML = '<p style="color:var(--muted);font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:0 40px">Kunde inte ladda nyheter.</p>';
  });
})();

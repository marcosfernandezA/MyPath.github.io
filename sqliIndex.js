// sqliIndex.js - shared index behavior (accordion + search + scrollspy + mobile drawer + media helpers)
(function(){
  const OPEN_STATE_KEY = 'sqliAccordionOpen';

  function initSqliIndex(){
    const accordion = document.getElementById('sidebar-accordion');
    if(!accordion) return;

    // Enhance headers for accessibility
    accordion.querySelectorAll('.accordion-header').forEach(header => {
      header.setAttribute('role','button');
      header.setAttribute('tabindex','0');
    });

    // Restore open state; if none, auto-open PortSwigger on lab pages
    const saved = localStorage.getItem(OPEN_STATE_KEY);
    let openKeys = saved ? JSON.parse(saved) : [];
    if(!Array.isArray(openKeys)) openKeys = [];
    const isLabPage = /\/WebSecurity\/sqlInjection\/PortSwigger\//i.test(location.pathname);
    if(openKeys.length === 0 && isLabPage) openKeys = ['portswigger'];
    openKeys.forEach(k => {
      const item = accordion.querySelector('.accordion-item[data-key="'+k+'"]');
      if(item) item.classList.add('open');
    });

    // Toggle + persist
    accordion.querySelectorAll('.accordion-header').forEach(header => {
      const item = header.parentElement;
      header.addEventListener('click', () => toggleItem(item));
      header.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(item); }
      });
    });

    function toggleItem(item){
      item.classList.toggle('open');
      const keys = Array.from(accordion.querySelectorAll('.accordion-item.open'))
        .map(it => it.getAttribute('data-key'));
      localStorage.setItem(OPEN_STATE_KEY, JSON.stringify(keys));
    }

    // Search within index
    const search = document.getElementById('sidebar-search');
    if(search){
      search.addEventListener('input', function(){
        const q = this.value.trim().toLowerCase();
        accordion.querySelectorAll('.accordion-item').forEach(item => {
          let anyMatch = false;
          item.querySelectorAll('.index-link').forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            if (!q || text.indexOf(q) !== -1) {
              link.style.display = '';
              anyMatch = true;
            } else {
              link.style.display = 'none';
            }
          });
          if (anyMatch) item.classList.add('open'); else item.classList.remove('open');
        });
      });
    }

    // Scrollspy only for sections on current page
    setupScrollspy(accordion);

    // Mobile drawer toggle
    setupDrawer();

    // Media helpers: lazy + lightbox
    setupMedia();
  }

  function setupScrollspy(accordion){
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if(sections.length === 0) return;
    const links = Array.from(accordion.querySelectorAll('a.index-link'))
      .filter(a => {
        try {
          const u = new URL(a.href, location.href);
          return u.pathname === location.pathname && u.hash;
        } catch(e){ return false; }
      });

    const map = new Map(); // id -> link
    links.forEach(a => { map.set(new URL(a.href, location.href).hash.slice(1), a); });

    function onScroll(){
      let currentId = null;
      const y = window.scrollY + 120; // offset for header
      for(const sec of sections){
        const top = sec.offsetTop;
        if(top <= y) currentId = sec.id; else break;
      }
      links.forEach(l => l.classList.remove('active'));
      if(currentId && map.has(currentId)) map.get(currentId).classList.add('active');
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  function setupDrawer(){
    let btn = document.getElementById('index-toggle');
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar) return;
    if(!btn){
      // create a default button if not present
      btn = document.createElement('button');
      btn.id = 'index-toggle';
      btn.className = 'index-toggle';
      btn.innerHTML = '☰ Índice';
      const layout = document.querySelector('.layout');
      if(layout) layout.insertBefore(btn, layout.firstChild);
    }
    let overlay = document.querySelector('.drawer-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'drawer-overlay';
      document.body.appendChild(overlay);
    }
    function open(){ sidebar.classList.add('open'); overlay.classList.add('open'); }
    function close(){ sidebar.classList.remove('open'); overlay.classList.remove('open'); }
    btn.addEventListener('click', open);
    overlay.addEventListener('click', close);
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  }

  function setupMedia(){
    // lazy-load images in content area
    document.querySelectorAll('.content-area img').forEach(img => {
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
  }

  function openLightbox(src, alt){
    let backdrop = document.querySelector('.lightbox-backdrop');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'lightbox-backdrop';
      const img = document.createElement('img');
      img.className = 'lightbox-image';
      backdrop.appendChild(img);
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', ()=> backdrop.classList.remove('open'));
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') backdrop.classList.remove('open'); });
    }
    const lightImg = backdrop.querySelector('.lightbox-image');
    lightImg.src = src;
    lightImg.alt = alt || '';
    backdrop.classList.add('open');
  }

  window.initSqliIndex = initSqliIndex;
})();

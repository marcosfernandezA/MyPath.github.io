// loadHeader.js - fetches partials/header.html trying multiple relative prefixes
(function(){
  async function loadHeader(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    const prefixes = ['','./','../','../../','../../../','../../../../'];
    let loaded = false;
    for(const p of prefixes){
      try{
        const res = await fetch(p + 'partials/header.html', {cache: 'no-store'});
        if(!res.ok) continue;
        let text = await res.text();
        text = text.replace(/\{\{PREFIX\}\}/g, p);
        container.innerHTML = text;
        // If a global initializer exists, call it
        if(window.initGlobalNav) try{ window.initGlobalNav(); }catch(e){}
        ensureBackgroundLayer();
        loaded = true;
        break;
      }catch(e){ /* try next */ }
    }
    if(!loaded){
      // Minimal fallback UI
      container.innerHTML = '<nav class="navbar global-nav"><a href="index.html" class="nav-logo">AppSec</a></nav>';
      if(window.initGlobalNav) try{ window.initGlobalNav(); }catch(e){}
    }
  }

  // Ensure the site-wide gradient background layer exists
  function ensureBackgroundLayer(){
    if(document.getElementById('site-bg-ellipse')) return;
    const bg = document.createElement('div');
    bg.id = 'site-bg-ellipse';
    bg.className = 'bg-ellipse-hero';
    document.body.prepend(bg);
  }

  // Generic partial loader with prefix probing and {{PREFIX}} replacement
  async function loadPartial(containerId, partialPath){
    const el = document.getElementById(containerId);
    if(!el) return false;
    const prefixes = ['','./','../','../../','../../../','../../../../'];
    for(const p of prefixes){
      try{
        const res = await fetch(p + partialPath, {cache: 'no-store'});
        if(!res.ok) continue;
        let html = await res.text();
        html = html.replace(/\{\{PREFIX\}\}/g, p);
        el.innerHTML = html;
        return true;
      }catch(e){ /* try next */ }
    }
    return false;
  }

  // Expose a simple API
  window.loadHeader = loadHeader;
  window.loadPartial = loadPartial;
})();

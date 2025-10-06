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

  // Expose a simple API
  window.loadHeader = loadHeader;
})();

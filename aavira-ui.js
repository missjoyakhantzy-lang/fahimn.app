/* Aavira Fashion — Global UI/Loading Engine */
(function(){
  'use strict';

  var LOGO='/public/file_0000000015bc82119a5830b82bcd3a20.png';
  var DURATION=520;

  function markTheme(){
    document.body.classList.add('aavira-theme');
  }

  function injectLoader(){
    if(document.getElementById('aaviraGlobalLoader')) return;
    var el=document.createElement('div');
    el.id='aaviraGlobalLoader';
    el.className='aavira-global-loader';
    el.setAttribute('aria-label','Loading Aavira Fashion');
    el.innerHTML=
      '<div class="aavira-loader-box">'+
        '<div class="aavira-loader-logo-wrap">'+
          '<img class="aavira-loader-logo" src="'+LOGO+'" alt="Aavira Fashion">'+
        '</div>'+
        '<div class="aavira-loader-wordmark">AAVIRA <span>FASHION</span></div>'+
        '<div class="aavira-loader-track"><span></span></div>'+
        '<div class="aavira-loader-caption">Luxury Ethnic Elegance</div>'+
      '</div>';
    document.body.appendChild(el);
  }

  function hideLoader(){
    var loader=document.getElementById('aaviraGlobalLoader');
    if(!loader) return;
    window.setTimeout(function(){
      loader.classList.add('hide');
      document.body.classList.remove('aavira-transitioning');
    }, DURATION);
  }

  function bindImages(){
    var imgs=document.images||[];
    for(var i=0;i<imgs.length;i++){
      var img=imgs[i];
      if(img.complete) continue;
      img.classList.add('aavira-img-loading');
      img.addEventListener('load',function(){this.classList.remove('aavira-img-loading');},{once:true});
      img.addEventListener('error',function(){this.classList.remove('aavira-img-loading');},{once:true});
    }
  }

  function showTransition(){
    var loader=document.getElementById('aaviraGlobalLoader');
    if(!loader){injectLoader();loader=document.getElementById('aaviraGlobalLoader');}
    document.body.classList.add('aavira-transitioning');
    loader.classList.remove('hide');
  }

  function bindNavigation(){
    document.addEventListener('click',function(e){
      var a=e.target.closest ? e.target.closest('a') : null;
      if(!a) return;
      var href=a.getAttribute('href');
      if(!href || href[0]==='#' || href.indexOf('javascript:')===0 || a.target==='_blank' ||
         a.hasAttribute('download') || a.origin!==window.location.origin) return;
      try{
        var u=new URL(href,window.location.href);
        if(u.hash && u.pathname===window.location.pathname) return;
        if(u.pathname===window.location.pathname && u.search===window.location.search) return;
        e.preventDefault();
        showTransition();
        window.setTimeout(function(){window.location.href=u.href;},120);
      }catch(_){}
    },false);
  }

  function init(){
    if(!document.body) return;
    markTheme();
    injectLoader();
    bindImages();
    bindNavigation();
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',hideLoader,{once:true});
    }else{
      hideLoader();
    }
  }

  init();
})();
/* Aavira Fashion — Global UI Engine
   Corporate theme + individual action-button loading only.
   No full-screen/page loading animation. */
(function(){
  'use strict';

  function markTheme(){
    if(document.body) document.body.classList.add('aavira-theme');
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

  function isActionButton(btn){
    if(!btn || btn.tagName!=='BUTTON') return false;
    if(btn.dataset.noLoading!==undefined) return false;
    if(btn.disabled || btn.classList.contains('aavira-btn-loading') || btn.querySelector('.mini-spin')) return false;

    var id=(btn.id||'').toLowerCase();
    var cls=(btn.className||'').toString().toLowerCase();
    var text=(btn.textContent||'').trim().toLowerCase();

    if(btn.dataset.loading!==undefined) return true;
    if(btn.type==='submit') return true;

    var selectors=/btn-confirm|promo-btn|modal-btn-primary|pay-btn|sheet-action|claim|checkout|order|add-to-cart|add_to_cart|buy-now|buy_now|submit|save-details|pro-action/.test(cls+' '+id);
    var words=/place order|buy now|add to cart|move to bag|proceed|submit|post review|save details|save changes|save address|claim offer|use offer|verify|secure login|continue|sign in|sign up|create account/.test(text);
    return selectors || words;
  }

  function startButtonLoading(btn){
    if(!isActionButton(btn)) return;
    btn.classList.add('aavira-btn-loading');
    btn.setAttribute('aria-busy','true');
    btn.setAttribute('data-aavira-original-html',btn.innerHTML);
    btn.disabled=true;

    var spinner=document.createElement('span');
    spinner.className='mini-spin white aavira-action-spinner';
    spinner.setAttribute('aria-hidden','true');
    btn.appendChild(spinner);
  }

  function initButtonLoading(){
    document.addEventListener('click',function(e){
      var btn=e.target.closest && e.target.closest('button');
      if(!btn || !document.body.contains(btn)) return;
      if(!isActionButton(btn)) return;
      if(btn.querySelector('.mini-spin')) return;
      startButtonLoading(btn);
    },true);

    document.addEventListener('submit',function(e){
      var btn=e.submitter || e.target.querySelector('button[type="submit"]');
      if(btn && isActionButton(btn) && !btn.querySelector('.mini-spin')) startButtonLoading(btn);
    },true);

    window.AaviraButtonLoading={
      start:startButtonLoading,
      stop:function(btn){
        if(!btn) return;
        var original=btn.getAttribute('data-aavira-original-html');
        if(original!==null) btn.innerHTML=original;
        btn.classList.remove('aavira-btn-loading');
        btn.removeAttribute('aria-busy');
        btn.removeAttribute('data-aavira-original-html');
        btn.disabled=false;
      }
    };
  }

  function init(){
    if(!document.body) return;
    markTheme();
    bindImages();
    initButtonLoading();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
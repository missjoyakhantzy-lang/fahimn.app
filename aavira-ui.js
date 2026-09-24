/* Aavira Fashion — Global UI Engine
   Corporate theme only. Action buttons keep their own page logic/spinners. */
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

  function init(){
    if(!document.body) return;
    markTheme();
    bindImages();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
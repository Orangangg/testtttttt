//Кнопка WhatsApp


 window.onload = function () {	
    setTimeout(function(){
        if ($('.t-store__prod-popup__btn-wrapper').length > 0) {
            var title = 'Здравствуйте! Меня интересует товар: '+$('h1').html();
            //$('.t-store__prod-popup__btn-wrapper').append('<a class="whatsapp-order" href="https://api.whatsapp.com/send/?phone=79852111107&text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21+%D0%9C%D0%B5%D0%BD%D1%8F+%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D0%B5%D1%82...&type=phone_number&app_absent=0">Оформить в WhatsApp</a>');    
            $('.t-store__prod-popup__btn-wrapper').append('<a target="_blank" class="whatsapp-order" href="https://api.whatsapp.com/send/?phone=79852111107&text='+title+'&type=phone_number&app_absent=0">Оформить в WhatsApp</a>');
        }
    }, 500);
}




/* ============================================================================
   ПОПАП + КАТАЛОГ (фикс логики лока по вариантаv)
   - Лочим цены только для того варианта (name+SKU), который реально лежит в корзине.
   - При смене варианта мгновенно пересчитываем lock/unlock.
   - Блокировку включаем только после добавления в корзину.
   ============================================================================ */
(function(){
  'use strict';

  /* ---------- формулы ---------- */
  var K_PHYS=1.10, K_BEZ=1.232, K_NDS=1.542, STEP=1000;

  /* ---------- утилиты ---------- */
  function digits(s){return s?String(s).replace(/[\u00A0\u202F\s]/g,'').replace(/[^\d.,]/g,'').replace(/[.,]\d{1,2}$/,'').replace(/\D/g,''):''}
  function txt(n){return ((n&&n.textContent)||'').trim()}
  function roundNearest(v,step){step=Math.max(1,step|0);return Math.round((+v)/step)*step}
  function ceilTo(v,step){step=Math.max(1,step|0);return Math.ceil((+v)/step)*step}
  function withCur(num,cur){if(!isFinite(num))return'';var s=String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F');return s+' '+(cur||'₽')}
  function plainInt(num){if(!isFinite(num))return'';return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F')}
  function keyFor(p){var n=txt(p.querySelector('.js-product-name'))||'';var s=txt(p.querySelector('.js-product-sku'))||'';return (n+'|'+s).toLowerCase().trim()}

  /* ---------- корзина/локи ---------- */
  function cartSnap(){try{if(window.tcart&&Array.isArray(window.tcart.products))return window.tcart.products.slice()}catch(e){}try{var r=localStorage.getItem('tcart');if(!r)return[];var j=JSON.parse(r);if(j&&Array.isArray(j.products))return j.products}catch(e){}return[]}
  function inCart(k){k=String(k||'').toLowerCase().trim();if(!k)return false;var a=cartSnap();for(var i=0;i<a.length;i++){var nm=String(a[i].name||a[i].title||a[i].product||'');var sk=String(a[i].sku||a[i].sku_id||'');if((nm+'|'+sk).toLowerCase().trim()===k)return true}return false}
  function lsRead(){try{return JSON.parse(localStorage.getItem('tpPriceLocks')||'{}')}catch(e){return{}}}
  function lsSave(o){try{localStorage.setItem('tpPriceLocks',JSON.stringify(o||{}))}catch(e){}}
  var LOCKS=lsRead();

  /* ============================ ПОПАП ============================ */

  function snapshotCurrencyPopup(p){
    var line=p.querySelector('.js-store-prod-price'); if(!line) return;
    p.dataset.tpBaseCurrency = txt(line.querySelector('.t-store__prod-popup__price-currency')) || '₽';
  }
  function readCostFromHiddenTop(p,withRetry){
    var line=p.querySelector('.js-store-prod-price'); if(!line) return null;
    var val=line.querySelector('.js-product-price');  if(!val)  return null;
    var d=digits(txt(val)); if(d) return Number(d);
    if(withRetry){p.__tpCostTries=(p.__tpCostTries||0)+1; if(p.__tpCostTries<=8){setTimeout(function(){recalcPopup(p,true)},80)}}
    return null;
  }
  function injectPopupCards(p){
    if(p.dataset.tpCardsInited) return;
    var wrap=p.querySelector('.js-store-price-wrapper'); if(!wrap) return;
    wrap.querySelectorAll('.tp-price-card[data-injected]').forEach(function(n){n.remove()});
    [
      {type:'base-btn',label:'Цена для физ. лиц'},
      {type:'bez',     label:'Цена для юр. лиц без НДС'},
      {type:'nds',     label:'Цена для юр. лиц с НДС'}
    ].forEach(function(sp){
      var d=document.createElement('div');
      d.className='tp-price-card tp-clickable'; d.setAttribute('data-injected',''); d.setAttribute('data-tp-type',sp.type); d.setAttribute('tabindex','0');
      d.innerHTML='<div class="tp-price-card__label">'+sp.label+'</div><div class="tp-price-card__value" aria-live="polite">—</div>';
      wrap.appendChild(d);
    });
    p.dataset.tpCardsInited='1';
  }
  function computePrices(cost){
    return {
      H: roundNearest(cost*K_PHYS, STEP),
      I: ceilTo      (cost*K_BEZ , STEP),
      J: roundNearest(cost*K_NDS , STEP)
    };
  }
  function selectCardOnly(p,el){
    p.querySelectorAll('.tp-clickable').forEach(function(n){ n.classList.remove('tp-selected') });
    if(el) el.classList.add('tp-selected');
  }
  function disableOthers(p,type){
    p.querySelectorAll('[data-tp-type]').forEach(function(n){
      var same=n.getAttribute('data-tp-type')===type;
      if(!same){n.classList.add('tp-disabled');n.setAttribute('aria-disabled','true');if(n.tabIndex>=0)n._tpPrevTab=n.tabIndex;n.tabIndex=-1}
      else{n.classList.remove('tp-disabled');n.removeAttribute('aria-disabled');if(n._tpPrevTab!=null){n.tabIndex=n._tpPrevTab;delete n._tpPrevTab}}
    });
  }
  function enableAll(p){
    p.querySelectorAll('[data-tp-type]').forEach(function(n){
      n.classList.remove('tp-disabled'); n.removeAttribute('aria-disabled');
      if(n._tpPrevTab!=null){ n.tabIndex=n._tpPrevTab; delete n._tpPrevTab; }
    });
    var note=p.querySelector('.tp-locknote'); if(note) note.remove();
    delete p.dataset.tpLock;
  }

  /* ► Единая точка проверки лока для текущего ВАРИАНТА */
  function refreshLockState(p){
    var k=keyFor(p);
    if(inCart(k)){
      var lk = lsRead()[k];
      var typ = (lk&&lk.type) || p.dataset.tpSelectedType || 'base-btn';
      p.dataset.tpLock='1';
      disableOthers(p,typ);
      if(!p.querySelector('.tp-locknote')){
        var note=document.createElement('div');
        note.className='tp-locknote';
        note.innerHTML='Товар уже в корзине по выбранной вами цене.<br>Чтобы сменить цену — удалите его из корзины.';
        (p.querySelector('.js-store-price-wrapper')||p).appendChild(note);
      }
      selectCardOnly(p, p.querySelector('[data-tp-type="'+typ+'"]'));
    }else{
      enableAll(p); // ← другой вариант — свободный выбор
    }
  }

  function recalcPopup(p,fromRetry){
    var cost=readCostFromHiddenTop(p,!fromRetry), cur=p.dataset.tpBaseCurrency||'₽';
    var addBtn=p.querySelector('.t-store__prod-popup__btn');
    if(!(isFinite(cost)&&cost>0)){
      if(fromRetry) return;
      ['base-btn','bez','nds'].forEach(function(t){var el=p.querySelector('.tp-price-card[data-tp-type="'+t+'"] .tp-price-card__value'); if(el) el.textContent='—';});
      if(addBtn){addBtn.disabled=true; addBtn.style.pointerEvents='none'; addBtn.style.opacity='0.6';}
      return;
    }
    if(addBtn){addBtn.disabled=false; addBtn.style.pointerEvents=''; addBtn.style.opacity='';}
    var r=computePrices(cost);
    var set=function(t,v){var el=p.querySelector('.tp-price-card[data-tp-type="'+t+'"] .tp-price-card__value'); if(el) el.textContent=withCur(v,cur);};
    set('base-btn',r.H); set('bez',r.I); set('nds',r.J);

    // пересчитать состояние лока для текущего варианта
    refreshLockState(p);
  }

  function bindPopup(p){
    if(p.dataset.tpBound) return; p.dataset.tpBound='1';
    var wrap=p.querySelector('.js-store-price-wrapper'); var addBtn=p.querySelector('.t-store__prod-popup__btn'); if(!wrap||!addBtn) return;
    injectPopupCards(p); snapshotCurrencyPopup(p);

    // по умолчанию подсветим «физ. лица», но без блокировки
    var def=wrap.querySelector('.tp-price-card[data-tp-type="base-btn"]'); if(def){ selectCardOnly(p,def); p.dataset.tpSelectedType='base-btn'; }

    // выбор карточки — только подсветка; без лока до добавления в корзину
    wrap.querySelectorAll('.tp-price-card[data-injected]').forEach(function(el){
      el.addEventListener('click', function(){
        // если текущий вариант залочен (из корзины) — позволяем клик только по разрешённой карточке
        if(p.dataset.tpLock==='1'){
          var k=keyFor(p); var lk=lsRead()[k]; var allowed=(lk&&lk.type)||(p.dataset.tpSelectedType||'base-btn');
          if(el.getAttribute('data-tp-type')!==allowed) return;
        }
        p.dataset.tpSelectedType=el.getAttribute('data-tp-type')||'base-btn';
        selectCardOnly(p,el);
        recalcPopup(p,true);
      });
      el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); } });
    });

    // наблюдатели: изменения цены/названия/SKU и радиокнопок варианта → пересчёт и refreshLockState
    var baseVal=wrap.querySelector('.js-product-price');
    if(baseVal){ new MutationObserver(function(){ snapshotCurrencyPopup(p); recalcPopup(p,true); }).observe(baseVal,{childList:true,characterData:true,subtree:true}); }

    var skuEl = p.querySelector('.js-product-sku');
    if(skuEl){ new MutationObserver(function(){ refreshLockState(p); }).observe(skuEl,{childList:true,characterData:true,subtree:true}); }

    var nameEl = p.querySelector('.js-product-name');
    if(nameEl){ new MutationObserver(function(){ refreshLockState(p); }).observe(nameEl,{childList:true,characterData:true,subtree:true}); }

    // радиокнопки опций продукта (смена варианта)
    p.querySelectorAll('.t-product__option input[type="radio"], .t-product__option input[type="checkbox"], .t-product__option select').forEach(function(inp){
      inp.addEventListener('change', function(){ setTimeout(function(){ refreshLockState(p); recalcPopup(p,true); }, 0); });
    });

    recalcPopup(p,true);

    // фиксация после добавления в корзину: только теперь лочим и запоминаем выбранную цену
    addBtn.addEventListener('click', function(){
      var typ=p.dataset.tpSelectedType||'base-btn';
      var val=digits(txt(wrap.querySelector('.tp-selected .tp-price-card__value'))) || '';
      if(val){
        var orig=window.tcart__addProduct;
        if(typeof orig==='function'){
          window.tcart__addProduct=(function(fn){
            return function(obj){
              var x=Number(val);
              obj.price=x; obj.price_old=x; obj.price_with_discount=x; obj.price_wd=x; obj.price_one=x; obj.price_original=x;
              window.tcart__addProduct=fn;
              return fn.apply(this,arguments);
            };
          })(orig);
        }
      }
      LOCKS[keyFor(p)]={type:typ,value:val}; lsSave(LOCKS);
      refreshLockState(p); // ← залочим только текущий вариант
    }, true);
  }

  // ресинх при удалениях из корзины и при изменении корзины в другой вкладке
  function resyncAllPopups(){
    document.querySelectorAll('.t-store__prod-popup__info').forEach(function(p){
      refreshLockState(p);
      recalcPopup(p,true);
    });
  }
  function bindCartSignals(){
    document.addEventListener('click', function(e){
      var hit = e.target.closest && e.target.closest('.t706__product-del, .t706__cartwin-prod__delete, .t706__product-plusminus a');
      if(hit){ setTimeout(resyncAllPopups,120); }
    });
    window.addEventListener('storage', function(ev){ if(ev.key==='tcart'){ resyncAllPopups(); }});
  }

  function initExistingPopups(){ document.querySelectorAll('.t-store__prod-popup__info').forEach(bindPopup); }
  function observeNewPopups(){
    var mo=new MutationObserver(function(m){ m.forEach(function(mu){ [].forEach.call(mu.addedNodes,function(n){
      if(n.nodeType!==1) return;
      if(n.classList&&n.classList.contains('t-store__prod-popup__info')) bindPopup(n);
      else{ var q=n.querySelectorAll&&n.querySelectorAll('.t-store__prod-popup__info'); q&&q.forEach(bindPopup); }
    })})});
    mo.observe(document.body,{childList:true,subtree:true});
  }

  /* ============================ КАТАЛОГ ============================ */
  function physFromCost(cost){ return roundNearest(cost*K_PHYS, STEP); }
  function ensureCostSnapshot(valEl){
    if(valEl.getAttribute('data-tp-cost0')) return Number(valEl.getAttribute('data-tp-cost0'));
    var raw = digits(txt(valEl)) || digits(valEl.getAttribute('data-product-price-def')) || '';
    if(!raw) return null;
    valEl.setAttribute('data-tp-cost0', String(raw));
    return Number(raw);
  }
  function patchOneCard(wrap){
    try{
      var val=wrap.querySelector('.js-product-price, .js-store-prod-price-val'); var cur=wrap.querySelector('.t-store__card__price-currency');
      if(!val||!cur) return;
      var cost0=ensureCostSnapshot(val); if(!(isFinite(cost0)&&cost0>0)) return;
      var phys=physFromCost(cost0);
      val.textContent=plainInt(phys);
      val.setAttribute('data-product-price-def', String(phys));
      val.setAttribute('data-product-price-def-str', String(phys));
    }catch(e){}
  }
  function updateCatalog(scope){ (scope||document).querySelectorAll('.t-store__card__price, .js-store-price-wrapper').forEach(patchOneCard); }
  function whenStoreReady(cb,tries){ tries=(tries||0); var ok=document.querySelector('.t-store__card__price .js-product-price, .t-store__card__price .js-store-prod-price-val'); if(ok){cb();return;} if(tries>60)return; setTimeout(function(){whenStoreReady(cb,tries+1)},100); }
  function observeCatalog(){
    var root=document.querySelector('.t-store, .t-store__grid, .t-store__cards-wrapper')||document.body;
    new MutationObserver(function(){ requestAnimationFrame(function(){ updateCatalog(root); }); }).observe(root,{childList:true,subtree:true});
  }

  /* ============================ START ============================ */
  document.addEventListener('DOMContentLoaded', function(){
    initExistingPopups(); observeNewPopups(); bindCartSignals();
    whenStoreReady(function(){ updateCatalog(); observeCatalog(); });
  });
})();


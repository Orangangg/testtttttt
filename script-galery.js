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
   Привязка фото к варианту товара БЕЗ разрушения DOM-слайдера Tilda.
   Идея: не трогаем структуру .t-slds__items-wrapper и пули, только прячем/показываем.
   Поддержка: карточка и попап. Требуется, чтобы у каждого .t-slds__item были meta[itemprop="caption"] и meta[itemprop="image"].
   ============================================================================ */

(function(){
  'use strict';

  /* ---------- Селекторы, завязанные на Tilda ---------- */
  const SEL = {
    container: '.t-store__prod-snippet__container',          // контейнер с карточкой товара
    sldsMain: '.t-slds__main',                                // корневой узел слайдера
    slideItems: '.t-slds__item',                              // слайды (включая клоны)
    thumbsWrap: '.t-slds__thumbsbullet-wrapper',              // контейнер с пулями
    optionInputs: '.t-product__option-input',                 // радио/кнопки вариантов (по имени "Комплектация" и т.п.)
  };

  /* ---------- Вспомогательные ---------- */
  // Проверка готовности DOM
  function domReady(){ return document.readyState === 'complete' || document.readyState === 'interactive'; }

  // Безопасно получить recid для вызова t_slds_updateSlider
  function getRecIdFrom(el){
    // Ищем ближайший родитель с id вида rec123456
    const host = el && el.closest ? el.closest('[id^="rec"]') : null;
    const id = host ? host.getAttribute('id') : '';
    return id ? id.replace(/\D/g,'') : '';
  }

  // Собираем карту: caption -> массив индексов слайдов (реальных, без клонов)
  function buildCaptionIndexMap(main){
    // Реальные слайды у Tilda имеют data-slide-index >= 1 и <= totalslides
    const itemsWrap = main.querySelector('.t-slds__items-wrapper');
    if(!itemsWrap) return { map:{}, totals:0 };

    const totals = parseInt(itemsWrap.getAttribute('data-slider-totalslides')||'0',10) || 0;
    const items = Array.from(main.querySelectorAll(SEL.slideItems))
      .filter(n=>{ // оставляем только «реальные» слайды (исключаем клоны: index==0 и index==totals+1)
        const idx = parseInt(n.getAttribute('data-slide-index')||'-1',10);
        return idx>=1 && idx<=totals;
      });

    const map = {};
    items.forEach(it=>{
      const idx = parseInt(it.getAttribute('data-slide-index')||'-1',10);
      const cap = it.querySelector('meta[itemprop="caption"]')?.getAttribute('content') || '';
      if(!cap || !Number.isFinite(idx)) return;
      (map[cap] ||= []).push(idx);
    });

    return { map, totals };
  }

  // Скрыть/показать слайды И пули, основываясь на целевом caption
  function filterSlidesByCaption(main, caption){
    const itemsWrap = main.querySelector('.t-slds__items-wrapper');
    if(!itemsWrap) return;

    const { map, totals } = buildCaptionIndexMap(main);
    if(!totals) return;

    // Какие индексы должны быть видимы
    const targetIdxs = new Set((map[caption]||[]));

    // Включаем «флаг фильтра» на корневом .t-slds__main (может пригодиться для CSS)
    main.setAttribute('data-filter-active', targetIdxs.size ? 'yes' : 'no');

    // Скрываем/показываем реальные слайды по их data-slide-index
    const allItems = Array.from(main.querySelectorAll(SEL.slideItems));
    allItems.forEach(node=>{
      const idx = parseInt(node.getAttribute('data-slide-index')||'-1',10);
      const isReal = idx>=1 && idx<=totals;           // реальные слайды
      const isClone = idx===0 || idx===totals+1;      // клоны для бесконечного скролла
      if(isReal){
        node.toggleAttribute('data-filter-hidden', !targetIdxs.has(idx)); // ставим флаг скрытия
      }else if(isClone){
        // Клоны тоже прячем, чтобы не было «морганий» при перелистывании в край
        node.setAttribute('data-filter-hidden','');
      }
    });

    // Пули: желательно прятать, иначе индексы не совпадут. Проще всего — скрыть целиком обёртку с пулями.
    const thumbsWrap = main.querySelector(SEL.thumbsWrap);
    if(thumbsWrap){
      // Если нужно — можно показывать только соответствующие пули по data-slide-bullet-for.
      // Но самый безопасный вариант — убрать пули, когда фильтр активен.
      if(targetIdxs.size) thumbsWrap.setAttribute('data-filter-hidden','');
      else thumbsWrap.removeAttribute('data-filter-hidden');
    }

    // Сбрасываем текущую позицию слайдера на «первый видимый» (если есть)
    const firstIdx = targetIdxs.size ? Math.min(...Array.from(targetIdxs)) : 1;
    itemsWrap.setAttribute('data-slider-pos', String(firstIdx));

    // Вызов штатной пересборки размеров/позиции слайдера
    const recid = getRecIdFrom(main);
    if(typeof window.t_slds_updateSlider === 'function' && recid){
      window.t_slds_updateSlider(recid);
    }
  }

  // Навешиваем CSS-правило один раз (прячем по data-атрибуту, не ломая layout)
  function injectOnceCSS(){
    if(document.getElementById('tp-slds-filter-css')) return;
    const st = document.createElement('style');
    st.id = 'tp-slds-filter-css';
    st.textContent = `
      /* Прячем слайды/клоны аккуратно */
      .t-slds__item[data-filter-hidden]{display:none!important}
      /* Прячем пули-обёртку при фильтре */
      .t-slds__thumbsbullet-wrapper[data-filter-hidden]{display:none!important}
    `;
    document.head.appendChild(st);
  }

  // Основная инициализация с ретраями (t-slds рендерится не мгновенно)
  function init(maxAttempts=10, interval=700){
    let tries=0;

    function tick(){
      tries++;

      // Ищем основной контейнер товара (для стабильного recid)
      const cont = document.querySelector(SEL.container) || document.querySelector('.t-store__prod-popup__container') || document;
      const main = cont.querySelector(SEL.sldsMain);
      const hasSlides = main && main.querySelectorAll(SEL.slideItems).length>0;

      if(!main || !hasSlides){
        if(tries<maxAttempts) return setTimeout(tick, interval);
        console.error('[productimages] Не нашли слайдер Tilda или слайды не подгрузились');
        return;
      }

      try{
        injectOnceCSS();

        // Привязываем обработчик на смену опции
        const inputs = cont.querySelectorAll(SEL.optionInputs);
        inputs.forEach(inp=>{
          inp.addEventListener('change', function(){
            if(!this.checked) return;

            // Ищем value выбранной опции и фильтруем по нему (caption должен совпадать 1-в-1)
            const value = String(this.value||'').trim();
            filterSlidesByCaption(main, value);
          }, {passive:true});
        });

        // Первичная фильтрация по уже выбранной опции (если есть)
        const selected = cont.querySelector(`${SEL.optionInputs}:checked`);
        if(selected){
          filterSlidesByCaption(main, String(selected.value||'').trim());
        }

        // Если Tilda перерисует слайдер (lazy, popup open и пр.), подстрахуемся через MutationObserver
        const mo = new MutationObserver((muts)=>{
          for(const m of muts){
            if(m.type==='attributes' && m.attributeName==='style') continue;
            if(m.addedNodes && m.addedNodes.length){
              // Пересчёт caption-карты мог измениться (при догрузке), просто повторим фильтрацию по текущей выбранной опции
              const sel = cont.querySelector(`${SEL.optionInputs}:checked`);
              if(sel){ filterSlidesByCaption(main, String(sel.value||'').trim()); }
            }
          }
        });
        mo.observe(main, {childList:true, subtree:true, attributes:false});

        // Финальный лог
        console.log('[productimages] Инициализация успешна');

      }catch(err){
        console.error('[productimages] Ошибка инициализации:', err);
      }
    }

    // Ждём DOM, затем ретраи
    if(domReady()) tick(); else document.addEventListener('DOMContentLoaded', tick);
  }

  // Стартуем на load (Tilda часто дорисовывает позже)
  window.addEventListener('load', ()=>init());
  // И сразу пробуем (если всё уже на месте)
  if(domReady()) init();

})();

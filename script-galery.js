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







     //Привязка фото к варианту товара
    
    const SELECTORS = {
    container: '.t-store__prod-snippet__container',
    slideItems: '.t-slds__item',
    sliderContainer: '.t-slds__container',
    itemsWrapper: '.t-slds__items-wrapper',
    thumbsWrapper: '.t-slds__thumbsbullet-wrapper',
    volumeOptions: '.t-product__option-input'
};

let slides = {};

function updateSliderImages(option, isInitial = false) {
    const slideImages = slides[option];
    const sliderItemsWrapper = document.querySelector(SELECTORS.itemsWrapper);
    const thumbsBulletWrapper = document.querySelector(SELECTORS.thumbsWrapper);
    const mainSlider = document.querySelector('.t-slds__main');

    if (!sliderItemsWrapper) {
        console.error('Элемент wrapper не найден');
        return;
    }
    const currentHeight = mainSlider.offsetHeight;
    const currentWidth = mainSlider.offsetWidth;

    if (!isInitial) {
        mainSlider.style.height = `${currentHeight}px`;
        mainSlider.style.width = `${currentWidth}px`;
        mainSlider.style.overflow = 'hidden';
    }

    sliderItemsWrapper.innerHTML = '';
    if (thumbsBulletWrapper) {
        thumbsBulletWrapper.innerHTML = '';
    }

    if (slideImages?.length > 0) {
        // Добавляем последний слайд в начало
        const lastSlideImage = slideImages[slideImages.length - 1];
        const lastSlide = document.createElement('div');
        lastSlide.classList.add('t-slds__item', 't-slds__item-loaded');
        lastSlide.setAttribute('data-slide-index', 0);
        lastSlide.setAttribute('aria-hidden', true);
        lastSlide.innerHTML = `<div class="t-slds__wrapper"><div class="t-slds__imgwrapper t-zoomable" data-zoom-target="0" data-img-zoom-url="${lastSlideImage}" data-zoomable="yes"><div class="t-slds__bgimg t-bgimg" data-original="${lastSlideImage}" style="padding-bottom: 100%; background-image: url('${lastSlideImage}');"></div></div></div>`;
        sliderItemsWrapper.appendChild(lastSlide);

        // Добавляем основные слайды
        slideImages.forEach((slideImage, i) => {
            const slide = document.createElement('div');
            slide.classList.add('t-slds__item', 't-slds__item-loaded');
            slide.setAttribute('data-slide-index', i + 1);
            
            if (i === 0) {
                slide.classList.add('t-slds__item_active');
            }
            
            slide.innerHTML = `<div class="t-slds__wrapper"><div class="t-slds__imgwrapper t-zoomable" data-zoom-target="${i + 1}" data-img-zoom-url="${slideImage}" data-zoomable="yes"><div class="t-slds__bgimg t-bgimg" data-original="${slideImage}" style="padding-bottom: 100%; background-image: url('${slideImage}');"></div></div></div>`;
            sliderItemsWrapper.appendChild(slide);

            if (thumbsBulletWrapper) {
                const thumbsBullet = document.createElement('div');
                thumbsBullet.classList.add('t-slds__thumbsbullet', 't-slds__bullet');
                thumbsBullet.setAttribute('data-slide-bullet-for', i + 1);

                if (i === 0) {
                    thumbsBullet.classList.add('t-slds__bullet_active');
                }
                
                thumbsBullet.innerHTML = `<div class="t-slds__bgimg t-bgimg" data-original="${slideImage}" style="padding-bottom: 100%; background-image: url('${slideImage}');"></div><div class="t-slds__thumbsbullet-border"></div>`;
                thumbsBulletWrapper.appendChild(thumbsBullet);
            }
        });

        const firstSlideImage = slideImages[0];
        const firstSlide = document.createElement('div');
        firstSlide.classList.add('t-slds__item', 't-slds__item-loaded');
        firstSlide.setAttribute('data-slide-index', slideImages.length + 1);
        firstSlide.setAttribute('aria-hidden', true);
        firstSlide.innerHTML = `<div class="t-slds__wrapper"><div class="t-slds__imgwrapper t-zoomable" data-zoom-target="${slideImages.length + 1}" data-img-zoom-url="${firstSlideImage}" data-zoomable="yes"><div class="t-slds__bgimg t-bgimg" data-original="${firstSlideImage}" style="padding-bottom: 100%; background-image: url('${firstSlideImage}');"></div></div></div>`;
        sliderItemsWrapper.appendChild(firstSlide);

        sliderItemsWrapper.setAttribute('data-slider-totalslides', slideImages.length);
        sliderItemsWrapper.setAttribute('data-slider-pos', 1);
        
        if (!isInitial) {
            sliderItemsWrapper.style.transform = 'translateX(-800px)';
        }
        if (!isInitial) {
            setTimeout(() => {
                mainSlider.style.height = '';
                mainSlider.style.width = '';
                mainSlider.style.overflow = '';
            }, 100);
        }
    }
}

function isDOMReady() {
    return document.readyState === 'complete' || document.readyState === 'interactive';
}

function initializeWithRetry(maxAttempts = 5, interval = 1000) {
    let attempts = 0;

    function tryInitialize() {
        attempts++;
        console.log(`Попытка инициализации ${attempts}`);

        const container = document.querySelector(SELECTORS.container);
        const slideItems = document.querySelectorAll(SELECTORS.slideItems);
        const sliderItemsWrapper = document.querySelector(SELECTORS.itemsWrapper);
        const thumbsBulletWrapper = document.querySelector(SELECTORS.thumbsWrapper);

        if (!container || !slideItems.length || !sliderItemsWrapper) {
            if (attempts < maxAttempts) {
                console.log('Элементы не найдены, повторная попытка...');
                setTimeout(tryInitialize, interval);
            } else {
                console.error('Превышено максимальное количество попыток инициализации');
            }
            return;
        }

        try {
            const parentId = container.parentNode?.getAttribute("id");
            if (!parentId) {
                throw new Error('ID родительского элемента не найден');
            }

            const prodidblock = parentId.replace(/\D/g, "");
            slides = {}; // Очищаем объект slides перед инициализацией

            // Собираем информацию о слайдах
            slideItems.forEach(slideItem => {
                const slideCaption = slideItem.querySelector('meta[itemprop="caption"]')?.getAttribute('content');
                const slideImage = slideItem.querySelector('meta[itemprop="image"]')?.getAttribute('content');

                if (slideCaption && slideImage) {
                    if (!slides[slideCaption]) {
                        slides[slideCaption] = [];
                    }
                    if (!slides[slideCaption].includes(slideImage)) {
                        slides[slideCaption].push(slideImage);
                    }
                }
            });

            if (Object.keys(slides).length === 0) {
                throw new Error('Не удалось собрать информацию о слайдах');
            }

            const volumeOptions = document.querySelectorAll(SELECTORS.volumeOptions);
            volumeOptions.forEach(option => {
                option.addEventListener('change', function() {
                    if (this.checked) {
                        updateSliderImages(this.value, false);
                        if (typeof t_slds_updateSlider === 'function') {
                            t_slds_updateSlider(prodidblock);
                        }
                    }
                });
            });

            const selectedOption = document.querySelector(`${SELECTORS.volumeOptions}:checked`);
            if (selectedOption) {
                updateSliderImages(selectedOption.value, true);
                if (typeof t_slds_updateSlider === 'function') {
                    t_slds_updateSlider(prodidblock);
                }
            }

            window.updateSliderImages = updateSliderImages;
            console.log('Инициализация успешно завершена');

        } catch (error) {
            console.error('Ошибка инициализации слайдера:', error.message);
            if (attempts < maxAttempts) {
                setTimeout(tryInitialize, interval);
            }
        }
    }

    if (isDOMReady()) {
        tryInitialize();
    } else {
        document.addEventListener('DOMContentLoaded', tryInitialize);
    }
}

window.addEventListener('load', function() {
    initializeWithRetry();
});

if (isDOMReady()) {
    initializeWithRetry();
}

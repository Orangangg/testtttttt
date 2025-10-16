//Привязка фото к варианту товара


 window.onload = function () {	
    setTimeout(function(){
        if ($('.t-store__prod-popup__btn-wrapper').length > 0) {
            var title = 'Здравствуйте! Меня интересует товар: '+$('h1').html();
            //$('.t-store__prod-popup__btn-wrapper').append('<a class="whatsapp-order" href="https://api.whatsapp.com/send/?phone=79852111107&text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21+%D0%9C%D0%B5%D0%BD%D1%8F+%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D0%B5%D1%82...&type=phone_number&app_absent=0">Оформить в WhatsApp</a>');    
            $('.t-store__prod-popup__btn-wrapper').append('<a target="_blank" class="whatsapp-order" href="https://api.whatsapp.com/send/?phone=79852111107&text='+title+'&type=phone_number&app_absent=0">Оформить в WhatsApp</a>');
        }
    }, 500);
}

// Регистрация шаблона для использования его в других шаблонах
let templatePartial = document.getElementById('singleReferenceTemplate');
Handlebars.registerPartial('reference',templatePartial.innerHTML);

// Получение координат пользователя при помощи HTML5 API
// У случае неудачи задаем координаты центра Москвы
let GetPosition = new Promise((resolve,reject) => {
    let currentPosition = [55.75302590638416, 37.62226466137695];

    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition((position) => {
            currentPosition = [position.coords.latitude, position.coords.longitude];
            resolve(currentPosition);
        }, (error) => {reject(error)})
    } else {
        resolve(currentPosition);
    }
});

GetPosition.then((position) => {
    // Конфигурация Яндекс.карт
    let config = {
        center: position,
        zoom: 14
    };

    // Инициализация Яндекс.карт
    ymaps.ready(init);

    function init() {
        let myMap = new ymaps.Map('map', config),

            // Создание собственного макета для баллуна, вплывающего при клике на карту и одиночную метку
            BalloonLayout = ymaps.templateLayoutFactory.createClass(
                `<div id="pop-up" class="panel">
                    <div class="panel-heading">
                        <h3 class="panel-title">
                            <span><i class="fa fa-map-marker"></i>{{properties.placemarkData.address|default: address}}</span>
                        </h3>
                        <span><i id="closeButton" class="fa fa-times"></i></span>
                    </div>
                    <div class="panel-body">
                        <ul id="referenceList" class="panel-references">                            
                            {% include options.contentLayout %}                          
                        </ul>
                        <div class="panel-form">
                            <h3>Ваш отзыв</h3>
                            <form action="" name="referencesForm">
                                <input type="text" name="name" placeholder="Ваше имя">
                                <input type="text" name="place" placeholder="Укажите место">
                                <textarea name="text" placeholder="Поделитесь впечатлениями"></textarea>
                                <input id="addButton" type="submit" value="Добавить">
                            </form>
                        </div>
                    </div>
                </div>`,{

                    // Строит экземпляр макета на основе шаблона и добавляет его в родительский HTML-элемент
                    build(){
                        this.constructor.superclass.build.call(this);

                        let closeButton = document.querySelector('#closeButton'),
                            addButton = document.querySelector('#addButton');

                        // Добаляем прослушку кликов на кнопку "Добавить" отзыв и на кнопку закрытия баллуна
                        addButton.addEventListener('click', this.onAddReference.bind(this));
                        closeButton.addEventListener('click', this.onCloseBtnClick.bind(this));
                    },

                    // Удаляет содержимое макета из DOM и отписывает прослушку событий на кнопках баллуна
                    clear(){
                        let closeButton = document.querySelector('#closeButton'),
                            addButton = document.querySelector('#addButton');

                        addButton.removeEventListener('click', this.onAddReference);
                        closeButton.removeEventListener('click', this.onCloseBtnClick);
                        this.constructor.superclass.clear.call(this);
                    },

                    // Используется для автопозиционирования баллуна (balloonAutoPan)
                    getShape() {
                        return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([ [0, 0], [380, 530] ]));
                    },

                    // Закрывает баллун при клике на крестик, кидая событие "userclose" на макете
                    onCloseBtnClick(e){
                        this.events.fire('userclose');
                    },

                    // Обработчик события нажатия на кнопку "Добавить" баллуна
                    onAddReference(e){
                        let name = document.querySelector('input[name=name]'),
                            place = document.querySelector('input[name=place]'),
                            text = document.querySelector('textarea[name=text]'),
                            refList = document.querySelector('#referenceList');

                        e.preventDefault();

                        // Промеряем заполнены ли все поля
                        if (name.value && place.value && text.value){
                            let template = Handlebars.compile(templatePartial.innerHTML),
                                ymapsElem =  refList.firstElementChild.firstElementChild,
                                coords = this.getData().properties? this.getData().properties.getAll().placemarkData.coords : this.getData().coords,
                                address = this.getData().properties? this.getData().properties.getAll().placemarkData.address : this.getData().address,
                                today = new Date(),
                                date, myPlacemark, placemarkData;

                            // Формируем представление даты и времени добавления отзыва
                            date = `${today.getFullYear()}.${checkDateContent(today.getMonth() + 1)}.${checkDateContent(today.getDate())} 
                                    ${checkDateContent(today.getHours())}:${checkDateContent(today.getMinutes())}:${checkDateContent(today.getSeconds())}`;

                            // Формируем объект с значениями всех полей, датой и координатами
                            placemarkData = {
                                coords: coords,
                                address: address,
                                name: name.value,
                                place: place.value,
                                date: date,
                                reference: text.value
                            };

                            // Добавляем объект placemarkData в массив, где хранятся все отзывы
                            data.push(placemarkData);
                            //Очищаем поля
                            name.value = place.value = text.value = '';
                            // Добавляем вновь добавленный отзыв в поле для отзывов баллуна
                            if (ymapsElem.firstElementChild) {
                                ymapsElem.innerHTML += template(placemarkData);
                            } else {
                                ymapsElem.innerHTML = template(placemarkData);
                            }
                            // Прокручиваем вниз поле для отзывов баллуна к новому отзыву
                            refList.scrollTop = refList.scrollHeight;
                            // Создаем новый геообъект Placemark с данными из объекта placemarkData
                            myPlacemark = this.onCreatePlacemark.call(this,placemarkData);
                            // И записываем его в кластер
                            clusterer.add(myPlacemark);
                            // Выводим/добавляем кластер на карту
                            myMap.geoObjects.add(clusterer);
                        } else {
                            // В случае если какое-то поле не заполнено выводим предупреждение
                            alert('Заполните поля!');
                        }
                    },

                    // Создание нового геообъекта типа "метка"
                    onCreatePlacemark(placemarkData) {
                        return new ymaps.Placemark(placemarkData.coords, {
                            placemarkData: placemarkData                // записываем данные о метке с отзывом
                        }, {
                            iconLayout: FontAwesomeLayout,              // выводим иконку метки со своим макетом
                            iconShape: {                                // описание геометрии иконки
                                type: 'Rectangle',
                                coordinates: [[0, 0], [26, 40]]
                            },
                            iconOffset: [-10, -40],                     // смещение иконки
                            balloonLayout: BalloonLayout,               // задание своего макета для баллуна метки
                            balloonContentLayout: BalloonContentLayout, // задание своего макета для содержимого баллуна
                            balloonPanelMaxMapArea: 0                   // запрет отрывания баллуна в виде панели
                        });
                    }
                }
            ),

            // Создание собственного макета для содержимого баллуна, вплывающего при клике на карту и одиночную метку
            BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
                `{% if properties.placemarkData %}
                <li class="refer-item">
                    <span class="name">{{properties.placemarkData.name}},</span>
                    <span class="place">{{properties.placemarkData.place}},</span>
                    <span class="date">{{properties.placemarkData.date}}</span>
                    <div class="refer-text">{{properties.placemarkData.reference}}</div>
                </li>
                {% endif %}
                <!--{% if foundPlacemarks %}
                    {% for refer in foundPlacemarks %}
                         <li class="refer-item">
                            <span class="name">{{refer.name}}</span>
                            <span class="place">{{refer.place}}</span>
                            <span class="date">{{refer.date}}</span>
                            <div class="refer-text">{{refer.reference}}</div>
                        </li>
                    {% endfor %}
                {% endif %}-->
                {% if content %}
                    {{content|raw}}
                {% endif %}`
            ),

            // Создание собственного макета содержимого баллуна, вплывающего при клике на кластеризатор
            customItemContentLayout = ymaps.templateLayoutFactory.createClass(
                `<div class="cluster-balloon">
                    <h2 class="cluster-balloon-header">{{properties.placemarkData.place}}</h2>
                    <a href="#" id="addressLink">{{properties.placemarkData.address}}</a>
                    <div class="cluster-balloon-body">{{properties.placemarkData.reference}}</div>
                    <div class="cluster-balloon-footer">{{properties.placemarkData.date}}</div>
                </div>`,
                {
                    build(){
                        this.constructor.superclass.build.call(this);
                        let link = document.querySelector('#addressLink');
                        // Слушаем клик по ссылке
                        link.addEventListener('click', this.onLinkClick.bind(this))
                    },

                    clear(){
                        let link = document.querySelector('#addressLink');
                        link.removeEventListener('click', this.onLinkClick);
                        this.constructor.superclass.clear.call(this);
                    },

                    // Обработчик события клика по ссылке адреса, где был размещен отзыв
                    onLinkClick(e){
                        let coords = this.getData().properties.getAll().placemarkData.coords,
                            source = document.querySelector("#multiReferenceTemplate").innerHTML,
                            template = Handlebars.compile(source),
                            foundPlacemarks = [];

                        e.preventDefault();
                        // Находим все отзывы по адресу, по которому кликнули на ссылке
                        foundPlacemarks = data.filter((placemark) => {
                            return (coords[0] === placemark.coords[0] && coords[1] === placemark.coords[1])
                        });
                        // Открываем новый баллун со всеми отзывами по указанному адресу
                        myMap.balloon.open(coords,{
                            coords: coords,
                            address: foundPlacemarks[0].address,        // Адрес, гды были оставлены отзывы
                            content: template({list: foundPlacemarks})  // Формируем отображение всех отзывов
                        },{
                            layout: BalloonLayout,                      // задание своего макета для баллуна метки
                            contentLayout: BalloonContentLayout         // задание своего макета для содержимого баллуна
                        });
                        // Зарываем баллун кластеризатора
                        this.events.fire('userclose');
                    }
                }
            ),

            // Создание собственного макета иконки для метки (Placemark)
            FontAwesomeLayout = ymaps.templateLayoutFactory.createClass(
                '<i class="fa fa-map-marker" id="placemarker"></i>'),

            // Создание кластеризатора
            clusterer = new ymaps.Clusterer({
                preset: 'islands#invertedVioletClusterIcons',
                gridSize: 128,
                clusterDisableClickZoom: true,
                clusterHideIconOnBalloonOpen: true,
                // Используем макет "карусель"
                clusterBalloonContentLayout: "cluster#balloonCarousel",
                // Запрещаем зацикливание списка при постраничной навигации
                clusterBalloonCycling: false,
                // Настройка внешнего вида панели навигации. Элементами панели навигации будут маркеры
                clusterOpenBalloonOnClick: true,
                // Устанавливаем собственный макет
                clusterBalloonItemContentLayout: customItemContentLayout,
                // Устанавливаем режим открытия баллуна: баллун никогда не будет открываться в режиме панели
                clusterBalloonPanelMaxMapArea: 0
            }),

            // Функция формирвания отображения состовляющего даты/времени в правильном формате
            checkDateContent = (source) => {
                return (source < 10)? '0'+ source : source.toString();
            },

            // Массив, хранящий все отзывы
            data = [];


        // Слушаем клик на карте
        myMap.events.add('click', (e) => {
            // Определяем координаты, где был совершен клик
            let coords = e.get('coords');

            // Определяем адрес по координатам
            ymaps.geocode(coords).then((res) => {
                let object = res.geoObjects.get(0),
                    address = object.properties.get('text');

                // Открываем баллун с координатами клика, собственными шаблонами и начальными данными
                myMap.balloon.open(coords,{
                    coords: coords,                     // Передаяа координат, где был открыт баллун
                    address: address,                   // Передача адреса для отображения в заголовке баллуна
                    content: 'Отзывов пока нет...'
                },{
                    layout: BalloonLayout,              // задание своего макета баллуна
                    contentLayout: BalloonContentLayout // задание своего макета для содержимого баллуна
                });
            });
        });
    }
}).catch((error) => {alert(error.message)}); // В случае ошибки, выводим ее

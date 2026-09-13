# Каталог товаров

Обработка заказов без Redis и планировщика: [docs/order-deployment.md](docs/order-deployment.md). Используются только существующие Google Sheets и Telegram, со скрытой меткой заказа для проверки повторов.

## Локальная проверка без отправки заказов

Запустите `npm run dev` из корня проекта и откройте http://localhost:3000. Команда подготовит каталог, запустит React и отдельный локальный тестовый API. На сайте появится жёлтое уведомление о тестовом режиме. Остановка — Ctrl+C.

Заказы сохраняются в `.local-test-orders/<номер-заказа>.json` (папка исключена из Git). Файл содержит товары, количество, цены, итог и отметки `not_sent` для Telegram и Google Sheets. Настоящий обработчик `api/submit-order.js` не загружается: этот режим не обращается к внешним сервисам даже при наличии рабочих ключей в окружении. Это проверка оформления заказа и локального сохранения, а не доставки в Telegram или Google Sheets.

`npm start` запускает только интерфейс; для оформления локальных тестовых заказов используйте `npm run dev`. Production-сборка и обработчик заказов на хостинге продолжают работать как раньше. Локальные заказы и прошлый заказ в localStorage на localhost не затрагивают данные рабочего домена.

Источник каталога — `public/Цены.xlsx`. Каждый лист задаёт категорию; столбцы A, B, C содержат код номенклатуры, название и цену. Можно использовать первую строку с заголовками «Код», «Название», «Цена» или начинать сразу с товаров. Пустые строки и пустые листы пропускаются.

Код должен быть уникальным во всей книге и постоянным при переименовании или переносе товара. Для кодов с ведущими нулями используйте текстовый формат ячейки Excel. Фотографии называются по коду товара в `public/product-images/`; при отсутствии фотографии показывается заглушка. Товары без цены не публикуются (с предупреждением). Полностью одинаковые строки в одной категории объединяются с предупреждением; конфликтующие коды останавливают сборку.

`npm run build` автоматически проверяет Excel и создаёт `src/data/catalog.generated.json`. JSON включается в JS-сборку с хешем содержимого, поэтому отдельного запроса Excel из браузера нет. Генерируемый файл не нужно коммитить. Те же действия выполняются перед `npm start` и `npm test`; после редактирования таблицы во время локальной разработки запустите `npm run catalog:build`.

Для обновления цен коммитьте Excel и отправляйте изменения в main. Если хостинг собирает проект командой `npm run build`, дополнительная настройка не нужна. Ошибки кодов, цен и обязательных полей останавливают сборку с указанием листа и строки.

Сохранённые заказы используют `lastOrder:v2` и версию схемы в `src/orderStorage.js`. Старый ключ `lastOrder` удаляется при открытии обновлённого приложения. Остальные данные браузера не очищаются. Новые заказы восстанавливаются только по точному коду, с текущими ценами каталога. При будущей несовместимой смене идентификаторов измените версию и ключ и добавьте удаление предыдущего ключа. Обычная переоценка не требует очистки заказов. Незавершённая корзина, как и раньше, не сохраняется.

Проверка преобразования: `node --test scripts/build-catalog.test.cjs`.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

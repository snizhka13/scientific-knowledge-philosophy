# Філософія наукового пізнання: творча робота

Односторінковий сайт (SPA) для вивчення курсу за 10 темами: кросворди, книги-джерела з читалкою та презентації.

## Чому такий стек

- **Vite + React.** Сайт статичний, без сервера й SEO-вимог, тому Next.js не потрібен. Vite збирає швидко, а React зручний для читалки й переглядача презентацій.
- **React Router з HashRouter.** Адреси виду `/#/books` працюють на Vercel без додаткових налаштувань.
- **GSAP + ScrollTrigger + SplitText.** Анімації: поява заголовка, біжучий рядок, горизонтальна стрічка тем, рукописні цитати, завіса між сторінками. Якщо в системі ввімкнено «зменшити рух», анімації вимикаються.
- **Canvas 2D.** Погруддя Сократа з ~12 тис. точок, що перетворюється на атом, книгу, колбу й знак питання та реагує на курсор і скрол (`src/components/ParticleBust.jsx`). Точки отримано семплінгом яскравості фото (`src/data/socrates-points.js`).

## Запуск

Потрібен Node.js 20.19 або новіший (вимога Vite 7).

```bash
npm install
npm run dev       # локально: http://localhost:5173
npm run build     # збірка в dist/
npm run preview   # перегляд зібраної версії
```

Кеш Vite лежить у системній тимчасовій папці (`vite.config.js`, `cacheDir`), а не в `node_modules/.vite`, щоб iCloud не вивантажував його й dev-сервер не зависав.

## Деплой

Сайт статичний, тож підійде будь-який хостинг статики.

- **Vercel.** Import з GitHub, Framework Preset: Vite, Build Command: `npm run build`, Output Directory: `dist`. Нічого більше налаштовувати не треба: маршрутизація хешова (`/#/books`), тому перезаписи адрес не потрібні.
- **GitHub Pages.** Теж працює без змін, бо `base: "./"` робить усі шляхи відносними: достатньо опублікувати вміст `dist/`.

## Структура

```
index.html
vite.config.js
public/
  books/<книга>/NN.json   тексти розділів для читалки
  images/                 фото для карток тем і розділів
  presentations/          tema-NN.pdf для завантаження
  favicon.svg
scripts/
  split-books.py          розбиває тексти джерел на розділи
  build-slides-pdf.mjs    друкує презентації в PDF через Playwright
src/
  pages/        Home, Crossword, Books, Reader, Presentations, Deck, NotFound
  components/   Header, Footer, Cursor, Transition (завіса між сторінками), ParticleBust (Сократ із точок),
                Book3D і BookSpread (книги), PhotoBg, reader/ (читалка), slides/ (слайд)
  data/         course.js (теми, джерела, цитати), library.js і chapters.js (книги),
                slides.js (презентації), images.js, socrates-points.js
  styles/       global, home, pages, books, reader, presentations, slides, deck
```

## Етапи

1. Головна сторінка ✓
2. Сторінка вибору книг ✓
3. Читалка: цитати, закладки, словничок ✓
4. Презентації: 10 тем, перегляд і завантаження ✓

## Погруддя Сократа

Фото: [Socrates Louvre.jpg](https://commons.wikimedia.org/wiki/File:Socrates_Louvre.jpg), автор Eric Gaba (Sting), Wikimedia Commons, CC BY-SA 2.5 (саме погруддя — суспільне надбання). З фото згенеровано хмару точок, тож цю похідну графіку слід поширювати на тих самих умовах CC BY-SA.

## Фото на картках

Фото для карток тем і розділів кладуться в `public/images/` з такими назвами:
`topic-01.jpg` … `topic-10.jpg`, `section-crossword.jpg`, `section-books.jpg`, `section-slides.jpg`.
Поки файлу немає, картка показує темний градієнт у кольорах сайту. Усі фото взято з Wikimedia Commons і зменшено до 1000 px:

| Файл | Зображення | Автор фото | Ліцензія | Джерело |
|---|---|---|---|---|
| `topic-01.jpg` | Рафаель, «Афінська школа» | Raphael | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg) |
| `topic-02.jpg` | Армілярна сфера, Музей Бургаве (Лейден) | Mike Peel | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Armillary_sphere,_Museum_Boerhaave_Leiden.jpg) |
| `topic-03.jpg` | Long Room, бібліотека Трініті-коледжу (Дублін) | Diliff | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Long_Room_Interior,_Trinity_College_Dublin,_Ireland_-_Diliff.jpg) |
| `topic-04.jpg` | О. Бірн, «Перші шість книг „Начал“ Евкліда» (1847) | Oliver Byrne | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_First_Six_Books_of_the_Elements_of_Euclid.jpg) |
| `topic-05.jpg` | К. Д. Фрідріх, «Мандрівник над морем туману» | Caspar David Friedrich | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg) |
| `topic-06.jpg` | Леонардо да Вінчі, «Вітрувіанська людина» | Leonardo da Vinci | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg) |
| `topic-07.jpg` | Гравюра Фламмаріона (1888) | Невідомий автор | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flammarion.jpg) |
| `topic-08.jpg` | Дж. Райт із Дербі, «Дослід з птахом у повітряній помпі» | Joseph Wright of Derby | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:An_Experiment_on_a_Bird_in_an_Air_Pump_by_Joseph_Wright_of_Derby,_1768.jpg) |
| `topic-09.jpg` | Рембрандт, «Філософ у роздумах» | Rembrandt | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rembrandt_-_The_Philosopher_in_Meditation.jpg) |
| `topic-10.jpg` | «Схід Землі», Аполлон-8 (NASA) | NASA/Bill Anders | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise.jpg) |
| `section-crossword.jpg` | О. Роден, «Мислитель» | AndrewHorne | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Thinker,_Rodin.jpg) |
| `section-books.jpg` | Бібліотека абатства Адмонт (Австрія) | Jorge Royan | CC BY-SA 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Austria_-_Admont_Abbey_Library_-_1326.jpg) |
| `section-slides.jpg` | Дж. Райт із Дербі, «Філософ читає лекцію про оррерій» | Joseph Wright of Derby | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Joseph_Wright_of_Derby_-_Philosopher_giving_a_lecture_on_the_orrery_-_Google_Art_Project.jpg) |

Для фото з ліцензіями CC BY та CC BY-SA обов’язково зазначати автора й ліцензію, тому вони перелічені тут і в підвалі сайту.

## Читалка

Тексти трьох джерел розбито на розділи скриптом `scripts/split-books.py`: результат лежить у `public/books/<книга>/NN.json` (розділ 00 — вступ чи передмова) і вантажиться по одному розділу, а `src/data/chapters.js` містить назви, обсяг і першу сторінку кожного розділу. Абзаци зберігають номер сторінки видання, тож цитати й словничок посилаються на конкретні сторінки.

Усе, що робить читач, зберігається у браузері (`localStorage`): позиція та прогрес, цитати з підсвіткою в тексті, закладки, словничок і налаштування вигляду (тема, шрифт, розмір, інтерліньяж). Цитати й словничок експортуються в PDF і Markdown.

## Презентації

Зміст усіх десяти презентацій лежить в одному файлі `src/data/slides.js`: на кожну тему обкладинка з планом, по слайду на кожен пункт плану (стисла теорія у вигляді карток, кроків або порівняння, дослівна цитата зі сторінкою, перелік сторінок джерел) і підсумковий слайд із ключовими поняттями та джерелами. Плани тем ті самі, що й у кросворді.

- **На сайті.** `/#/presentations` показує 10 колод, `/#/presentations/N` відкриває переглядач: стрілки, пробіл, Home/End, `F` повний екран, `G` усі слайди, свайп на телефоні, прогрес і перехід на будь-який слайд. Позиція в кожній колоді запам’ятовується. На вузькому портретному екрані слайд перекомпоновується в одну колонку й гортається вертикально.
- **PDF.** `npm run build`, `npx vite preview --port 4173`, потім `npm run slides:pdf`: Playwright друкує маршрут `/#/presentations/N/print`, тож PDF має ті самі шрифти й верстку, що й сайт. Потрібен `npm i -D playwright`.

Після зміни `slides.js` треба перегенерувати PDF.

## Відкриті питання

- **Видання Ханстантинова.** У списку літератури курсу: «Філософія науки: курс лекцій», МНАУ, 2017, 188 с. Текст, з якого взято цитати й дані для сайту: «Філософія: курс лекцій», МНАУ, 2021, 151 с. Поки на сайті вказано видання 2021 року (за файлом). Номери сторінок у цитатах відповідають саме йому.

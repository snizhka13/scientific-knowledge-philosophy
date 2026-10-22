// Фото для карток. Файли лежать у public/images/, повний перелік джерел у README.
// position задає, яку частину фото видно в картці.
const img = (file, position = "50% 50%") => ({ src: `./images/${file}`, position });

export const TOPIC_IMAGES = {
  1: img("topic-01.jpg", "50% 60%"), // Рафаель, «Афінська школа»
  2: img("topic-02.jpg", "50% 30%"), // Армілярна сфера
  3: img("topic-03.jpg"), // Long Room, Трініті-коледж
  4: img("topic-04.jpg", "75% 50%"), // Бірн, «Начала» Евкліда
  5: img("topic-05.jpg", "50% 40%"), // Фрідріх, «Мандрівник над морем туману»
  6: img("topic-06.jpg", "50% 45%"), // Леонардо, «Вітрувіанська людина»
  7: img("topic-07.jpg"), // Гравюра Фламмаріона
  8: img("topic-08.jpg", "45% 50%"), // Райт, «Дослід з птахом у повітряній помпі»
  9: img("topic-09.jpg", "30% 50%"), // Рембрандт, «Філософ у роздумах»
  10: img("topic-10.jpg", "50% 45%"), // «Схід Землі», NASA
};

export const SECTION_IMAGES = {
  crossword: img("section-crossword.jpg", "50% 25%"), // Роден, «Мислитель»
  books: img("section-books.jpg"), // Бібліотека абатства Адмонт
  slides: img("section-slides.jpg", "50% 45%"), // Райт, «Філософ читає лекцію про оррерій»
};

// Фото, ліцензії яких вимагають зазначити автора.
export const PHOTO_CREDITS = [
  "Погруддя Сократа (точки за фото): Eric Gaba, CC BY-SA 2.5",
  "Армілярна сфера: Mike Peel, CC BY-SA 4.0",
  "Long Room: Diliff, CC BY-SA 4.0",
  "Бібліотека Адмонт: Jorge Royan, CC BY-SA 3.0",
];

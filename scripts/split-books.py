# Розбиває тексти джерел на розділи з абзацами й номерами сторінок.
# Запуск: python3 scripts/split-books.py <тека-для-json> <titles.json>
# SRC — тека з .txt текстами книг (crossword-sources).
import re, json, os, sys
SRC = '/mnt/project-files/crossword-sources'
OUT = sys.argv[1]

KEEP_LEFT = {'будь','хоч','казна','бозна','хтозна'}
WORDS = set()
for _f in ['tararoiev-2023.txt','kuz-cheshko-2017.txt','khanstantynov-2017.txt']:
    for _l in open(os.path.join(SRC, _f), encoding='utf-8'):
        # слова всередині рядка (не на переносі)
        for _w in re.findall(r"[А-Яа-яІіЇїЄєҐґ'’-]+(?=[\s,.;:!?)»\"])", _l.rstrip() + ' '):
            WORDS.add(_w.lower())

def norm_line(l):
    return l.replace('\f', '').replace('­', '').rstrip()

def is_footer(l):
    # номер сторінки стоїть по центру рядка
    return re.fullmatch(r'\s{10,}\d{1,3}\s*', l) is not None

def drop_footnotes(lines):
    """Виноски внизу сторінки: рядок лише з номером без відступу, далі текст виноски до номера сторінки.
    На сайті їх не видно як виноски, тож прибираємо весь блок."""
    i = 0
    while i < len(lines):
        if re.fullmatch(r'\d{1,2}', lines[i]):
            j = i + 1
            while j < len(lines) and j - i <= 14 and not is_footer(lines[j]): j += 1
            if j < len(lines) and is_footer(lines[j]):
                for k in range(i, j): lines[k] = ''
                i = j
                continue
        i += 1

def join(prev, nxt):
    # перенос слова в кінці рядка
    m = re.search(r'([А-Яа-яІіЇїЄєҐґ\'’]+)-$', prev)
    if m and nxt[:1].islower():
        left = m.group(1)
        right = re.match(r'[А-Яа-яІіЇїЄєҐґ\'’]+', nxt)
        right = right.group(0) if right else ''
        merged = (left + right).lower()
        hyph = (left + '-' + right).lower()
        if merged in WORDS: compound = False
        elif hyph in WORDS: compound = True
        else: compound = (len(left) >= 6 and left[-1] == 'о' and len(right) >= 5) or left.lower() in KEEP_LEFT or right.startswith('небудь')
        if not compound:
            return prev[:-1] + nxt
        return prev + nxt
    return prev + ' ' + nxt

def paragraphs(lines):
    """lines: list of (text, page) -> list of paragraphs {t, pg}"""
    out = []
    cur = None
    for raw, pg in lines:
        if not raw.strip():
            if cur: out.append(cur); cur = None
            continue
        indent = len(raw) - len(raw.lstrip(' '))
        txt = re.sub(r'\s+', ' ', raw.strip())
        starts = indent >= 3
        centered = indent >= 12
        if cur is None or starts or centered or cur.get('c'):
            if cur: out.append(cur)
            cur = {'t': txt, 'pg': pg, 'c': centered}
        else:
            cur['t'] = join(cur['t'], txt)
    if cur: out.append(cur)
    # склеюємо абзаци, розірвані межею сторінки (продовження з малої літери)
    merged = []
    for p in out:
        if merged and p['t'][:1].islower() and not merged[-1].get('c') and not re.search(r'[.!?:;]$', merged[-1]['t']):
            merged[-1]['t'] = join(merged[-1]['t'], p['t'])
        else:
            merged.append(p)
    res = []
    for p in merged:
        t = p['t'].strip()
        if not t: continue
        caps = re.sub(r'[^А-ЯІЇЄҐA-Z]', '', t)
        letters = re.sub(r'[^А-Яа-яІіЇїЄєҐґA-Za-z]', '', t)
        head = len(t) < 160 and (
            re.match(r'^\d+(\.\d+)+\.?\s+\S', t) is not None
            or (letters and len(caps) / len(letters) > 0.8 and len(letters) > 3)
            or re.match(r'^(Лекція \d+|Тема:|План$|МОДУЛЬ)', t) is not None
            or (p.get('c') and not re.search(r'[.,;]$', t) and len(t) < 90)
        )
        res.append({'k': 'h' if head else 'p', 't': t, 'pg': p['pg']})
    return res

# Таблиці, які у тексті розсипаються на перемішані колонки: переписані вручну рядок за рядком.
TABLES = {
    'Таблиця 1.1': [
        ('h', 'Порівняльний аналіз основних ознак і атрибутів техногенної цивілізації і традиційного суспільства (табл. 1.1)'),
        ('p', 'Динаміка соціальних перетворень. Традиційне суспільство: повільний темп соціального розвитку (сторіччя і тисячоріччя). Техногенна цивілізація: украй швидкий темп соціоекономічного і соціополітичного розвитку (десятиріччя).'),
        ('p', 'Сприйняття часу. Традиційне суспільство: циклічне ("немає нічого нового під Сонцем, що було, те і буде"). Техногенна цивілізація: осьове (стріла часу, від минулого до майбутнього).'),
        ('p', 'Сприйнятливість до чужорідних впливів. Традиційне суспільство: закрите суспільство. Техногенна цивілізація: відкрите суспільство.'),
        ('p', 'Цінності і пріоритети. Традиційне суспільство: сталість, стійкість, безпека. Техногенна цивілізація: новизна, поліпшення якості життя, соціальний і науково-технологічний прогрес.'),
        ('p', 'Психологія. Традиційне суспільство: соціальний статус і психологічні характеристики індивідуума визначаються його приналежністю до певної соціальної спільноти, корпорації; щастя – гармонія відносин індивідуума і суспільства. Техногенна цивілізація: автономна, здатна до саморозвитку на основі вільного вибору особистості; щастя – воля.'),
        ('p', 'Відносини індивідуума і суспільства. Традиційне суспільство: домінування колективістських інтересів над індивідуальними; благо суспільства – вище за все. Техногенна цивілізація: пріоритет індивідуальних інтересів над суспільними, суспільне благо досягається на основі діяльності самостійних його членів.'),
        ('p', 'Природа і джерела влади. Традиційне суспільство: влада має трансцендентальне, божественне походження і є успадкованою від предків ознакою. Влада розуміється, насамперед, як здатність контролювати поведінку суб\'єктів (інших людей). Техногенна цивілізація: влада визначається системою комунікативних зв\'язків між людьми, володіння владою є результатом соціального контракту, джерело влади – знання. Влада розуміється, насамперед, як здатність контролювати властивості та вплив об\'єктів (явищ і процесів).'),
        ('p', 'Політична організація. Традиційне суспільство: тяжіння до авторитарної ієрархічної схеми організації суспільства. Техногенна цивілізація: тяжіння до демократичної схеми організації суспільства.'),
        ('p', 'Соціальна структура. Традиційне суспільство: суспільство – єдиний організм, де кожен його член виконує соціальну роль, успадковану від предків. Техногенна цивілізація: суспільство – самоорганізована система, що формується на основі спонтанних зв\'язків між його членами. Кожен індивідуум може грати різні соціальні ролі в залежності від часу і обставин.'),
        ('p', 'Економіка і політика. Традиційне суспільство: господарський механізм побудований по типу простого відтворення; влада не асоціюється безпосередньо з нагромадженням капіталу. Техногенна цивілізація: господарський механізм заснований на розширеному відтворенні; влада і капітал асоційовані один з одним.'),
    ],
    'Таблиця 6.1': [
        ('h', 'Різні типи соціоекономічних моделей (табл. 6.1)'),
        ('p', 'Інвестиційна модель – організація і впровадження інвестиційних проектів, тобто раціональне використання економічних ресурсів.'),
        ('p', 'Інвесторна модель – організація і залучення ресурсів для здійснення тих чи інших проектів.'),
        ('p', 'Організаційна модель – раціоналізація й оптимізація комбінування і інтеграції економічних ресурсів – людських, фінансових, інформаційних, інтелектуальних і т. д. Наприклад, схеми виробничого циклу, тактичні і стратегічні плани, системи оплати праці і планування та ін.'),
        ('p', 'Активізаційна модель – організація контролю науково-дослідних і дослідно-конструкторських розробок.'),
        ('p', 'Комерційна модель – створення нових каналів обміну, що підвищують норму прибутку.'),
        ('p', 'Кон\'юнктурно-ігрова модель – способи використання конфіденційної інформації для забезпечення максимально можливого економічного ефекту.'),
        ('p', 'Консалтингова модель – розроблення форм і технологій інформаційного забезпечення різних типів економічної діяльності.'),
    ],
}
# перший абзац основного тексту після таблиці
TABLE_END = {'Таблиця 1.1': 'Традиційне суспільство – стабільне', 'Таблиця 6.1': 'Далі буде розглянуто'}
FORMULA = re.compile(r'^[,\s]*\(\d+\.\d+\)$')
FIGURE = re.compile(r'^(рис\.|рисунок)\s*\d', re.I)

def clean(book_id, paras):
    """Прибирає те, що на сайті не має змісту: підписи до рисунків разом з уривками написів зі схем,
    номери формул без самих формул, номери виносок, приліплені до слів, і таблиці, що розсипалися
    на колонки (їх замінено на TABLES)."""
    out = []
    i = 0
    while i < len(paras):
        p = paras[i]
        t = p['t']
        if t in TABLES:
            pg = p['pg']
            out += [{'k': k, 't': x, 'pg': pg} for k, x in TABLES[t]]
            i += 1
            while i < len(paras) and not paras[i]['t'].startswith(TABLE_END[t]):
                i += 1
            continue
        if FORMULA.match(t):
            # номер формули без самої формули (вона була картинкою) і підпис під нею одним словом
            i += 1
            while i < len(paras) and paras[i]['k'] == 'h' and re.fullmatch(r'[А-ЯІЇЄҐа-яіїєґ]+', paras[i]['t']):
                i += 1
            continue
        if FIGURE.match(t) and len(t) < 160:
            # написи зі схеми над підписом: короткі рядки без крапки в кінці
            while out and len(out[-1]['t']) < 70 and not re.search(r'[.:;]$', out[-1]['t']) and not re.match(r'^\d+(\.\d+)+', out[-1]['t']):
                out.pop()
            i += 1
            continue
        if book_id in ('tararoiev-2023', 'kuz-cheshko-2017'):
            # номер виноски, приліплений до слова: «практики2.» → «практики.»
            t = re.sub(r'(?<=[а-яіїєґ»"”)])\d{1,2}(?=[\s.,;:!?)»]|$)', '', t)
        out.append({**p, 't': t})
        i += 1
    return out

def load(fname):
    raw = open(os.path.join(SRC, fname), encoding='utf-8').read().split('\n')
    lines = [norm_line(l) for l in raw]
    drop_footnotes(lines)
    # сторінка рядка = номер наступного колонтитула-числа
    pages = [None] * len(lines)
    pend = []
    last = 0
    for i, l in enumerate(lines):
        if is_footer(l):
            n = int(l.strip())
            for j in pend: pages[j] = n
            pend = []; last = n
            lines[i] = ''
        else:
            pend.append(i)
    for j in pend: pages[j] = last + 1
    return lines, pages

def find(lines, pat, start=0, stop=None):
    r = re.compile(pat)
    for i in range(start, stop or len(lines)):
        if r.search(lines[i]): return i
    raise SystemExit(f'not found: {pat} after {start}')

def build(book_id, fname, bounds, titles, intro_title):
    lines, pages = load(fname)
    chapters = []
    for k, (a, b) in enumerate(bounds):
        paras = clean(book_id, paragraphs([(lines[i], pages[i]) for i in range(a, b)]))
        title = intro_title if k == 0 else titles[k - 1]
        if paras and paras[0]['k'] == 'p' and len(paras[0]['t']) < 160:
            paras[0]['k'] = 'h'
        chapters.append({'title': title, 'paras': paras})
    d = os.path.join(OUT, book_id); os.makedirs(d, exist_ok=True)
    index = []
    for k, ch in enumerate(chapters):
        json.dump(ch, open(os.path.join(d, f'{k:02d}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        words = sum(len(re.findall(r"[\wʼ'’-]+", p['t'])) for p in ch['paras'])
        index.append({'title': ch['title'], 'words': words, 'page': ch['paras'][0]['pg'] if ch['paras'] else None, 'paras': len(ch['paras'])})
    return index

def starts_from(lines, pats, start):
    res = []
    for p in pats:
        i = find(lines, p, start)
        res.append(i); start = i + 1
    return res

result = {}
# Тарароєв
lines, _ = load('tararoiev-2023.txt')
intro = find(lines, r'^\s+ВСТУП\s*$', 170)
heads = []
s = intro
for n in [1,2,3,4,5,1,2,3,4,5,6,7,8,9,1,2]:
    i = find(lines, rf'^\s*ГЛАВА {n}\.', s); heads.append(i); s = i + 1
# заголовок «РОЗДІЛ N» над главою відносимо до неї
heads = [h - 4 if re.search(r'РОЗДІЛ', ' '.join(lines[h-5:h])) else h for h in heads]
end = find(lines, r'Навчальне видання', heads[-1])
starts = [intro] + heads
bounds = list(zip(starts, starts[1:] + [end]))
import importlib.util
titles = json.load(open(sys.argv[2]))
result['tararoiev-2023'] = build('tararoiev-2023', 'tararoiev-2023.txt', bounds, titles['tararoiev-2023'], 'Вступ')

# Кузь, Чешко
lines, _ = load('kuz-cheshko-2017.txt')
intro = find(lines, r'^\s+Вступ\s*$', 90)
pats = [r'^\s*1\. Наука як культурно', r'^\s*2\. Генезис та еволюція', r'^\s*3\. Наука як соціальний інститут\.', r'^\s*4\. Соціокультурна детермінація',
        r'^\s*5\. Логіка й методологія', r'^\s*6\. Гносеологія та епістемологія', r'^\s*7\. Онтологія науки', r'^\s*8\. Еволюційна епістемологія']
heads = starts_from(lines, pats, intro)
end = find(lines, r'^\s+Використана і рекомендована література', heads[-1])
starts = [intro] + heads
result['kuz-cheshko-2017'] = build('kuz-cheshko-2017', 'kuz-cheshko-2017.txt', list(zip(starts, starts[1:] + [end])), titles['kuz-cheshko-2017'], 'Вступ')

# Ханстантинов
lines, _ = load('khanstantynov-2017.txt')
intro = find(lines, r'^\s+ПЕРЕДМОВА', 50)
heads = starts_from(lines, [rf'^\s+Лекція {n}\s*$' for n in range(1, 16)], intro)
heads = [h - 1 if 'МОДУЛЬ' in lines[h-1] else h for h in heads]
end = find(lines, r'^\s+ЛІТЕРАТУРА\s*$', heads[-1])
starts = [intro] + heads
result['khanstantynov-2017'] = build('khanstantynov-2017', 'khanstantynov-2017.txt', list(zip(starts, starts[1:] + [end])), titles['khanstantynov-2017'], 'Передмова')

json.dump(result, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in result.items():
    print(k, len(v), sum(c['words'] for c in v), [c['words'] for c in v])

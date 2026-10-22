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
    return re.fullmatch(r'\s*\d{1,3}\s*', l) is not None

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

def load(fname):
    raw = open(os.path.join(SRC, fname), encoding='utf-8').read().split('\n')
    lines = [norm_line(l) for l in raw]
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
        paras = paragraphs([(lines[i], pages[i]) for i in range(a, b)])
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

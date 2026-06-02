"""课表解析器 — 坐标提取 + 正则课程解析"""
import re, pdfplumber

T = {1:('08:05','08:55'),2:('08:55','09:40'),3:('10:00','10:50'),4:('10:50','11:40'),
     5:('13:30','14:20'),6:('14:25','15:15'),7:('15:20','16:10'),8:('16:10','17:00'),
     9:('18:00','18:50'),10:('18:50','19:40'),11:('19:40','20:30'),12:('20:30','21:20')}
DAYS = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日']

def parse(filepath):
    """主入口"""
    courses = []
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            try:
                w = page.extract_words(x_tolerance=3, y_tolerance=3, keep_blank_chars=True, use_text_flow=False)
            except: continue
            if not w or len(w) < 50: continue

            # 工作日 header X 坐标
            dx = {}
            for i in w:
                for d in DAYS:
                    if d in i['text']:
                        x = round(i['x0'])
                        if x not in dx: dx[x] = d
            if len(dx) < 3: continue

            xs = sorted(dx.keys())
            cols = []
            for i, x in enumerate(xs):
                short = '周' + dx[x][2]
                x1 = xs[i+1] - 8 if i+1 < len(xs) else 9999
                cols.append((short, x - 3, x1))

            # Period 标记
            periods = []
            for i in w:
                t = i['text'].strip()
                if re.match(r'^\d{1,2}$', t) and 1 <= int(t) <= 12:
                    periods.append((int(t), i['top'], i['bottom']))
            periods.sort(key=lambda x: x[1])

            # 获取表头 Y 范围
            header_ys = set()
            for i in w:
                for d in DAYS:
                    if d in i['text']:
                        header_ys.add(round(i['top']))
            header_y_min = min(header_ys) - 5 if header_ys else 0
            header_y_max = max(header_ys) + 5 if header_ys else 0

            # 每个格子的文字
            for pi, (pnum, y0, y1) in enumerate(periods):
                # 跳过表头区域
                if y0 <= header_y_max: continue
                y_next = periods[pi+1][1] + 20 if pi+1 < len(periods) else 9999
                for day, x0, x1 in cols:
                    cell_text = ''.join(i['text'] for i in w
                        if x0 <= i['x0'] <= x1 and max(y0 - 3, header_y_max) <= i['top'] <= y_next
                        and not any(d in i['text'] for d in DAYS))
                    if cell_text.strip():
                        _parse_cell(cell_text, day, pnum, courses)

    # 当前仅 page 1 被正确处理（layout 一致）
    return courses

def _parse_cell(text, day, period, out):
    """从单元格文字中提取课程"""
    text = text.replace('\n', ' ').strip()
    for m in re.finditer(
        r'([\w一-鿿]{2,40}?)([★●@])?\s*\((\d+)-(\d+)节\)(.+?)(?=[\w一-鿿]{2,40}[★●@]?\s*\(\d+-\d+节\)|$)',
        text
    ):
        name = m.group(1).strip()
        sp, ep = int(m.group(3)), int(m.group(4))
        rest = (m.group(5) or '').strip()

        if len(name) < 2: continue
        if re.match(r'^[\d;，、&\s./:：]+$', name): continue
        if any(name.startswith(b) for b in ['校区','场地','教师','教学班','打印时间','星期']): continue

        loc = re.search(r'场地[:：]([^/]+)', rest)
        tch = re.search(r'教师[:：]([^/]+)', rest)
        st, et = T.get(sp, ('','')), T.get(ep, ('',''))

        out.append({
            'day': day, 'period': period, 'name': name.replace(' ',''),
            'start_period': sp, 'end_period': ep,
            'start_time': st[0] if st else '', 'end_time': et[1] if et else '',
            'location': loc.group(1).replace(' ','').strip()[:30] if loc else '',
            'teacher': tch.group(1).replace(' ','').strip()[:15] if tch else '',
        })

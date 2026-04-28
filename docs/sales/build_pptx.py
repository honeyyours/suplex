"""
Suplex 소개서 → PPTX 변환기
- 입력: 본 스크립트 안의 콘텐츠 (소개서.md 기반)
- 출력: suplex/docs/sales/소개서.pptx
- 22 슬라이드, 16:9, 한국어 (맑은 고딕)
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR


# ── 디자인 토큰 ──
NAVY_DARK   = RGBColor(0x1e, 0x3a, 0x5f)
NAVY_MID    = RGBColor(0x2d, 0x4a, 0x6f)
WHITE       = RGBColor(0xff, 0xff, 0xff)
GRAY_50     = RGBColor(0xf9, 0xfa, 0xfb)
GRAY_200    = RGBColor(0xe5, 0xe7, 0xeb)
GRAY_400    = RGBColor(0x9c, 0xa3, 0xaf)
GRAY_600    = RGBColor(0x4b, 0x55, 0x63)
GRAY_800    = RGBColor(0x1f, 0x29, 0x37)
AMBER       = RGBColor(0xfb, 0xbf, 0x24)
AMBER_DARK  = RGBColor(0xb4, 0x80, 0x0a)

FONT_KO = "맑은 고딕"
FONT_MONO = "맑은 고딕"  # 한국어 코드블록도 가독성 우선


# ── 헬퍼 ──
def add_blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def fill_bg(prs, slide, color):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    spTree = sh._element.getparent()
    spTree.remove(sh._element)
    spTree.insert(2, sh._element)


def text(slide, x, y, w, h, txt, size=14, bold=False, color=GRAY_800,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0); tf.margin_right = Emu(0)
    tf.margin_top = Emu(0); tf.margin_bottom = Emu(0)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = txt
    r.font.name = font or FONT_KO
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return tb


def rect(slide, x, y, w, h, fill, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    return sh


def rrect(slide, x, y, w, h, fill, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.adjustments[0] = 0.06
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    return sh


def footer(slide, num, total, dark=False):
    color = GRAY_400 if not dark else GRAY_400
    text(slide, Inches(0.5), Inches(7.1), Inches(2), Inches(0.3),
         "SUPLEX", size=9, bold=True, color=color)
    text(slide, Inches(11), Inches(7.1), Inches(1.8), Inches(0.3),
         f"{num:02d} / {total:02d}", size=9, color=color, align=PP_ALIGN.RIGHT)


def code_block(slide, x, y, w, h, code_text):
    rrect(slide, x, y, w, h, NAVY_DARK)
    tb = slide.shapes.add_textbox(x + Inches(0.25), y + Inches(0.2),
                                   w - Inches(0.5), h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0); tf.margin_right = Emu(0)
    tf.margin_top = Emu(0); tf.margin_bottom = Emu(0)
    for i, line in enumerate(code_text.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = line if line else " "
        r.font.name = FONT_MONO
        r.font.size = Pt(10)
        r.font.color.rgb = WHITE


# ── 슬라이드 빌더 ──
def s_title(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    rect(s, Inches(0.6), Inches(2), Inches(0.08), Inches(3.5), AMBER)
    text(s, Inches(0.95), Inches(2), Inches(11), Inches(1.2),
         "수플렉스", size=72, bold=True, color=WHITE)
    text(s, Inches(0.95), Inches(3.0), Inches(11), Inches(0.5),
         "Suplex", size=20, color=GRAY_400)
    text(s, Inches(0.95), Inches(3.8), Inches(11), Inches(0.55),
         "인테리어 회사를 위한 통합 운영 도구", size=22, color=GRAY_200)
    text(s, Inches(0.95), Inches(4.4), Inches(11), Inches(0.55),
         "개인의 능력이 아니라 회사의 능력이 올라가는 도구", size=22, color=GRAY_200)
    text(s, Inches(0.95), Inches(5.0), Inches(11), Inches(0.55),
         "현장과 사무실, 대표와 직원을 한 줄로 잇습니다.", size=22, color=GRAY_200)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         "도입 검토용 소개서  ·  2026", size=10, color=GRAY_400, align=PP_ALIGN.RIGHT)


def s_toc(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    text(s, Inches(0.7), Inches(0.6), Inches(8), Inches(0.5),
         "CONTENTS", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(1.1), Inches(8), Inches(0.6),
         "목차", size=30, bold=True, color=NAVY_DARK)
    rect(s, Inches(0.7), Inches(1.85), Inches(0.6), Inches(0.05), AMBER)
    items = [
        ("01", "인테리어 회사가 매일 잃는 시간"),
        ("02", "한국 인테리어 6단계에 끼는 수플렉스"),
        ("03", "실전 시나리오 — 강남 30평 박상철 고객 리모델링"),
        ("04", "핵심 차별점"),
        ("05", "도입 첫날 체크리스트"),
        ("06", "다음 행동"),
    ]
    y = Inches(2.4)
    for num, title in items:
        text(s, Inches(0.7), y, Inches(1.5), Inches(0.7),
             num, size=36, bold=True, color=NAVY_DARK)
        text(s, Inches(2.2), y + Inches(0.18), Inches(10), Inches(0.5),
             title, size=20, color=GRAY_800)
        y += Inches(0.7)
    footer(s, 2, total)


def s_section(prs, total, num, title, page_num):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    text(s, Inches(0.7), Inches(2.3), Inches(5), Inches(2),
         num, size=140, bold=True, color=AMBER)
    text(s, Inches(0.7), Inches(4.6), Inches(12), Inches(0.7),
         title, size=34, bold=True, color=WHITE)
    rect(s, Inches(0.7), Inches(5.5), Inches(0.6), Inches(0.05), AMBER)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         f"SUPLEX  ·  {page_num:02d} / {total:02d}", size=9, color=GRAY_400, align=PP_ALIGN.RIGHT)


def s_pains(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(0.4),
         "01. 인테리어 회사가 매일 잃는 시간", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.6),
         "정보 단절과 사람 의존 — 사장님들이 가장 많이 호소하는 6가지 통증",
         size=22, bold=True, color=NAVY_DARK)
    rect(s, Inches(0.7), Inches(1.7), Inches(0.6), Inches(0.04), AMBER)
    pains = [
        ("정보 흩어짐", "견적·일정·발주가 카톡·엑셀·노션에 흩어져 있다",
         "변경 1건당 3~5곳 수동 동기화", False),
        ("모바일 가독성", "현장에서 일정 확인이 어렵다. 모바일 달력은 글씨가 안 보여 매번 팝업",
         "즉시 판단해야 할 때 시간 손실", False),
        ("정보 비대칭", "대표·디자이너·현장팀이 같은 정보를 다르게 알고 있다",
         "변경이 일부에게만 전달 → 헷갈림", False),
        ("발주 누락", "자재 발주를 깜빡. 시공일 임박해서 자재가 없는 걸 발견",
         "공기 지연 → 단가 상승", False),
        ("결정 추적 X", "마감재 결정이 자꾸 바뀌는데 어디까지 확정인지 추적 안 됨",
         "발주서가 옛날 결정 기준 → 자재 어긋남", False),
        ("사람 의존", "직원 머리 속에만 있는 노하우 — 어느 아파트가 까다롭고 어느 모델이 헐거워지는지",
         "직원이 그만두면 회사 자산이 함께 사라짐", True),
    ]
    cw = Inches(4.0); ch = Inches(2.3); gap = Inches(0.15)
    sx = Inches(0.7); sy = Inches(2.0)
    for i, (label, pain, result, hl) in enumerate(pains):
        col, row = i % 3, i // 3
        x = sx + (cw + gap) * col
        y = sy + (ch + gap) * row
        bg = NAVY_DARK if hl else GRAY_50
        c_label = WHITE if hl else NAVY_DARK
        c_pain = WHITE if hl else GRAY_800
        c_res = AMBER if hl else GRAY_600
        rrect(s, x, y, cw, ch, bg)
        text(s, x + Inches(0.3), y + Inches(0.25), cw - Inches(0.6), Inches(0.35),
             label, size=11, bold=True, color=c_label)
        text(s, x + Inches(0.3), y + Inches(0.65), cw - Inches(0.6), Inches(1.1),
             pain, size=12, color=c_pain)
        text(s, x + Inches(0.3), y + Inches(1.78), cw - Inches(0.6), Inches(0.4),
             "→ " + result, size=11, bold=True, color=c_res)
    footer(s, 4, total)


def s_message(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    text(s, Inches(0.7), Inches(2.4), Inches(12), Inches(0.5),
         "수플렉스의 약속", size=14, bold=True, color=AMBER, align=PP_ALIGN.CENTER)
    text(s, Inches(0.7), Inches(3.1), Inches(12), Inches(1),
         "일을 쌓을수록", size=44, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    text(s, Inches(0.7), Inches(4.0), Inches(12), Inches(1),
         "회사 자체의 능력이 두꺼워지는 도구", size=44, bold=True, color=AMBER, align=PP_ALIGN.CENTER)
    text(s, Inches(0.7), Inches(5.4), Inches(12), Inches(0.5),
         "직원이 떠나도 회사는 남습니다", size=18, color=GRAY_200, align=PP_ALIGN.CENTER)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         f"SUPLEX  ·  05 / {total:02d}", size=9, color=GRAY_400, align=PP_ALIGN.RIGHT)


def s_pipeline(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(0.4),
         "02. 한국 인테리어 6단계", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.6),
         "표준 6단계 흐름 + 각 단계마다 수플렉스가 자동으로 처리해주는 것",
         size=22, bold=True, color=NAVY_DARK)
    rect(s, Inches(0.7), Inches(1.7), Inches(0.6), Inches(0.04), AMBER)
    stages = [
        ("01", "현장실측", "프로젝트 카드 생성 — 면적·주소·고객 정보 한 번에 입력"),
        ("02", "설계·디자인", "가전 366개 모델 자동 검색(사이즈 자동 기입), 마감재 6단계 상태 추적"),
        ("03", "견적", "간편 + 상세 두 양식, 회사 비율 12개 자동 적용, PDF 출력"),
        ("04", "계획", "일정 입력 시 사전 체크리스트 자동, 발주 데드라인 자동 계산"),
        ("05", "시공", "발주 탭 자연 연계, 임박 발주만 D-day 알림, 발주서 자동 작성·복사"),
        ("06", "완공", "프로젝트 기록 누적(피드백·A/S·자재 노하우), JSON 백업"),
    ]
    row_h = Inches(0.65)
    sy = Inches(2.1)
    for i, (num, name, desc) in enumerate(stages):
        y = sy + row_h * i
        is_planning = (i == 3)
        bg = AMBER if is_planning else NAVY_DARK
        # 번호 원
        circle = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.7), y + Inches(0.05), Inches(0.55), Inches(0.55))
        circle.fill.solid()
        circle.fill.fore_color.rgb = bg
        circle.line.fill.background()
        circle.shadow.inherit = False
        tf = circle.text_frame
        tf.margin_left = Emu(0); tf.margin_right = Emu(0)
        tf.margin_top = Emu(0); tf.margin_bottom = Emu(0)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = num
        r.font.name = FONT_KO
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = NAVY_DARK if is_planning else WHITE
        # 단계명
        c_name = AMBER_DARK if is_planning else NAVY_DARK
        text(s, Inches(1.45), y + Inches(0.13), Inches(2.7), Inches(0.45),
             name, size=18, bold=True, color=c_name)
        # 설명
        text(s, Inches(4.2), y + Inches(0.15), Inches(8.7), Inches(0.45),
             desc, size=13, color=GRAY_800)
    # 하단 메모
    rrect(s, Inches(0.7), Inches(6.2), Inches(12), Inches(0.7), GRAY_50)
    text(s, Inches(0.95), Inches(6.32), Inches(11.5), Inches(0.5),
         "표준 4단계는 보통 \"계약\"이지만, 수플렉스는 클라이언트와 회사 간 계약에 관여하지 않습니다.",
         size=10, color=GRAY_600)
    text(s, Inches(0.95), Inches(6.55), Inches(11.5), Inches(0.5),
         "우리가 다루는 건 그 다음의 「계획(공정·자재 사전 준비)」 단계입니다.",
         size=10, color=GRAY_600)
    footer(s, 7, total)


def s_scenario_intro(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    text(s, Inches(0.7), Inches(0.6), Inches(12), Inches(0.4),
         "03. 실전 시나리오", size=11, bold=True, color=AMBER)
    text(s, Inches(0.7), Inches(1.1), Inches(12), Inches(0.9),
         "강남 30평 박상철 고객 리모델링", size=34, bold=True, color=WHITE)
    rect(s, Inches(0.7), Inches(2.1), Inches(0.6), Inches(0.04), AMBER)
    rrect(s, Inches(0.7), Inches(2.7), Inches(12), Inches(3.5), NAVY_MID)
    text(s, Inches(1.0), Inches(2.95), Inches(11), Inches(0.4),
         "배경", size=12, bold=True, color=AMBER)
    items = [
        ("회사", "ABC인테리어 (강남 일대 4명 팀)"),
        ("견적 담당", "김미영 사원"),
        ("클라이언트", "박상철 (40대 4인 가족, 6주 후 입주 예정)"),
        ("프로젝트", "강남 래미안 304-1502, 30평 전면 리모델링"),
        ("예산", "약 5,000만 원"),
    ]
    y = Inches(3.5)
    for label, val in items:
        text(s, Inches(1.0), y, Inches(2.5), Inches(0.4),
             label, size=14, bold=True, color=GRAY_400)
        text(s, Inches(3.5), y, Inches(8.5), Inches(0.4),
             val, size=14, color=WHITE)
        y += Inches(0.45)
    text(s, Inches(0.7), Inches(6.5), Inches(12), Inches(0.4),
         "다음 7컷으로 시간순 따라갑니다", size=12, color=GRAY_400, align=PP_ALIGN.CENTER)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         f"SUPLEX  ·  08 / {total:02d}", size=9, color=GRAY_400, align=PP_ALIGN.RIGHT)


def s_scenario(prs, total, page_num, cut_no, title, body, code=None,
               highlight=False, sub_title=None):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    cut_color = AMBER_DARK if highlight else NAVY_DARK
    text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(0.4),
         f"03. 실전 시나리오  ·  컷 {cut_no}", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.7),
         title, size=24, bold=True, color=cut_color)
    if sub_title:
        text(s, Inches(0.7), Inches(1.55), Inches(12), Inches(0.4),
             sub_title, size=12, color=GRAY_600)
    rect(s, Inches(0.7), Inches(2.0), Inches(0.6), Inches(0.04),
         AMBER if highlight else NAVY_DARK)

    if code:
        body_x = Inches(0.7); body_w = Inches(7.0)
        code_x = Inches(7.9); code_w = Inches(4.9)
        code_block(s, code_x, Inches(2.3), code_w, Inches(4.5), code)
    else:
        body_x = Inches(0.7); body_w = Inches(12)

    body_y = Inches(2.3)
    for line in body:
        if isinstance(line, tuple):
            txt_, kind = line
        else:
            txt_, kind = line, "p"
        if kind == "h":
            color = NAVY_DARK; size = 14; bold = True; lh = Inches(0.5)
        elif kind == "em":
            color = AMBER_DARK; size = 13; bold = True; lh = Inches(0.55)
        else:
            color = GRAY_800; size = 12; bold = False; lh = Inches(0.45)
        text(s, body_x, body_y, body_w, lh + Inches(0.1),
             txt_, size=size, bold=bold, color=color)
        body_y += lh + Inches(0.05)

    footer(s, page_num, total)


def s_diff(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(0.4),
         "04. 핵심 차별점", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.6),
         "왜 수플렉스를 도입해야 하는가", size=22, bold=True, color=NAVY_DARK)
    rect(s, Inches(0.7), Inches(1.7), Inches(0.6), Inches(0.04), AMBER)
    diffs = [
        ("개인 능력 → 회사 능력",
         "직원 머리 속 노하우가 회사 시스템 자산으로. 일을 쌓을수록 회사 능력이 두꺼워집니다.", True),
        ("사전 체크리스트 자동 생성",
         "일정만 입력하면 회사 표준 어드바이스가 작동. 노련한 사장님 노하우를 신입도 똑같이.", False),
        ("클라이언트 비접근 원칙",
         "회사 영업 정보가 클라이언트에게 보이지 않습니다. PDF만 갑니다.", False),
        ("어디서든 접근, 모바일 우선",
         "현장에서 즉시 확인·수정·변경. 모바일에서 공정명이 글씨로 직접 보입니다.", False),
        ("일정 픽스 — 계획과 확정 구분",
         "협력업체 섭외 완료된 일정만 픽스. 잡힌 일정과 미정 일정을 한 화면에서 구분.", False),
        ("일정·발주 텍스트 추출",
         "작업자·협력업체에 보낼 안내를 매번 타이핑할 필요 없음. 한 번에 클립보드로.", False),
        ("JSON 통째 백업",
         "회사 전체 데이터를 언제든 한 파일로. 락인 없음.", False),
        ("AI 경리 (예정)",
         "추후 통장 데이터 자동 → 프로젝트별 손익 자동 계산 예정.", False),
    ]
    cw = Inches(6.1); ch = Inches(1.13); gx = Inches(0.15); gy = Inches(0.1)
    sx = Inches(0.7); sy = Inches(2.0)
    for i, (title_, desc, hl) in enumerate(diffs):
        col, row = i % 2, i // 2
        x = sx + (cw + gx) * col
        y = sy + (ch + gy) * row
        bg = NAVY_DARK if hl else GRAY_50
        c_t = AMBER if hl else NAVY_DARK
        c_d = GRAY_200 if hl else GRAY_600
        rrect(s, x, y, cw, ch, bg)
        text(s, x + Inches(0.3), y + Inches(0.18), cw - Inches(0.6), Inches(0.4),
             title_, size=14, bold=True, color=c_t)
        text(s, x + Inches(0.3), y + Inches(0.6), cw - Inches(0.6), Inches(0.5),
             desc, size=11, color=c_d)
    footer(s, 19, total)


def s_checklist(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, WHITE)
    text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(0.4),
         "05. 도입 첫날 체크리스트", size=11, bold=True, color=GRAY_400)
    text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.6),
         "30분~1시간 안에 마치시면 첫 견적이 빠르게 나갑니다",
         size=22, bold=True, color=NAVY_DARK)
    rect(s, Inches(0.7), Inches(1.7), Inches(0.6), Inches(0.04), AMBER)
    items = [
        "회사 정보 입력 (회사명·사업자번호·주소·연락처·이메일)",
        "회사 로고 URL 등록 — 견적서 PDF 헤더에 들어감",
        "견적 기본비율 12개 점검 — 디자인비 10%, 부가세 등 회사 표준에 맞게",
        "가전 규격 마스터 시드 — 366개 모델 일괄 등록",
        "공정별 발주 데드라인 규칙 등록 — 회사 표준 D-day 룰",
        "사전 체크리스트(어드바이스) 표준 등록 — 회사 표준 노하우 자산화의 시작",
        "팀원 초대 — 대표 / 디자이너 / 현장팀 역할 부여",
        "협력업체 5~10개 등록 — 발주·소통 시 자동완성",
        "기능 표시 설정 점검 — 직원 공유 계정에서 영업 정보 차단 가능",
    ]
    y = Inches(2.1)
    for txt_ in items:
        box = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), y + Inches(0.08),
                                  Inches(0.28), Inches(0.28))
        box.fill.solid(); box.fill.fore_color.rgb = WHITE
        box.line.color.rgb = NAVY_DARK; box.line.width = Pt(1.5)
        box.shadow.inherit = False
        text(s, Inches(1.4), y, Inches(11), Inches(0.45),
             txt_, size=14, color=GRAY_800, anchor=MSO_ANCHOR.MIDDLE)
        y += Inches(0.5)
    footer(s, 20, total)


def s_cta(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    text(s, Inches(0.7), Inches(0.6), Inches(12), Inches(0.4),
         "06. 다음 행동", size=11, bold=True, color=AMBER)
    text(s, Inches(0.7), Inches(1.1), Inches(12), Inches(0.9),
         "도입 검토를 시작하시려면", size=32, bold=True, color=WHITE)
    rect(s, Inches(0.7), Inches(2.1), Inches(0.6), Inches(0.04), AMBER)
    actions = [
        ("데모 요청", "현장 미팅 시간 잡고 직접 보여드립니다"),
        ("시범 도입 문의", "회사 1곳 1주 무료 시범 운영"),
        ("일반 문의", "기능·요금·도입 절차 등"),
    ]
    y = Inches(2.7)
    for label, desc in actions:
        rrect(s, Inches(0.7), y, Inches(12), Inches(1.0), NAVY_MID)
        text(s, Inches(1.0), y + Inches(0.18), Inches(4), Inches(0.4),
             label, size=18, bold=True, color=AMBER)
        text(s, Inches(1.0), y + Inches(0.58), Inches(8), Inches(0.4),
             desc, size=12, color=GRAY_200)
        text(s, Inches(8.3), y + Inches(0.32), Inches(4.2), Inches(0.5),
             "_______________________", size=14, color=GRAY_400, align=PP_ALIGN.RIGHT)
        y += Inches(1.15)
    text(s, Inches(0.7), Inches(6.5), Inches(12), Inches(0.4),
         "수플렉스가 잘 잡아주는 부분만 안에서 굴리고, 기존 채널은 그대로 쓰시면 됩니다",
         size=12, color=GRAY_400, align=PP_ALIGN.CENTER)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         f"SUPLEX  ·  21 / {total:02d}", size=9, color=GRAY_400, align=PP_ALIGN.RIGHT)


def s_closing(prs, total):
    s = add_blank(prs)
    fill_bg(prs, s, NAVY_DARK)
    text(s, Inches(0.7), Inches(2.5), Inches(12), Inches(1.5),
         "감사합니다", size=72, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    text(s, Inches(0.7), Inches(4.0), Inches(12), Inches(0.55),
         "Suplex — 인테리어 회사를 위한 통합 운영 도구",
         size=18, color=GRAY_200, align=PP_ALIGN.CENTER)
    text(s, Inches(0.7), Inches(4.7), Inches(12), Inches(0.6),
         "사람이 떠나도 회사는 남습니다",
         size=22, bold=True, color=AMBER, align=PP_ALIGN.CENTER)
    text(s, Inches(0.5), Inches(7.05), Inches(12), Inches(0.4),
         f"SUPLEX  ·  22 / {total:02d}", size=9, color=GRAY_400, align=PP_ALIGN.RIGHT)


# ── 메인 ──
def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    TOTAL = 22

    s_title(prs, TOTAL)                                                     # 1
    s_toc(prs, TOTAL)                                                       # 2
    s_section(prs, TOTAL, "01", "인테리어 회사가 매일 잃는 시간", 3)        # 3
    s_pains(prs, TOTAL)                                                     # 4
    s_message(prs, TOTAL)                                                   # 5
    s_section(prs, TOTAL, "02", "한국 인테리어 6단계에 끼는 수플렉스", 6)   # 6
    s_pipeline(prs, TOTAL)                                                  # 7
    s_scenario_intro(prs, TOTAL)                                            # 8

    # 9. 컷 1 — 프로젝트 등록
    s_scenario(prs, TOTAL, 9, "1",
        "미팅 직후 — 프로젝트 등록 + 마감재 빠르게 채움",
        [
            ("토요일 오후 2시 미팅이 끝납니다.", "h"),
            "사무실에 돌아온 김미영 사원이 새 프로젝트를 만듭니다.",
            "비슷한 평형의 이전 프로젝트 데이터를 참고해서 마감재를 빠르게 채웁니다.",
            ("회사가 진행한 프로젝트가 쌓일수록 새 프로젝트는 더 빨라집니다", "em"),
            "키보드만으로 빠르게. Tab으로 다음 필드, 마지막 필드에서 다음 행 자동 펼침.",
            "1초 뒤 자동 저장. 저장 버튼 따로 누르지 않아도 됩니다.",
        ],
        code="프로젝트명 :\n  강남 래미안 304-1502\n  리모델링\n\n고객명     : 박상철\n주소       : 서울 강남구\n             도곡동 123\n             304동 1502호\n\n면적       : 30평\n시작 예정  : 2026-05-15\n종료 예정  : 2026-06-26"
    )

    # 10. 컷 2 — 가전 사이즈 자동
    s_scenario(prs, TOTAL, 10, "2",
        "가전 모델 입력 — 사이즈가 자동으로 들어옵니다",
        [
            ("빌트인 가구가 안 맞아 재시공하는 사고를 방지합니다.", "h"),
            "마감재 행에 모델명을 검색하면 모델 품번·브랜드·사이즈가 한 번에 입력됩니다.",
            "사이즈 출처 URL도 함께 저장됩니다.",
            ("냉장고·김치냉장고·식기세척기 366개 모델이 미리 정리되어 있습니다", "em"),
            "사용자가 새 모델을 입력하면 회사만의 가전 DB에 자동 누적됩니다.",
            "다음 프로젝트에서는 그 모델이 바로 검색됩니다.",
        ],
        code="검색: \"LG DUE6\"\n\n→ LG DUE6BGL2E\n  (BESPOKE 빌트인)\n\n  가로 : 595 mm\n  세로 : 815 mm\n  깊이 : 600 mm\n\n  [선택]"
    )

    # 11. 컷 3-1 메인
    s_scenario(prs, TOTAL, 11, "3",
        "공정 일정 — 어디서든 한 화면에",
        [
            ("수플렉스의 메인 기능. 모바일에서도 공정 이름이 글씨로 직접 보입니다.", "h"),
            "일반 달력 앱은 셀이 좁아 클릭해야 팝업으로만 글씨가 보입니다.",
            "수플렉스는 인테리어 공정에 맞춰 한 화면에 최대한 많은 정보가 보이게 설계.",
            ("현장에서 모바일을 꺼내자마자 오늘·이번 주 공정이 한눈에", "em"),
            "현장에서 일정이 바뀌면 즉시 모바일에서 수정.",
            "사무실 디자이너 화면에 곧바로 반영됩니다.",
            ("일정 정보가 개인의 머리 속이 아니라 회사 시스템 안에", "em"),
        ],
        highlight=True,
        sub_title="컷 3-1  ·  메인 기능"
    )

    # 12. 컷 3-2 메인 — 탭별 + 픽스
    s_scenario(prs, TOTAL, 12, "3",
        "탭별 최적화 + 일정 픽스 기능",
        [
            ("모든 팀원이 같은 화면을 봅니다 (지출 탭 제외).", "h"),
            "일정 탭 — 현장팀 우선. 여러 현장 일정·체크리스트 넘나들기 좋게.",
            "마감재 탭 — 디자이너 우선. 마감재 추가·제거 빠른 UI.",
            "대표 — 모든 데이터 한 화면. 지출 탭에서 회사 전체 금전 흐름.",
            ("일정 픽스 — 계획과 확정의 구분", "em"),
            "처음엔 계획으로 입력 → 협력업체 섭외 끝난 일정만 픽스로 바꿈.",
            "잡힌 일정과 미정 일정을 팀 전체가 한 화면에서 구분합니다.",
            ("엑셀·노션·달력 앱에는 없는 소통 기능", "em"),
        ],
        highlight=True,
        sub_title="컷 3-2"
    )

    # 13. 컷 4-1 — D-day
    s_scenario(prs, TOTAL, 13, "4",
        "D-day 알림 — 임박한 발주만 자동으로",
        [
            ("자재 발주 누락은 인테리어 공사의 가장 큰 사고입니다.", "h"),
            "회사가 등록해둔 공정별 발주 데드라인 규칙대로 시스템이 자동 어드바이스.",
            "타일 시공 7일 전, 도배 5일 전, 바닥재 7일 전 자재 도착 등.",
            "발주 메뉴에 임박 항목이 통계 카드로 강조됩니다.",
            ("모델 미정 경고로 자재 미확정 상태에서 데드라인 지나는 일 차단", "em"),
            "Solapi 카카오 알림톡 연동 시 N일 전 자동 알림톡까지.",
        ],
        code="타일 시공 시작:\n  2026-05-29\n\n발주 마감:\n  2026-05-22\n  (시공 7일 전)\n\n오늘  : 2026-05-19\n\n→ 발주 화면에\n  \"타일 D-3 임박\"\n  칩 자동 표시",
        highlight=True,
        sub_title="컷 4-1  ·  메인 기능"
    )

    # 14. 컷 4-2 — 사전 체크리스트
    s_scenario(prs, TOTAL, 14, "4",
        "사전 체크리스트 — 일정만 입력하면 자동 생성",
        [
            ("노련한 사장님이 챙기던 사전 액션이 신입에게 빠지는 일을 방지합니다.", "h"),
            "일정에 \"도배\"를 입력하는 순간:",
            "  · 도배 D-3 \"벽지 도착 확인\" 자동 추가",
            "  · 도배 D-1 \"초벌 풀칠 준비\" 자동 추가",
            "회사가 한 번 표준 어드바이스를 등록해두면 모든 프로젝트가 같은 표준으로.",
            ("사장님 머리 속 \"이쯤 되면 이거 챙겨야 한다\" 노하우를 신입도 똑같이", "em"),
            "회사가 일찍 표준을 등록해둘수록 누가 일을 진행하든 같은 품질 보장.",
        ],
        highlight=True,
        sub_title="컷 4-2  ·  메인 기능"
    )

    # 15. 컷 5 — 발주서
    s_scenario(prs, TOTAL, 15, "5",
        "발주서 자동 작성 — 협력업체에 카톡 형식으로",
        [
            ("마감재 확정 → 발주 탭으로 자연스럽게 이어집니다.", "h"),
            "보낼 항목 체크 후 \"선택 복사\".",
            "발주서가 카톡 친화 형식으로 자동 작성, 클립보드에 복사됩니다.",
            "협력업체 사장님 카톡방에 그대로 붙여넣기.",
            ("협력업체와의 소통 채널을 바꿀 필요 없이, 정리된 정보만 전달", "em"),
        ],
        code="[ABC인테리어]\n[강남 304-1502]\n\n[현장 정보]\n주소: 도곡동 123\n     1502호\n담당: 김미영\n도착: 2026-05-27\n\n[욕실 타일 자재]\n타일 600각: 15박스\n본드 X18  : 6포\n줄눈 화이트: 4봉\n유가 도무스: 2개\n코너비드  : 8개"
    )

    # 16. 컷 6 — 일정 추출
    s_scenario(prs, TOTAL, 16, "6",
        "일정 추출 — 작업자에게 보낼 안내를 한 번에",
        [
            ("일정·주소·주의사항을 매번 타이핑하는 일은 가장 반복되는 잡일입니다.", "h"),
            "일정 탭에서 \"일정 추출\" → 검색창에 「전기」 입력.",
            "그 프로젝트의 전기 공정 일정 + 주소 + 특이사항이 클립보드에 복사.",
            "전기팀 사장님 카톡방에 그대로 붙여넣기.",
            ("회사 전체 일정에서 추출하면 모든 현장의 전기 공사 일정이 한 번에", "em"),
            "엑셀·노션·달력 앱에서 매번 손으로 정리하던 작업이 한 클릭으로.",
        ],
        code="[ABC인테리어]\n[304-1502]\n[전기 공사 안내]\n\n[공사 일정]\n2026-05-18\n  09:00 설비·전기\n\n[현장 정보]\n주소: 도곡동 123\n     1502호\n담당: 김미영\n특이: 1502호 좌측\n     09시 양해 완료"
    )

    # 17. 컷 7 — 프로젝트 기록
    s_scenario(prs, TOTAL, 17, "7",
        "프로젝트 기록 — 머리에서 시스템으로",
        [
            ("인테리어 노하우는 대부분 사람의 머리 속에 있습니다.", "h"),
            "박상철 시공 3주 차, 거실 천장 8cm 발견 → 표면 매입형으로 변경 + 메모.",
            "준공 1개월 후 안방 욕실 수전 헐거움 A/S → 메모.",
            "석 달 뒤, 같은 아파트 다른 호수 견적 → 검색 한 번에 과거 노하우 즉시.",
            ("직원이 그만두는 순간 회사 자산이 함께 사라지는 일을 방지", "em"),
            "추후 AI 도입으로 비슷한 현장 자동 매칭, 과거 노하우 어드바이스 예정.",
            ("일찍 도입할수록 회사만의 데이터 자산이 두꺼워집니다", "em"),
        ],
        code="[태그: 현장환경]\n강남 래미안\n304-1502\n거실 천장 8cm\n매립등 X\n표면형 권장\n\n[태그: A/S]\n박상철 안방\n욕실 수전\n슈베르트 SK-1240\n시공 1개월 헐거움\n다음 토크 강하게",
        highlight=True
    )

    s_section(prs, TOTAL, "04", "핵심 차별점", 18)                          # 18
    s_diff(prs, TOTAL)                                                       # 19
    s_checklist(prs, TOTAL)                                                  # 20
    s_cta(prs, TOTAL)                                                        # 21
    s_closing(prs, TOTAL)                                                    # 22

    out = r"C:\Users\1988k\projects\suplex\docs\sales\소개서.pptx"
    prs.save(out)
    print(f"OK: {out}")
    print(f"Slides: {len(prs.slides)}")


if __name__ == "__main__":
    main()

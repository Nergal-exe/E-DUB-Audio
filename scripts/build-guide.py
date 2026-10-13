"""E-DUB Audio — Amaç ve Özellikler PDF rehberi.

Doğrudan çalıştırma yerine `npm run guide` kullan: efekt listesi src/effects.ts'ten çıkarılıp bu betiğe verilir.
Sürüm package.json'dan okunur. Gereksinim: Python 3, `pip install reportlab`, Windows Segoe UI yazı tipleri.
Kullanım: python scripts/build-guide.py <proje kökü> <effects.json>
"""
import json, sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, Table, TableStyle,
                                KeepTogether, CondPageBreak, PageBreak, NextPageTemplate)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(sys.argv[1])
EFFECTS = json.loads(Path(sys.argv[2]).read_text(encoding='utf8'))
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf8'))['version']
OUT = ROOT / 'docs/E-DUB-Audio-Amac-ve-Ozellikler.pdf'
MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
DATE = f'{date.today().day} {MONTHS[date.today().month - 1]} {date.today().year}'

pdfmetrics.registerFont(TTFont('Segoe', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeSB', 'C:/Windows/Fonts/seguisb.ttf'))
pdfmetrics.registerFont(TTFont('SegoeBold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFontFamily('Segoe', normal='Segoe', bold='SegoeBold', italic='Segoe', boldItalic='SegoeBold')

INK, BODY, MUTED, LINE = HexColor('#102136'), HexColor('#2a3d52'), HexColor('#5d6f85'), HexColor('#d8e1ec')
ACCENT, ACCENT_SOFT, TINT, NAVY = HexColor('#0279b1'), HexColor('#e3f2fb'), HexColor('#f4f7fb'), HexColor('#0c1119')
CAT_COLORS = ['#7c3aed', '#0891b2', '#059669', '#ca8a04', '#db2777']

S = {
 'body': ParagraphStyle('body', fontName='Segoe', fontSize=9.6, leading=14.6, textColor=BODY, spaceAfter=7),
 'lead': ParagraphStyle('lead', fontName='Segoe', fontSize=11.5, leading=17.5, textColor=BODY, spaceAfter=10),
 'small': ParagraphStyle('small', fontName='Segoe', fontSize=8.2, leading=11.8, textColor=MUTED),
 'cell': ParagraphStyle('cell', fontName='Segoe', fontSize=8.4, leading=11.8, textColor=BODY),
 'cellb': ParagraphStyle('cellb', fontName='SegoeSB', fontSize=8.8, leading=12, textColor=INK),
 'th': ParagraphStyle('th', fontName='SegoeSB', fontSize=7.8, leading=10, textColor=MUTED),
 'kicker': ParagraphStyle('kicker', fontName='SegoeSB', fontSize=8.5, leading=11, textColor=ACCENT, spaceAfter=4),
 'h1': ParagraphStyle('h1', fontName='SegoeBold', fontSize=21, leading=26, textColor=INK, spaceAfter=10),
 'h2': ParagraphStyle('h2', fontName='SegoeSB', fontSize=11.5, leading=15, textColor=INK, spaceBefore=9, spaceAfter=4),
 'toc': ParagraphStyle('toc', fontName='Segoe', fontSize=10, leading=15, textColor=BODY),
}
P = lambda text, st='body': Paragraph(text, S[st])

def num(v):
    """Türkçe sayı biçimi: binlik nokta, ondalık virgül."""
    if float(v).is_integer():
        s = f'{int(v):,}'.replace(',', '.')
        return s.replace('-', '−')
    s = f'{v:.3f}'.rstrip('0').rstrip('.').replace('.', ',')
    return s.replace('-', '−')

def rng(a):
    u = a.get('unit') or ''
    if u == '%': return f"%{num(a['min'])} … {num(a['max'])}", f"%{num(a['value'])}"
    sep = '' if u.startswith(':') else ' '
    tail = f'{sep}{u}' if u else ''
    return f"{num(a['min'])} … {num(a['max'])}{tail}", f"{num(a['value'])}{tail}"

story = []
def section(no, title, intro=None):
    story.append(CondPageBreak(170))
    story.append(Spacer(1, 6))
    story.append(P(f'BÖLÜM {no}', 'kicker'))
    story.append(P(title, 'h1'))
    if intro: story.append(P(intro, 'lead'))

def item(title, text):
    story.append(KeepTogether([P(title, 'h2'), P(text)]))

def table(rows, widths, header=True, zebra=True, pad=6):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    st = [('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
          ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('LINEBELOW', (0, 0), (-1, -1), .5, LINE)]
    if header: st += [('BACKGROUND', (0, 0), (-1, 0), TINT), ('LINEBELOW', (0, 0), (-1, 0), .8, ACCENT)]
    if zebra:
        for r in range(1 if header else 0, len(rows)):
            if (r % 2 == 0) == header: st.append(('BACKGROUND', (0, r), (-1, r), HexColor('#fafcfe')))
    t.setStyle(TableStyle(st))
    return t

def callout(text, color=ACCENT, bg=ACCENT_SOFT):
    t = Table([[P(text, 'body')]], colWidths=[491])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('LINEBEFORE', (0, 0), (0, -1), 3, color),
                           ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                           ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
    return t

# ── Kapak ─────────────────────────────────────────────────────────────
story.append(NextPageTemplate('content'))
story.append(Spacer(1, 330))
story.append(Paragraph('E-DUB Audio', ParagraphStyle('t', fontName='SegoeBold', fontSize=40, leading=46, textColor=white)))
story.append(Paragraph('Programın amacı ve tüm özellikleri', ParagraphStyle('st', fontName='SegoeSB', fontSize=17, leading=24, textColor=HexColor('#7dd3fc'), spaceBefore=4)))
story.append(Spacer(1, 12))
story.append(Paragraph('Windows için yerel ses işleme stüdyosu: ekolayzır, dinamik işlemciler, yapay zekâ destekli gürültü temizleme ve alan efektleri.',
                       ParagraphStyle('sd', fontName='Segoe', fontSize=11, leading=17, textColor=HexColor('#c7d3e3'))))
story.append(Spacer(1, 26))
story.append(Paragraph(f'Sürüm {VERSION}  ·  Türkçe kullanım rehberi  ·  {DATE}', ParagraphStyle('sv', fontName='Segoe', fontSize=9, leading=12, textColor=HexColor('#8b9aaf'))))
story.append(PageBreak())

# ── Bir bakışta + içindekiler ─────────────────────────────────────────
story.append(P('GENEL BAKIŞ', 'kicker'))
story.append(P('Bir bakışta', 'h1'))
shot = ROOT / 'docs/images/e-dub-audio-studio.png'  # README ile aynı ekran görüntüsü
sw, sh = ImageReader(str(shot)).getSize()
story.append(Image(str(shot), width=491, height=491 * sh / sw))
story.append(Spacer(1, 12))
facts = [('31', 'efekt, 5 kategoride'), ('10', 'bantlı parametrik ekolayzır'), ('2', 'yerel yapay zekâ modeli'), ('48 kHz', 'işleme hızı')]
cells = [[Paragraph(f'<font name="SegoeBold" size="19" color="#0279b1">{a}</font><br/><font size="8" color="#5d6f85">{b}</font>',
                    ParagraphStyle('f', fontName='Segoe', leading=20, alignment=1)) for a, b in facts]]
ft = Table(cells, colWidths=[122.75] * 4)
ft.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), TINT), ('LINEAFTER', (0, 0), (-2, -1), .6, LINE),
                        ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10)]))
story.append(ft)
story.append(Spacer(1, 12))
story.append(P('E-DUB Audio, açtığın ses dosyalarını ve canlı mikrofon girişini bir efekt zinciriyle işler. Tüm işlem cihazında yapılır; '
               'ses hiçbir sunucuya gönderilmez, hesap, internet bağlantısı veya ücret gerekmez.', 'lead'))
story.append(callout('<b>Kapsam:</b> Bu sürüm yalnızca uygulamada açılan dosyayı veya mikrofonu işler. Diğer Windows uygulamalarının sesini '
                     'sistem genelinde işlemez ve işlenmiş mikrofonu başka uygulamalara sanal mikrofon olarak sunmaz.'))
story.append(Spacer(1, 14))
story.append(P('İçindekiler', 'h2'))
toc = ['Amaç ve kullanım alanları', 'Çalışma alanı ve kullanım', f'{VERSION} sürümündeki yenilikler', 'Efekt kataloğu',
       'Profiller, cihazlar ve muafiyetler', 'Ayarlar ve performans', 'İçe aktarma ve veri yönetimi', 'Kurulum, sınırlar ve lisans']
cell = lambda i: [P(f'<font color="#0279b1"><b>{i + 1:02}</b></font>', 'toc'), P(toc[i], 'toc')]
story.append(table([cell(i) + [''] + cell(i + 4) for i in range(4)], [26, 210, 19, 26, 210], header=False, zebra=False, pad=4))

# ── 01 Amaç ───────────────────────────────────────────────────────────
story.append(PageBreak())
section('01', 'Amaç ve kullanım alanları', 'Frekans dengesini değiştirmek, ses seviyesini dengelemek, konuşmayı temizlemek ve sesin '
        'stereo/alan karakterini şekillendirmek için tasarlandı. Easy Effects’in efekt zinciri yaklaşımından ilham alır; Windows’ta dosya ve mikrofon odaklı çalışır.')
uses = [('Müzik ve dinleme', 'Bas ve tiz dengesini ayarla, hazır veya kişisel profiller uygula, stereo genişliği ve kulaklık çapraz beslemesini düzenle.'),
        ('Mikrofon ve konuşma', 'Düşük mikrofon seviyesini yükselt, arka plan gürültüsünü azalt, ıslıklı ünsüzleri yumuşat, konuşma dinamiğini dengele. Kulaklık izleme ayrı bir anahtarla açılır.'),
        ('Yaratıcı denemeler', 'Yankı, gecikme, perde kaydırma, autotune ve bitcrusher ile farklı ses karakterleri dene.')]
story.append(table([[P('<b>Kullanım</b>', 'th'), P('<b>Ne yapabilirsin?</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in uses], [120, 371]))
story.append(Spacer(1, 6))
story.append(P('Bu sürümde işlenmiş sesi kaydetme veya dosya olarak dışa aktarma yoktur; JSON dışa aktarma yalnızca ayarları yedekler.', 'small'))
item('İsmin hikâyesi', 'Ad Sümerceden gelir: <b>é</b> “ev”, <b>dub</b> ise “kil tablet” demektir. <b>É-DUB</b>, yani “tablet evi”, bilginin '
     'tabletlere işlenip saklandığı yazı evi ve arşivdir. E-DUB Audio bu fikri, sesin şekillendirildiği dijital bir çalışma alanına taşır.')

# ── 02 Çalışma alanı ──────────────────────────────────────────────────
section('02', 'Çalışma alanı ve kullanım')
steps = ['Üst çubuktan çıkış aygıtını seç.', 'Bir ses dosyası aç (veya pencereye sürükle) ya da mikrofonu başlat.',
         'Mikrofondaysan gerekirse kulaklık izlemeyi aç.', 'Kütüphaneden efekt ekle, sırala ve ayarla.',
         'Üstteki genel anahtarla efektli/efektsiz karşılaştır.', 'Beğendiğin zinciri profil olarak kaydet.']
story.append(KeepTogether([P('Hızlı başlangıç', 'h2'), table([[P(f'<font color="#0279b1"><b>{i}</b></font>', 'cell'), P(t, 'cell')] for i, t in enumerate(steps, 1)],
                                                         [24, 467], header=False, zebra=False, pad=4)]))
item('Kaynak seçimi', '<b>Dosya seç</b> ile ya da dosyayı pencereye sürükleyip bırakarak MP3, WAV, OGG, FLAC veya M4A aç; çözümleme desteği dosyanın codec’ine bağlıdır. '
     '<b>Mikrofon</b> düğmesi canlı girişi başlatır veya durdurur; mikrofon açılınca dosya oynatımı durur.')
item('Oynatma çubuğu', 'Alt çubukta oynat/duraklat, geçen ve toplam süre, sarma çubuğu ve döngüde çalma düğmesi bulunur. Mikrofon modunda oynat düğmesi kulaklık izlemeyi açıp kapatır.')
item('Üst başlık çubuğu', 'Çıkış aygıtı, %0–100 ses seviyesi, açık/koyu tema ve tüm zinciri atlayan genel <b>Efektler açık/kapalı</b> anahtarı.')
item('Efekt zinciri', 'Kütüphanede ara veya kategoriye göre süz; efekti ekle, aç/kapat, yukarı/aşağı taşı veya zincirden kaldır. Sıra, işlenen sesi etkiler. '
     'Bir efekti kapatmak ayarlarını silmez; <b>Efekti sıfırla</b> varsayılan değerlere döndürür.')
item('Ekolayzır', 'Dengeli, Bas vurgusu, Vokal netliği ve Sinema hazır ayarları vardır. Grafik, 10 bandın <b>gerçek birleşik frekans yanıtını</b> logaritmik eksende gösterir; '
     'eğrideki noktaya veya sürgüye tıklayınca bant seçilir. Toplam kazanç 0 dB’i aşarsa kırpılma uyarısı çıkar; <b>Uygula</b> ön kazancı tek tıkla düşürür. '
     'Parametrik düzenlemede frekans, Q, tür (tepe/bas rafı/tiz rafı) ve ön kazanç ayarlanır; raf filtrelerinde Q kullanılmaz.')
item('Spektrum ve ölçerler', 'Canlı spektrum frekans dağılımını gösterir. Sağdaki L/R çubukları bağımsız kanal tepe değerlerini −48…0 dBFS ölçeğinde ölçer; mono dosyalar iki kanala açılır, sessizlik −∞ görünür.')
item('Alt durum çubuğu', 'CPU yalnızca E-DUB Audio işlemlerinin kullanımıdır. Gecikme, ses motorunun bildirdiği temel gecikmedir (efekt gecikmeleri hariç); kHz örnekleme hızını, dBFS işlenen çıkışın tepe seviyesini gösterir.')
keys = [('Boşluk', 'Oynat / duraklat (mikrofonda kulaklık izlemeyi aç/kapat)'), ('← / →', '5 saniye geri / ileri sar'), ('Sürükle-bırak', 'Ses dosyasını pencereye bırakarak aç')]
story.append(KeepTogether([P('Kısayollar', 'h2'), table([[P('<b>Tuş</b>', 'th'), P('<b>İşlev</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in keys], [110, 381])]))

# ── 03 Yenilikler ─────────────────────────────────────────────────────
section('03', f'{VERSION} sürümündeki yenilikler')
new = [('Gerçek EQ eğrisi', 'Birleşik frekans yanıtı, logaritmik eksen, noktadan bant seçimi.'),
       ('Kırpılma uyarısı', 'Toplam kazanç 0 dB’i aşınca uyarı ve tek tıkla ön kazanç düzeltmesi.'),
       ('Oynatma çubuğu', 'Süre, sarma ve döngüde çalma.'),
       ('Sürükle-bırak ve kısayollar', 'Dosyayı pencereye bırakma; Boşluk ve ←/→ tuşları.')]
fixes = ['Sayı alanlarına negatif ve ara değerler yazılabiliyor (önceden ön kazanç elle negatif girilemiyordu).',
         'Mono dosyalarda sağ kanal göstergesi doğru ölçüyor.',
         'Yüklenemeyen bir AI efekti zincirin geri kalanını kilitlemiyor; efekt kapatılıp neden bildiriliyor.',
         'Uygulamanın ikinci kopyası pencere veya ikinci tepsi simgesi oluşturmadan kapanıyor.',
         'Profil silme onay istiyor; bağlı cihaz kuralları da temizleniyor.',
         'Spektrum çizimi sırasında gereksiz arayüz yenilemeleri azaltıldı.']
story.append(table([[P('<b>Yenilik</b>', 'th'), P('<b>Açıklama</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in new], [150, 341]))
story.append(KeepTogether([P('Düzeltilen hatalar', 'h2')] + [P(f'•&nbsp;&nbsp;{f}', 'body') for f in fixes]))

# ── 04 Efekt kataloğu ─────────────────────────────────────────────────
section('04', 'Efekt kataloğu', 'Aralıklar ve varsayılan değerler uygulamadaki denetimlerle birebir aynıdır. '
        '“Yerel AI” rozetli efektler modeli cihazda çalıştırır; ilk açılışta model birkaç saniyede yüklenir.')
cats = list(dict.fromkeys(e['category'] for e in EFFECTS))
for ci, cat in enumerate(cats):
    group = [e for e in EFFECTS if e['category'] == cat]
    rows = [[P('<b>Efekt</b>', 'th'), P('<b>Ne yapar?</b>', 'th'), P('<b>Denetim</b>', 'th'), P('<b>Aralık</b>', 'th'), P('<b>Varsayılan</b>', 'th')]]
    spans = []
    for e in group:
        badge = ' <font size="7" color="#0279b1">YEREL AI</font>' if e['id'] in ('deep', 'rnnoise') else (' <font size="7" color="#ca8a04">DENEYSEL</font>' if e['id'] == 'autotune' else '')
        desc = escape(e['description']) + (f'<br/><font color="#5d6f85" size="7.6">{escape(e["note"])}</font>' if e.get('note') else '')
        params = e['params']
        if e['id'] == 'eq':
            plist = [('Bant kazancı', '−12 … +12 dB', '0 dB'), ('Frekans', '20 … 20.000 Hz', '31 Hz – 16 kHz'), ('Q', '0,1 … 20', '1,4'), ('Ön kazanç', '−30 … +12 dB', '0 dB')]
        elif not params:
            plist = [('—', 'Yalnızca aç/kapat', '')]
        else:
            plist = []
            for a in params:
                if a.get('options'):
                    plist.append((a['label'], ' / '.join(a['options']), a['options'][int(a['value'])]))
                else:
                    r, d = rng(a); plist.append((a['label'], r, d))
        start = len(rows)
        for j, (lab, r, d) in enumerate(plist):
            rows.append([P(f'<b>{escape(e["name"])}</b>{badge}', 'cellb') if j == 0 else '', P(desc, 'cell') if j == 0 else '',
                         P(escape(lab), 'cell'), P(escape(r), 'cell'), P(escape(d), 'cell')])
        if len(plist) > 1: spans += [('SPAN', (0, start), (0, len(rows) - 1)), ('SPAN', (1, start), (1, len(rows) - 1))]
        spans.append(('LINEBELOW', (0, len(rows) - 1), (-1, len(rows) - 1), .8, LINE))
    t = Table(rows, colWidths=[86, 168, 82, 92, 63], repeatRows=1)
    color = HexColor(CAT_COLORS[ci % len(CAT_COLORS)])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('FONTSIZE', (0, 0), (-1, -1), 8),
                           ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                           ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
                           ('BACKGROUND', (0, 0), (-1, 0), TINT), ('LINEBELOW', (0, 0), (-1, 0), .9, color)] + spans))
    head = Table([[Paragraph(f'<font color="{CAT_COLORS[ci % len(CAT_COLORS)]}">■</font>&nbsp;&nbsp;{escape(cat)}  <font size="8.5" color="#5d6f85">· {len(group)} efekt</font>',
                             ParagraphStyle('ch', fontName='SegoeSB', fontSize=12.5, leading=16, textColor=INK))]], colWidths=[491])
    head.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    story.append(CondPageBreak(140))
    story.append(head)
    story.append(t)

# ── 05 Profiller ──────────────────────────────────────────────────────
section('05', 'Profiller, cihazlar ve muafiyetler')
pres = [('Dengeli', 'Düz eğri; doğal bir başlangıç.'), ('Bas vurgusu', 'Alt frekanslar +6 dB’e kadar; daha dolgun ses.'),
        ('Vokal netliği', 'Orta frekanslar öne, baslar geri; konuşma ve vokal ön planda.'), ('Sinema', 'Güçlü bas ve parlak tiz, hafif geri orta; geniş dinleme hissi.')]
story.append(KeepTogether([P('Hazır ekolayzır profilleri', 'h2'), table([[P('<b>Profil</b>', 'th'), P('<b>Karakter</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in pres], [120, 371])]))
item('Kişisel profiller', 'Parametrik ekolayzırı, tüm efekt ayarlarını ve zincir sırasını isimle kaydeder (en fazla 40 karakter). IR dosyası profile dahil edilmez. '
     'Profiller sayfasından uygulanır; silme işlemi onay ister ve o profili kullanan cihaz kurallarını da kaldırır.')
item('Cihazları algıla', 'Bağlı giriş ve çıkış aygıtlarını listeler. Cihaz adları için geçici mikrofon izni gerekebilir; tarama bitince açılan akış hemen kapatılır. İzin reddedilirse çıkışlar yine listelenir.')
item('Otomatik yükleme kuralları', 'Bir giriş veya çıkış cihazını bir profille eşleştir; cihaz seçildiğinde ya da bağlandığında ilk eşleşen kural uygulanır. '
     'Eşleşme kalmadığında son profil korunur ya da seçtiğin varsayılan profile dönülür.')
item('Muafiyetler', 'Dosya veya mikrofon adında geçen metne göre (büyük/küçük harf duyarsız) efekt zinciri atlanır; kaynak kazancı ve çıkış seviyesi korunur. '
     'Örneğin “bildirim” kuralı adı bu kelimeyi içeren dosyalarda efektleri devre dışı bırakır. Uygulama adına göre muafiyet, sistem geneli ses işlenmediği için desteklenmez.')

# ── 06 Ayarlar ────────────────────────────────────────────────────────
section('06', 'Ayarlar ve performans')
sets = [('Tema', 'Açık / koyu', 'Koyu'), ('Girişte başlat', 'Windows oturumu açılınca uygulamayı başlatır', 'Kapalı'),
        ('Kapatınca tamamen çık', 'Kapalıysa pencere sistem tepsisine gizlenir, ses işleme sürer', 'Açık'),
        ('Başlangıçta gizle', 'Uygulama doğrudan tepside başlar', 'Kapalı'),
        ('Mikrofon kazancı', '0–24 dB; efektlerden önce, yalnızca mikrofona; ardından −1 dB tepe koruması', '+6 dB'),
        ('Spektrum aralığı', 'Alt 20 Hz’den, üst 24 kHz’e kadar', '20 Hz–20 kHz'),
        ('Kare hızı', '10 / 15 / 30 / 60 FPS; yalnızca çizim sıklığı', '30 FPS'),
        ('Atıllık süresi', '0–600 sn; dosya durmuş ve mikrofon kapalıysa motor askıya alınır (0 = kapalı)', '30 sn'),
        ('Tampon hedefi', '128 / 256 / 512 / 1.024 / 2.048 örnek; yeni motor açılışında uygulanan bir istektir', '512 örnek')]
story.append(table([[P('<b>Ayar</b>', 'th'), P('<b>Açıklama</b>', 'th'), P('<b>Varsayılan</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell'), P(c, 'cell')] for a, b, c in sets], [118, 283, 90]))
story.append(Spacer(1, 6))
story.append(P('İşleme 48 kHz’te, AudioWorklet 128 örneklik bloklarla yapılır. Pencere gizliyken spektrum çizilmez; ses yokken yenileme saniyede bire iner. '
               'Mikrofon girişte kendiliğinden açılmaz.', 'small'))
item('Varsayılana dönüş', 'Onay sonrası ses ve arayüz tercihleri, efektler, cihaz kuralları ve muafiyetler sıfırlanır: ses %70, tema koyu, yalnızca ekolayzır açık. '
     'Kaydedilen kişisel profiller ve Windows başlangıç tercihleri korunur.')

# ── 07 Veri ───────────────────────────────────────────────────────────
section('07', 'İçe aktarma ve veri yönetimi')
data = [('Equalizer APO / AutoEQ', 'Ekolayzır panelinden metin profili alınır: en fazla 10 filtre, PK / LS / HS türleri. GraphicEQ ve keyfi APO komutları desteklenmez; sınırı aşan dosya reddedilir.'),
        ('Convolver IR', 'WAV / OGG / FLAC, en fazla 10 saniye ve 25 MB; 1, 2 veya 4 kanal. IR yalnızca oturum boyunca tutulur.'),
        ('JSON yedeği', 'Ses ayarları, kişisel profiller, cihaz kuralları ve muafiyetler dışa aktarılır. İçe aktarmada biçim doğrulanır ve onay istenir; dosya en fazla 2 MB.'),
        ('Yedeğe dahil olmayanlar', 'Ses ve IR dosyaları, Windows başlangıç tercihleri. Başka bilgisayarda cihaz kuralları yeniden eşleştirilmelidir.')]
story.append(table([[P('<b>İşlev</b>', 'th'), P('<b>Ayrıntı</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in data], [130, 361]))
story.append(Spacer(1, 10))
story.append(callout('<b>Gizlilik:</b> Ayarlar ve profiller bilgisayarında saklanır. DeepFilterNet ve RNNoise modelleri uygulamayla birlikte gelir ve cihazda çalışır; '
                     'ses internete gönderilmez, hesap veya ödeme gerekmez.', HexColor('#059669'), HexColor('#e8f7f1')))

# ── 08 Kurulum ve sınırlar ────────────────────────────────────────────
section('08', 'Kurulum, sınırlar ve lisans')
item('Kurulum ve kaldırma', f'<b>E-DUB Audio Setup {VERSION}.exe</b> (Windows x64), yönetici izniyle tüm kullanıcılar için C:\\Program Files\\E-DUB Audio altına kurar; '
     'masaüstü ve Başlat menüsü kısayolları oluşturur. Ayarlar → Uygulamalar’dan kaldırıldığında mevcut kullanıcının ayarları, profilleri ve başlangıç kaydı temizlenir; '
     'sürüm güncellemesinde veriler korunur. Dışa aktarılan yedekler ve kişisel ses/IR dosyaları silinmez. Kurulum paketi kod imzası taşımaz; Windows SmartScreen uyarı gösterebilir.')
lims = [('Crystalizer', 'Sıkıştırmada kaybolan veriyi geri getirmez.'), ('Autogain', 'RMS tabanlıdır; LUFS normalizasyonu değildir.'),
        ('Çok bantlı işlemciler', '250 Hz ve 2,5 kHz bant ayrımları kullanır.'), ('Limiter', 'Örnek tepe sınırlayıcıdır; true-peak ölçmez, kendisinden sonraki kazancı sınırlamaz.'),
        ('DeepFilterNet / RNNoise', 'Mono, 48 kHz konuşma için tasarlanmıştır; müzik için önerilmez.'),
        ('Voice Suppressor', 'Merkez kanal çıkarmadır, AI kaynak ayırma değildir.'),
        ('Pitch Shift / Autotune', 'Formant korumaz, artefakt oluşturabilir; Autotune deneyseldir ve tek sesli vokal içindir.'),
        ('Crosstalk Canceller', 'Basit ters çapraz beslemedir; oda kalibrasyonu yapmaz.')]
story.append(KeepTogether([P('Bilinmesi gereken sınırlar', 'h2'), table([[P('<b>Bileşen</b>', 'th'), P('<b>Sınır</b>', 'th')]] + [[P(a, 'cellb'), P(b, 'cell')] for a, b in lims], [130, 361])]))
item('Lisans', 'E-DUB Audio GNU GPL v3 ile yayımlanır. Electron/Chromium, DeepFilterNet (MIT / Apache-2.0) ve RNNoise (Apache-2.0 / BSD-3-Clause) kendi lisanslarını korur; '
     'ayrıntılar THIRD-PARTY-NOTICES.md dosyasındadır.')
L = lambda u, t: f'<link href="{u}" color="#0279b1">{t}</link>'
story.append(KeepTogether([P('Bağlantılar', 'h2'),
    P(L('https://github.com/Nergal-exe/E-DUB-Audio', 'github.com/Nergal-exe/E-DUB-Audio') + ' — kaynak kod<br/>' +
      L('https://github.com/Nergal-exe/E-DUB-Audio/releases/latest', 'github.com/Nergal-exe/E-DUB-Audio/releases/latest') + ' — son sürüm ve kurulum dosyası')]))

# ── Sayfa düzeni ──────────────────────────────────────────────────────
W, H = A4
def cover(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(HexColor('#05afea')); c.rect(52, H - 60, 46, 4, fill=1, stroke=0)
    c.drawImage(str(ROOT / 'public/logo.png'), W - 52 - 250, H - 60 - 290, 250, 250, mask='auto')
    c.setFillColor(HexColor('#1b2939')); c.rect(52, 52, W - 104, .8, fill=1, stroke=0)
    c.setFont('Segoe', 8.5); c.setFillColor(HexColor('#8b9aaf'))
    c.drawString(52, 36, 'GNU GPL v3 · github.com/Nergal-exe/E-DUB-Audio')
    c.restoreState()
def page(c, doc):
    c.saveState()
    c.setFillColor(HexColor('#05afea')); c.rect(52, H - 34, 30, 3, fill=1, stroke=0)
    c.setFont('Segoe', 7.8); c.setFillColor(MUTED)
    c.drawRightString(W - 52, H - 34, f'E-DUB Audio {VERSION} · Amaç ve özellikler')
    c.setStrokeColor(LINE); c.setLineWidth(.6); c.line(52, 42, W - 52, 42)
    c.drawString(52, 29, 'Yerel ses işleme stüdyosu · Windows')
    c.drawRightString(W - 52, 29, f'{doc.page}')
    c.restoreState()

doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=52, rightMargin=52, topMargin=52, bottomMargin=58,
                      title=f'E-DUB Audio {VERSION} — Programın Amacı ve Tüm Özellikleri', author='Nergal-exe',
                      subject='Kullanım rehberi', pageCompression=1)
frame = Frame(52, 58, W - 104, H - 110, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate('cover', [frame], onPage=cover), PageTemplate('content', [frame], onPage=page)])
doc.build(story)
print(OUT)

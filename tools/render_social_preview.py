"""Render the site's typography and original circuit artwork as a social card."""
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
S = 2
BG, WHITE, MUTED, CYAN = '#0c0c0c', '#f2f2f2', '#a3a3a3', '#04d9ff'
card = Image.new('RGB', (2400, 1260), BG)
d = ImageDraw.Draw(card)
fonts = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts'


def text(x, y, value, size, fill=WHITE, face='arial.ttf'):
    d.text((x*S, y*S), value, font=ImageFont.truetype(str(fonts/face), size*S), fill=fill)


def line(points, fill='#343434', width=1):
    d.line([(x*S, y*S) for x, y in points], fill=fill, width=width*S, joint='curve')


def box(bounds, outline='#333333', fill=None, radius=0, width=1):
    d.rounded_rectangle(tuple(v*S for v in bounds), radius=radius*S,
                        outline=outline, fill=fill, width=width*S)


def circle(x, y, r, outline='#343434', fill=None, width=1):
    d.ellipse(((x-r)*S, (y-r)*S, (x+r)*S, (y+r)*S),
              outline=outline, fill=fill, width=width*S)


# Quiet grid and signal paths echo the scrolling circuit on the website.
for x in range(770, 1180, 28):
    for y in range(110, 520, 28):
        circle(x, y, .8, '#292e30', '#292e30')
line([(64, 114), (1136, 114)], '#292929')
line([(64, 114), (164, 114)], CYAN, 2)
text(64, 53, '</>', 27, CYAN, 'consola.ttf')
text(129, 55, 'george-lab', 24, WHITE, 'consola.ttf')
text(885, 61, 'PERSONAL PORTFOLIO', 16, MUTED, 'consola.ttf')

# Large, short copy remains readable in a compact link preview.
text(62, 160, 'George Yazijy', 76, WHITE, 'arialbd.ttf')
text(66, 271, 'Engineer by trade.', 42)
text(66, 326, 'Curious by nature.', 42, '#9bdde8')

# Processor and orbital paths connect embedded hardware with curiosity.
cx, cy = 945, 310
circle(cx, cy, 136, '#26383c')
circle(cx, cy, 109, '#243033')
circle(cx, cy, 164, '#1c2528')
for pts in [[(763,189),(809,189),(852,232),(891,232),(891,255)],
            [(999,365),(999,405),(1044,450),(1127,450)],
            [(782,431),(823,431),(866,388),(866,336),(890,336)],
            [(1000,285),(1043,285),(1074,254),(1126,254)]]:
    line(pts, '#42616a', 2)
    circle(*pts[0], 4, CYAN, BG)
    circle(*pts[-1], 4, CYAN, BG)
for offset in [-30, -10, 10, 30]:
    line([(cx+offset,cy-70),(cx+offset,cy-55)], '#657a7e', 2)
    line([(cx+offset,cy+55),(cx+offset,cy+70)], '#657a7e', 2)
    line([(cx-70,cy+offset),(cx-55,cy+offset)], '#657a7e', 2)
    line([(cx+55,cy+offset),(cx+70,cy+offset)], '#657a7e', 2)
box((cx-55,cy-55,cx+55,cy+55), '#76b7c4', '#141e21', 12, 2)
box((cx-40,cy-40,cx+40,cy+40), '#31464c', '#111719', 5)
text(cx-34,cy-24,'</>',35,'#c1eff5','consola.ttf')
circle(945,174,5,CYAN,CYAN)
circle(1063,378,4,'#8dcbd6','#8dcbd6')
text(830,496,'HARDWARE / SOFTWARE',16,'#83999f','consola.ttf')
line([(64,550),(1136,550)], '#333333')
circle(71,583,3,CYAN,CYAN)
text(88,573,'BASED IN GERMANY',16,MUTED,'consola.ttf')
text(785,573,'georgeyaz.github.io/george-lab',16,'#c0c0c0','consola.ttf')

output = ROOT/'assets/social-preview.png'
card.resize((1200,630), Image.Resampling.LANCZOS).save(output, optimize=True)
print(f'Rendered {output.name}: 1200 x 630')

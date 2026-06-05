from PIL import Image, ImageDraw
import math

def create_ladybug(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    s = size / 128.0
    
    # Colors
    RED = (220, 38, 38, 255)       # bright red
    DARK_RED = (185, 28, 28, 255)  # shadow red
    BLACK = (30, 30, 30, 255)
    WHITE = (255, 255, 255, 255)
    
    cx, cy = size // 2, size // 2
    
    # Body (ellipse)
    body_w = int(56 * s)
    body_h = int(72 * s)
    body_top = cy - body_h // 2 + int(8 * s)
    
    # Draw shadow first
    shadow_off = max(1, int(2 * s))
    draw.ellipse(
        [cx - body_w//2 + shadow_off, body_top + shadow_off,
         cx + body_w//2 + shadow_off, body_top + body_h + shadow_off],
        fill=(0, 0, 0, 60)
    )
    
    # Main red body
    draw.ellipse(
        [cx - body_w//2, body_top,
         cx + body_w//2, body_top + body_h],
        fill=RED, outline=DARK_RED, width=max(1, int(2*s))
    )
    
    # Center line (black separator between wings)
    line_w = max(1, int(2 * s))
    draw.line(
        [(cx, body_top + int(6*s)), (cx, body_top + body_h - int(6*s))],
        fill=BLACK, width=line_w
    )
    
    # Spots on left wing
    spots_left = [
        (cx - int(16*s), body_top + int(18*s), int(7*s)),
        (cx - int(8*s), body_top + int(36*s), int(6*s)),
        (cx - int(18*s), body_top + int(48*s), int(8*s)),
    ]
    # Spots on right wing
    spots_right = [
        (cx + int(16*s), body_top + int(18*s), int(7*s)),
        (cx + int(8*s), body_top + int(36*s), int(6*s)),
        (cx + int(18*s), body_top + int(48*s), int(8*s)),
    ]
    # Top center spot (the 7th spot)
    spots_center = [
        (cx, body_top + int(12*s), int(5*s)),
    ]
    
    for x, y, r in spots_left + spots_right + spots_center:
        draw.ellipse([x-r, y-r, x+r, y+r], fill=BLACK)
    
    # Head (small black semi-circle on top)
    head_r = int(18 * s)
    head_y = body_top - int(4 * s)
    draw.ellipse(
        [cx - head_r, head_y - head_r, cx + head_r, head_y + head_r],
        fill=BLACK
    )
    
    # Antennae
    ant_len = int(14 * s)
    ant_thick = max(1, int(2 * s))
    # Left antenna
    draw.line(
        [(cx - int(8*s), head_y - int(4*s)),
         (cx - int(18*s), head_y - int(14*s))],
        fill=BLACK, width=ant_thick
    )
    draw.ellipse(
        [cx - int(20*s) - int(2*s), head_y - int(16*s) - int(2*s),
         cx - int(16*s) + int(2*s), head_y - int(12*s) + int(2*s)],
        fill=BLACK
    )
    # Right antenna
    draw.line(
        [(cx + int(8*s), head_y - int(4*s)),
         (cx + int(18*s), head_y - int(14*s))],
        fill=BLACK, width=ant_thick
    )
    draw.ellipse(
        [cx + int(16*s) - int(2*s), head_y - int(16*s) - int(2*s),
         cx + int(20*s) + int(2*s), head_y - int(12*s) + int(2*s)],
        fill=BLACK
    )
    
    return img

# Generate icons
for size in [16, 48, 128]:
    icon = create_ladybug(size)
    icon.save(f'icon{size}.png')
    print(f'Generated icon{size}.png ({size}x{size})')

import os
import struct
import zlib
import math

def create_png(width, height, get_pixel):
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw.extend((r, g, b, a))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    return png

def dist_to_segment(px, py, x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    l2 = dx*dx + dy*dy
    if l2 == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0, min(1, ((px - x1)*dx + (py - y1)*dy) / l2))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)

def icon_pixel(x, y, w, h):
    # Normalized coords from -1 to 1
    nx = (x + 0.5) / w * 2.0 - 1.0
    ny = (y + 0.5) / h * 2.0 - 1.0

    # Rounded rectangle distance
    corner_r = 0.28
    qx = abs(nx) - (1.0 - corner_r)
    qy = abs(ny) - (1.0 - corner_r)
    d_corner = math.hypot(max(0.0, qx), max(0.0, qy)) - corner_r
    d_rect = max(qx, qy)
    d = max(d_rect, d_corner)

    # Outside icon boundary (anti-aliased)
    if d > 0.05:
        return (0, 0, 0, 0)

    # Base background: Dark editorial slate #0f172a
    bg_r, bg_g, bg_b = 15, 23, 42

    # Checkmark segments in normalized coords
    # Checkmark points: (-0.45, 0.05) -> (-0.1, 0.40) -> (0.50, -0.35)
    d1 = dist_to_segment(nx, ny, -0.42, 0.02, -0.10, 0.38)
    d2 = dist_to_segment(nx, ny, -0.10, 0.38, 0.46, -0.32)
    min_check_d = min(d1, d2)
    stroke_w = 0.16

    if min_check_d < stroke_w:
        # Checkmark color: bright emerald green #10b981
        fg_r, fg_g, fg_b = 16, 185, 129
        # Anti-aliasing transition
        t = max(0.0, min(1.0, (stroke_w - min_check_d) / 0.04))
        r = int(bg_r * (1 - t) + fg_r * t)
        g = int(bg_g * (1 - t) + fg_g * t)
        b = int(bg_b * (1 - t) + fg_b * t)
        alpha = 255
    else:
        # Subtle ring / dot accent or plain bg
        r, g, b = bg_r, bg_g, bg_b
        alpha = 255

    if d > 0.0:
        edge_alpha = max(0.0, min(1.0, (0.05 - d) / 0.05))
        alpha = int(alpha * edge_alpha)

    return (r, g, b, alpha)

os.makedirs("frontend/public/icons", exist_ok=True)
for size in [16, 48, 128]:
    png_bytes = create_png(size, size, icon_pixel)
    out_path = f"frontend/public/icons/icon{size}.png"
    with open(out_path, "wb") as f:
        f.write(png_bytes)
    print(f"Generated {out_path} ({len(png_bytes)} bytes)")

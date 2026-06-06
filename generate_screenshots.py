#!/usr/bin/env python3
"""
Generate Chrome Web Store screenshots and promotional images.
Uses PIL to draw simulated UI of the Ladybug extension.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Config
W, H = 1280, 800
PROMO_W, PROMO_H = 440, 280
OUT_DIR = "store-assets"

# Colors (dark theme matching the extension)
BG = "#0f172a"
PANEL_BG = "#1e293b"
CARD_BG = "#1e293b"
HEADER_BG = "#0f172a"
BORDER = "#334155"
TEXT_PRIMARY = "#f1f5f9"
TEXT_SECONDARY = "#94a3b8"
TEXT_MUTED = "#64748b"
BLUE = "#3b82f6"
BLUE_LIGHT = "#60a5fa"
GREEN = "#22c55e"
RED = "#ef4444"
ORANGE = "#f97316"
YELLOW = "#eab308"
CODE_BG = "#0f172a"

# Load fonts
FONT_CN = "C:/Windows/Fonts/msyh.ttc"
FONT_EN = "C:/Windows/Fonts/segoeui.ttf"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

font_title = load_font(FONT_CN, 28)
font_header = load_font(FONT_CN, 20)
font_body = load_font(FONT_CN, 16)
font_small = load_font(FONT_CN, 14)
font_tiny = load_font(FONT_CN, 12)
font_mono = load_font(FONT_MONO, 13)
font_mono_sm = load_font(FONT_MONO, 11)

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def draw_text(draw, text, pos, font, fill, anchor="lt"):
    draw.text(pos, text, font=font, fill=fill, anchor=anchor)

def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def create_base():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    # Sidebar panel background
    draw.rectangle([20, 20, W-20, H-20], fill=PANEL_BG, outline=BORDER, width=2)
    # Header
    draw.rectangle([20, 20, W-20, 70], fill=HEADER_BG, outline=BORDER, width=2)
    # Ladybug icon + title
    draw.text((40, 45), "🐞", font=font_header, fill=TEXT_PRIMARY, anchor="lm")
    draw.text((70, 45), "Ladybug", font=font_header, fill=TEXT_PRIMARY, anchor="lm")
    draw.text((170, 48), "Test Assistant V1.0", font=font_small, fill=TEXT_MUTED, anchor="lm")
    # Tabs
    tab_w = (W - 40) // 2
    draw.rectangle([20, 70, 20 + tab_w, 110], fill=BLUE, outline=BORDER, width=1)
    draw.text((20 + tab_w//2, 90), "📋 Cases", font=font_body, fill=TEXT_PRIMARY, anchor="mm")
    draw.rectangle([20 + tab_w, 70, W-20, 110], fill=HEADER_BG, outline=BORDER, width=1)
    draw.text((20 + tab_w + tab_w//2, 90), "💬 AI", font=font_body, fill=TEXT_SECONDARY, anchor="mm")
    return img, draw

# ========== Screenshot 1: Recording ==========
def screenshot_recording():
    img, draw = create_base()
    # Red recording button
    draw_rounded_rect(draw, [40, 130, W//2 - 20, 175], 6, RED)
    draw.text((W//4 - 10, 152), "🔴 Start Recording", font=font_body, fill="#fff", anchor="mm")
    # Live steps panel
    draw.text((40, 195), "Test Cases (3)", font=font_header, fill=TEXT_PRIMARY)
    # Case card
    draw_rounded_rect(draw, [40, 230, W//2 - 30, 380], 6, CARD_BG, outline=BORDER)
    draw.text((60, 250), "Name: Recording_2026/6/6 10:44:50", font=font_small, fill=TEXT_PRIMARY)
    draw.text((60, 275), "http://localhost:8086/config", font=font_tiny, fill=BLUE_LIGHT)
    draw.text((60, 300), "3 steps", font=font_tiny, fill=TEXT_MUTED)
    draw.text((W//2 - 60, 300), "2026/6/6", font=font_tiny, fill=TEXT_MUTED, anchor="rm")
    draw_rounded_rect(draw, [60, 325, 180, 350], 4, BLUE)
    draw.text((120, 337), "Generate Script", font=font_tiny, fill="#fff", anchor="mm")
    draw_rounded_rect(draw, [190, 325, 310, 350], 4, ORANGE)
    draw.text((250, 337), "Export JSON", font=font_tiny, fill="#fff", anchor="mm")
    # Live recording indicator (right side)
    draw_rounded_rect(draw, [W//2 + 10, 130, W-40, 380], 6, CARD_BG, outline=BORDER)
    draw.text((W//2 + 30, 155), "🔴 Recording  3 steps recorded", font=font_body, fill=RED)
    steps = [
        ("click", "#submit-btn", "//button[@type='submit']", "Click login button"),
        ("input", "#username", "//*[@id='username']", "Enter username"),
        ("input", "#password", "//*[@id='password']", "Enter password"),
    ]
    y = 190
    for action, sel, xpath, desc in steps:
        draw.text((W//2 + 30, y), f"#{steps.index((action,sel,xpath,desc))+1} {action}", font=font_small, fill=TEXT_SECONDARY)
        draw.text((W//2 + 50, y + 20), f"Selector: {sel}", font=font_tiny, fill=TEXT_MUTED)
        draw.text((W//2 + 50, y + 38), f"XPath: {xpath}", font=font_tiny, fill=TEXT_MUTED)
        y += 65
    return img

# ========== Screenshot 2: Test Cases List ==========
def screenshot_cases():
    img, draw = create_base()
    # Search bar
    draw_rounded_rect(draw, [40, 130, W//2 - 20, 160], 4, CODE_BG, outline=BORDER)
    draw.text((55, 145), "🔍 Search case name...", font=font_small, fill=TEXT_MUTED)
    # URL filter
    draw_rounded_rect(draw, [40, 170, W//2 - 20, 200], 4, CODE_BG, outline=BORDER)
    draw.text((55, 185), "📍 All Page URLs", font=font_small, fill=TEXT_MUTED)
    # Case cards
    cases = [
        ("Recording_2026/6/6 10:44:50", "http://localhost:8086/config", "3 steps", True),
        ("Recording_2026/6/5 09:22:11", "http://localhost:8086/login", "4 steps", False),
        ("Recording_2026/6/4 14:15:33", "http://localhost:8086/dashboard", "2 steps", False),
    ]
    y = 220
    for name, url, steps, expanded in cases:
        h = 160 if expanded else 90
        draw_rounded_rect(draw, [40, y, W//2 - 30, y + h], 6, CARD_BG, outline=BORDER if not expanded else BLUE)
        draw.text((60, y + 20), f"Name: {name}", font=font_small, fill=TEXT_PRIMARY)
        draw.text((60, y + 42), url, font=font_tiny, fill=BLUE_LIGHT)
        draw.text((60, y + 62), steps, font=font_tiny, fill=TEXT_MUTED)
        # Action buttons
        draw_rounded_rect(draw, [W//2 - 180, y + 15, W//2 - 120, y + 40], 4, GREEN)
        draw.text((W//2 - 150, y + 27), "▶ Run", font=font_tiny, fill="#fff", anchor="mm")
        draw.text((W//2 - 100, y + 27), "🗑", font=font_tiny, fill=TEXT_MUTED)
        if expanded:
            draw.text((60, y + 90), "▼ Expand Details", font=font_tiny, fill=TEXT_MUTED)
            # Step detail preview
            draw_rounded_rect(draw, [60, y + 110, W//2 - 50, y + 150], 4, CODE_BG, outline=BORDER)
            draw.text((75, y + 122), "#1 click", font=font_tiny, fill=TEXT_SECONDARY)
            draw.text((75, y + 138), "Selector: #submit-btn", font=font_tiny, fill=TEXT_MUTED)
        y += h + 15
    # Right side: expanded case detail
    draw_rounded_rect(draw, [W//2 + 10, 130, W-40, H-80], 6, CARD_BG, outline=BORDER)
    draw.text((W//2 + 30, 155), "Steps Detail", font=font_header, fill=TEXT_PRIMARY)
    step_y = 190
    for i in range(3):
        draw_rounded_rect(draw, [W//2 + 30, step_y, W-60, step_y + 90], 4, CODE_BG, outline=BORDER)
        draw.text((W//2 + 45, step_y + 15), f"#{i+1} click", font=font_small, fill=TEXT_SECONDARY)
        draw.text((W//2 + 45, step_y + 35), "Selector: #el-id-3631-126", font=font_tiny, fill=TEXT_MUTED)
        draw.text((W//2 + 45, step_y + 52), 'XPath: //*[@placeholder="Enter username"]', font=font_tiny, fill=TEXT_MUTED)
        draw.text((W//2 + 45, step_y + 69), "Page: http://localhost:8086/login", font=font_tiny, fill=TEXT_MUTED)
        step_y += 105
    return img

# ========== Screenshot 3: AI Chat ==========
def screenshot_ai():
    img, draw = create_base()
    # AI tab active
    tab_w = (W - 40) // 2
    draw.rectangle([20, 70, 20 + tab_w, 110], fill=HEADER_BG, outline=BORDER, width=1)
    draw.text((20 + tab_w//2, 90), "📋 Cases", font=font_body, fill=TEXT_SECONDARY, anchor="mm")
    draw.rectangle([20 + tab_w, 70, W-20, 110], fill=BLUE, outline=BORDER, width=1)
    draw.text((20 + tab_w + tab_w//2, 90), "💬 AI", font=font_body, fill=TEXT_PRIMARY, anchor="mm")

    # Mode tabs
    draw_rounded_rect(draw, [40, 130, 120, 160], 4, BLUE)
    draw.text((80, 145), "LLM", font=font_small, fill="#fff", anchor="mm")
    draw_rounded_rect(draw, [130, 130, 230, 160], 4, CARD_BG, outline=BORDER)
    draw.text((180, 145), "Agent", font=font_small, fill=TEXT_SECONDARY, anchor="mm")

    # Quick action buttons
    draw.text((40, 180), "👋 Welcome! What would you like to do today?", font=font_body, fill=TEXT_PRIMARY)
    buttons = [
        (40, 215, "🔍 Analyze Page"),
        (220, 215, "📝 Generate Test Cases"),
        (440, 215, "✨ Optimization Tips"),
    ]
    for bx, by, label in buttons:
        draw_rounded_rect(draw, [bx, by, bx + 170, by + 36], 6, CARD_BG, outline=BORDER)
        draw.text((bx + 85, by + 18), label, font=font_small, fill=TEXT_PRIMARY, anchor="mm")

    # Chat messages
    y = 280
    # User message
    draw_rounded_rect(draw, [W - 380, y, W - 40, y + 50], 12, BLUE)
    draw.text((W - 60, y + 25), "Generate test cases for this page", font=font_small, fill="#fff", anchor="rm")
    y += 70
    # AI message
    draw_rounded_rect(draw, [40, y, W - 200, y + 200], 12, CARD_BG, outline=BORDER)
    draw.text((60, y + 20), "🤖 AI Assistant", font=font_small, fill=BLUE_LIGHT)
    lines = [
        "Based on the current page, I've designed comprehensive",
        "functional test cases for the login module:",
        "",
        "1. Valid login with correct credentials",
        "2. Invalid login with wrong password",
        "3. Empty username/password validation",
        "4. Password visibility toggle test",
        "5. Remember me functionality",
        "",
        "All test cases are ready for export to CSV.",
    ]
    ly = y + 45
    for line in lines:
        draw.text((60, ly), line, font=font_tiny, fill=TEXT_SECONDARY)
        ly += 18
    return img

# ========== Screenshot 4: Script Viewer ==========
def screenshot_script():
    img, draw = create_base()
    draw.text((40, 130), "🐍 Generated Script", font=font_header, fill=TEXT_PRIMARY)
    draw.text((40, 165), "Recording_2026/6/6 10:44:50  ·  headless", font=font_small, fill=TEXT_MUTED)
    # Code block
    draw_rounded_rect(draw, [40, 200, W-40, H-60], 8, CODE_BG, outline=BORDER)
    code_lines = [
        ('"""Auto-generated Playwright test script', TEXT_SECONDARY),
        ('Test case: Recording_2026/6/6 10:44:50', TEXT_SECONDARY),
        ('Generated at: 2026-06-06T10:44:50Z', TEXT_SECONDARY),
        ('"""', TEXT_SECONDARY),
        ('', TEXT_SECONDARY),
        ('import pytest', TEXT_SECONDARY),
        ('from playwright.sync_api import Page', YELLOW),
        ('', TEXT_SECONDARY),
        ('def test_recording(page: Page):', BLUE_LIGHT),
        ('    # Navigate to target page', TEXT_MUTED),
        ('    page.goto("http://localhost:8086/login")', TEXT_PRIMARY),
        ('', TEXT_SECONDARY),
        ('    # Step 1: click', TEXT_MUTED),
        ('    page.locator("#username").fill("admin")', TEXT_PRIMARY),
        ('    page.locator("#password").fill("password123")', TEXT_PRIMARY),
        ('    page.locator("#submit-btn").click()', TEXT_PRIMARY),
        ('', TEXT_SECONDARY),
        ('    # Step 2: verify', TEXT_MUTED),
        ('    expect(page.locator(".welcome")).to_be_visible()', GREEN),
    ]
    y = 220
    for line, color in code_lines:
        draw.text((60, y), line, font=font_mono, fill=color)
        y += 22
    return img

# ========== Screenshot 5: Settings ==========
def screenshot_settings():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, W-20, H-20], fill=PANEL_BG, outline=BORDER, width=2)
    # Header
    draw.rectangle([20, 20, W-20, 70], fill=HEADER_BG, outline=BORDER, width=2)
    draw.text((40, 45), "🐞", font=font_header, fill=TEXT_PRIMARY, anchor="lm")
    draw.text((70, 45), "Ladybug", font=font_header, fill=TEXT_PRIMARY, anchor="lm")
    # Settings title
    draw.text((40, 100), "⚙️ Settings", font=font_header, fill=TEXT_PRIMARY)
    # AI Provider
    draw.text((40, 150), "AI Provider", font=font_body, fill=TEXT_SECONDARY)
    draw_rounded_rect(draw, [40, 180, 300, 215], 4, CODE_BG, outline=BORDER)
    draw.text((55, 197), "OpenAI", font=font_small, fill=TEXT_PRIMARY)
    # Base URL
    draw.text((40, 235), "Base URL", font=font_body, fill=TEXT_SECONDARY)
    draw_rounded_rect(draw, [40, 265, 500, 300], 4, CODE_BG, outline=BORDER)
    draw.text((55, 282), "https://api.openai.com/v1", font=font_small, fill=TEXT_PRIMARY)
    # API Key
    draw.text((40, 320), "API Key", font=font_body, fill=TEXT_SECONDARY)
    draw_rounded_rect(draw, [40, 350, 500, 385], 4, CODE_BG, outline=BORDER)
    draw.text((55, 367), "sk-************************************", font=font_small, fill=TEXT_MUTED)
    # Model
    draw.text((40, 405), "Model", font=font_body, fill=TEXT_SECONDARY)
    draw_rounded_rect(draw, [40, 435, 300, 470], 4, CODE_BG, outline=BORDER)
    draw.text((55, 452), "gpt-4o", font=font_small, fill=TEXT_PRIMARY)
    # Language
    draw.text((40, 495), "Language", font=font_body, fill=TEXT_SECONDARY)
    draw_rounded_rect(draw, [40, 525, 140, 560], 4, BLUE)
    draw.text((90, 542), "🇺🇸 English", font=font_small, fill="#fff", anchor="mm")
    # Login Profiles section
    draw.text((600, 150), "Login Profiles (2)", font=font_header, fill=TEXT_PRIMARY)
    profiles = [
        ("Login Config", "自动化测试平台登录", "http://localhost:8086/login", "4 steps"),
        ("Login Config", "管理系统登录", "http://localhost:8086/admin", "3 steps"),
    ]
    y = 190
    for label, name, url, steps in profiles:
        draw_rounded_rect(draw, [600, y, W-40, y + 100], 6, CARD_BG, outline=BORDER)
        draw_rounded_rect(draw, [620, y + 15, 700, y + 38], 4, BLUE)
        draw.text((660, y + 26), label, font=font_tiny, fill="#fff", anchor="mm")
        draw.text((710, y + 26), name, font=font_small, fill=BLUE_LIGHT, anchor="lm")
        draw.text((620, y + 55), url, font=font_tiny, fill=BLUE_LIGHT)
        draw.text((620, y + 75), steps, font=font_tiny, fill=TEXT_MUTED)
        draw_rounded_rect(draw, [W - 160, y + 15, W - 80, y + 40], 4, GREEN)
        draw.text((W - 120, y + 27), "▶ Run", font=font_tiny, fill="#fff", anchor="mm")
        y += 120
    # Save button
    draw_rounded_rect(draw, [40, 620, 140, 660], 6, BLUE)
    draw.text((90, 640), "Save", font=font_body, fill="#fff", anchor="mm")
    return img

# ========== Promotional Image (Small) 440x280 ==========
def promotional_small():
    img = Image.new("RGB", (PROMO_W, PROMO_H), BG)
    draw = ImageDraw.Draw(img)
    # Gradient-like background
    for y in range(PROMO_H):
        r = int(15 + (30-15) * y / PROMO_H)
        g = int(23 + (41-23) * y / PROMO_H)
        b = int(42 + (59-42) * y / PROMO_H)
        draw.line([(0, y), (PROMO_W, y)], fill=(r, g, b))
    # Decorative elements
    draw.ellipse([300, -40, 480, 80], outline=BORDER, width=1)
    draw.ellipse([-60, 180, 100, 340], outline=BORDER, width=1)
    # Title
    draw.text((PROMO_W//2, 70), "🐞", font=load_font(FONT_CN, 48), fill=TEXT_PRIMARY, anchor="mm")
    draw.text((PROMO_W//2, 130), "Ladybug", font=load_font(FONT_CN, 32), fill=TEXT_PRIMARY, anchor="mm")
    draw.text((PROMO_W//2, 165), "Test Assistant", font=load_font(FONT_EN, 18), fill=BLUE_LIGHT, anchor="mm")
    # Features
    features = [
        "🎬 Record → Generate Python Scripts",
        "🤖 AI-Powered Test Case Design",
        "🐞 Playwright & Pytest Ready",
    ]
    y = 205
    for feat in features:
        draw.text((PROMO_W//2, y), feat, font=font_tiny, fill=TEXT_SECONDARY, anchor="mm")
        y += 22
    return img

# ========== Main ==========
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    shots = [
        ("screenshot-1-recording.png", screenshot_recording, "Recording interface"),
        ("screenshot-2-cases.png", screenshot_cases, "Test cases list"),
        ("screenshot-3-ai.png", screenshot_ai, "AI chat panel"),
        ("screenshot-4-script.png", screenshot_script, "Generated script"),
        ("screenshot-5-settings.png", screenshot_settings, "Settings page"),
    ]
    
    for fname, fn, desc in shots:
        img = fn()
        img.save(os.path.join(OUT_DIR, fname))
        print(f"[OK] {fname} ({desc}) - {img.size[0]}x{img.size[1]}")
    
    promo = promotional_small()
    promo.save(os.path.join(OUT_DIR, "promo-small-440x280.png"))
    print(f"[OK] promo-small-440x280.png - {promo.size[0]}x{promo.size[1]}")
    
    print(f"\nAll assets saved to ./{OUT_DIR}/")

if __name__ == "__main__":
    main()

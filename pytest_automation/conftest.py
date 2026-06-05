"""
pytest 全局配置 - 最简版本（匹配七星瓢虫插件）
"""
import pytest
from pathlib import Path
from playwright.sync_api import sync_playwright

# 项目根目录
ROOT_DIR = Path(__file__).parent
# 录制文件目录
RECORDINGS_DIR = ROOT_DIR / "recordings"


@pytest.fixture(scope="function")
def driver():
    """Playwright Page 对象"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=100)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        context.set_default_timeout(10000)
        page = context.new_page()
        yield page
        context.close()
        browser.close()

"""
步骤执行引擎 - 将七星瓢虫插件导出的 JSON 步骤映射到 Playwright 操作
"""
import time
from typing import List, Dict, Any

from playwright.sync_api import Page, Locator


class StepExecutor:
    """JSON 步骤执行器"""

    def __init__(self, page: Page, default_timeout: int = 10000):
        self.page = page
        self.default_timeout = default_timeout

    def _is_vague_selector(self, selector: str) -> bool:
        """判断选择器是否过于宽泛（纯标签名，如 'li', 'div', 'span'）"""
        return bool(selector and selector.strip().isalpha())

    def _resolve_locator(self, target: Dict[str, Any]) -> Locator:
        """根据 target 解析元素定位器（优先精确的定位方式）"""
        selector = target.get("selector", "")
        xpath = target.get("xpath")
        text = target.get("text", "")

        # 策略1：XPath 通常最精确（特别是包含 text() 的）
        if xpath:
            locator = self.page.locator(f"xpath={xpath}")
            locator.wait_for(timeout=self.default_timeout, state="visible")
            return locator

        # 策略2：CSS Selector（跳过过于宽泛的纯标签选择器）
        if selector and not self._is_vague_selector(selector):
            locator = self.page.locator(selector)
            locator.wait_for(timeout=self.default_timeout, state="visible")
            return locator

        # 策略3：纯标签名 + 文本匹配
        if selector and self._is_vague_selector(selector):
            tag_name = selector.strip().lower()
            if text:
                locator = self.page.locator(f'{tag_name}:has-text("{text}")')
                locator.wait_for(timeout=self.default_timeout, state="visible")
                return locator

        # 策略4：仅文本匹配（无标签限制）
        if text:
            locator = self.page.locator(f'text="{text}"')
            locator.wait_for(timeout=self.default_timeout, state="visible")
            return locator

        raise ValueError(
            f"无法解析元素定位器: selector={selector}, xpath={xpath}, text={text}"
        )

    def execute_steps(self, steps: List[Dict[str, Any]]) -> None:
        """执行步骤列表"""
        total = len(steps)
        if total == 0:
            return

        # 如果当前是空白页，先导航到第一个步骤的 URL
        current_url = self.page.url
        if current_url == "about:blank" or current_url == "":
            first_url = steps[0].get("url", "")
            if first_url:
                print(f"  [导航] -> {first_url}")
                self.page.goto(first_url)
                self.page.wait_for_load_state("networkidle")

        for i, step in enumerate(steps, 1):
            action = step.get("action", "unknown")
            target = step.get("target", {})
            desc = target.get("selector") or target.get("xpath") or target.get("text", "")
            step_url = step.get("url", "")

            # 如果步骤 URL 和当前页面不同，先导航（处理页面跳转）
            if step_url and self.page.url.split("?")[0] != step_url.split("?")[0]:
                print(f"  [{i}/{total}] navigate -> {step_url}")
                self.page.goto(step_url)
                self.page.wait_for_load_state("networkidle")

            print(f"  [{i}/{total}] {action}: {desc}")
            self._execute_single_step(step)
            # 步骤间短暂间隔，让页面有时间响应
            time.sleep(0.3)

    def _execute_single_step(self, step: Dict[str, Any]) -> None:
        """执行单个步骤"""
        action = step.get("action")
        target = step.get("target", {})
        value = step.get("value", "")
        url = step.get("url", "")

        if action == "navigate":
            navigate_url = url or value
            if navigate_url:
                self.page.goto(navigate_url)
                self.page.wait_for_load_state("networkidle")
            return

        if action == "click":
            locator = self._resolve_locator(target)
            locator.click()
            # 点击后短暂等待，处理 SPA 路由切换
            self.page.wait_for_timeout(500)
            return

        if action == "input":
            locator = self._resolve_locator(target)
            locator.fill(str(value))
            # 触发 input / change 事件，确保 React/Vue 响应
            locator.dispatch_event("input")
            locator.dispatch_event("change")
            return

        if action == "select":
            locator = self._resolve_locator(target)
            locator.select_option(value=str(value))
            return

        if action == "wait":
            wait_ms = int(value) if str(value).isdigit() else 1000
            self.page.wait_for_timeout(wait_ms)
            return

        raise ValueError(f"不支持的操作类型: {action}")

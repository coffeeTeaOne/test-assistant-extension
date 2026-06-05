import { RecordingSession, ScriptCode } from '../shared/types'

function escapePyString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function buildPlaywrightCode(recording: RecordingSession, mode: 'gui' | 'headless'): string {
  const isHeadless = mode === 'headless'

  const stepsCode = recording.steps.map((step, index) => {
    const target = step.target
    const locator = target.xpath
      ? `page.locator("xpath=${escapePyString(target.xpath)}")`
      : `page.locator("${escapePyString(target.selector || 'body')}")`

    switch (step.action) {
      case 'click':
        return `    # Step ${index + 1}: click
    ${locator}.wait_for(state="visible", timeout=10000)
    ${locator}.click()
    page.wait_for_load_state("networkidle")`

      case 'input':
        return `    # Step ${index + 1}: input
    ${locator}.fill("${escapePyString(step.value || '')}")
    ${locator}.dispatch_event("input")
    ${locator}.dispatch_event("change")`

      case 'select':
        return `    # Step ${index + 1}: select
    ${locator}.check()`

      case 'navigate':
        return `    # Step ${index + 1}: navigate
    page.goto("${escapePyString(step.url || recording.steps[0]?.url || '')}")
    page.wait_for_load_state("networkidle")`

      case 'wait':
        return `    # Step ${index + 1}: wait
    page.wait_for_timeout(${parseInt(step.value || '1000')})`

      default:
        return `    # Step ${index + 1}: ${step.action} (unsupported)`
    }
  }).join('\n\n')

  return `"""
Auto-generated Playwright test script
Test case: ${escapePyString(recording.name)}
Steps: ${recording.steps.length}
Generated at: ${new Date().toISOString()}
"""

from playwright.sync_api import sync_playwright


def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=${isHeadless})
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True
        )
        page = context.new_page()

        # Navigate to starting page
        page.goto("${escapePyString(recording.steps[0]?.url || 'about:blank')}")
        page.wait_for_load_state("networkidle")

${stepsCode}

        print("All steps completed successfully.")
        context.close()
        browser.close()


if __name__ == "__main__":
    run_test()
`
}

function buildSeleniumCode(recording: RecordingSession): string {
  const stepsCode = recording.steps.map((step, index) => {
    const target = step.target
    const by = target.xpath
      ? `(By.XPATH, "${escapePyString(target.xpath)}")`
      : `(By.CSS_SELECTOR, "${escapePyString(target.selector || 'body')}")`

    switch (step.action) {
      case 'click':
        return `    # Step ${index + 1}: click
    driver.find_element${by}.click()
    time.sleep(1)`

      case 'input':
        return `    # Step ${index + 1}: input
    element = driver.find_element${by}
    element.clear()
    element.send_keys("${escapePyString(step.value || '')}")`

      case 'select':
        return `    # Step ${index + 1}: select
    element = driver.find_element${by}
    if not element.is_selected():
        element.click()`

      case 'navigate':
        return `    # Step ${index + 1}: navigate
    driver.get("${escapePyString(step.url || recording.steps[0]?.url || '')}")`

      case 'wait':
        return `    # Step ${index + 1}: wait
    time.sleep(${parseInt(step.value || '1000') / 1000})`

      default:
        return `    # Step ${index + 1}: ${step.action} (unsupported)`
    }
  }).join('\n\n')

  return `"""
Auto-generated Selenium test script
Test case: ${escapePyString(recording.name)}
Steps: ${recording.steps.length}
Generated at: ${new Date().toISOString()}
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
import time


def run_test():
    driver = webdriver.Chrome()
    driver.implicitly_wait(10)

    try:
        driver.get("${escapePyString(recording.steps[0]?.url || 'about:blank')}")

${stepsCode}

        print("All steps completed successfully.")

    finally:
        driver.quit()


if __name__ == "__main__":
    run_test()
`
}

export async function generateScript(
  recording: RecordingSession,
  framework: 'playwright' | 'selenium',
  options?: {
    mode?: 'gui' | 'headless'
    async?: boolean
  }
): Promise<ScriptCode> {
  const mode = options?.mode || 'gui'

  if (framework === 'playwright') {
    const code = buildPlaywrightCode(recording, mode)
    return {
      language: 'python',
      framework: 'playwright',
      mode,
      code,
      generatedAt: Date.now()
    }
  } else {
    const code = buildSeleniumCode(recording)
    return {
      language: 'python',
      framework: 'selenium',
      mode: 'gui',
      code,
      generatedAt: Date.now()
    }
  }
}

/**
 * 将录制会话导出为 JSON 步骤文件（供 pytest 读取执行）
 */
export function generateJson(recording: RecordingSession): string {
  const exportData = {
    id: recording.id,
    name: recording.name,
    createdAt: recording.createdAt,
    updatedAt: recording.updatedAt,
    steps: recording.steps.map((step, index) => ({
      stepIndex: index + 1,
      action: step.action,
      target: step.target,
      value: step.value,
      url: step.url,
      timestamp: step.timestamp,
    })),
  }
  return JSON.stringify(exportData, null, 2)
}

import { DOMListener } from './dom-listener'
import { TestStep, PageContext } from '../shared/types'

// 创建全局监听器实例
const domListener = new DOMListener()

// ─── 辅助函数（用于 GET_PAGE_CONTEXT）─────────────────────────────

function isDynamicId(id: string): boolean {
  if (!id) return false
  if (/^el-[a-z]+-\d+/i.test(id)) return true
  if (/^__BVID__/i.test(id)) return true
  if (/^\d+$/.test(id)) return true
  if (/^[a-f0-9]{8,}$/i.test(id)) return true
  return false
}

function generateSimpleXPath(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  if (el.id && !isDynamicId(el.id)) return `//*[@id="${el.id}"]`
  const text = (el.textContent || '').trim().slice(0, 40)
  if (text && text.length > 0) {
    const xp = `//${tag}[contains(normalize-space(text()),"${text.replace(/"/g, '\\"')}")]`
    try {
      const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      if (r.singleNodeValue === el) return xp
    } catch (e) {}
  }
  const aria = el.getAttribute('aria-label')
  if (aria) {
    const xp = `//${tag}[@aria-label="${aria}"]`
    try {
      const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      if (r.singleNodeValue === el) return xp
    } catch (e) {}
  }
  const name = el.getAttribute('name')
  if (name) {
    const xp = `//${tag}[@name="${name}"]`
    try {
      const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      if (r.singleNodeValue === el) return xp
    } catch (e) {}
  }
  let idx = 1
  let sib = el.previousElementSibling
  while (sib) {
    if (sib.tagName === el.tagName) idx++
    sib = sib.previousElementSibling
  }
  const parent = el.parentElement
  if (parent && parent !== document.body) {
    const parentTag = parent.tagName.toLowerCase()
    return `//${parentTag}/${tag}[${idx}]`
  }
  return `//${tag}[${idx}]`
}

// 样式 ID
const OVERLAY_ID = 'test-assistant-overlay'
const BADGE_ID = 'test-assistant-badge'
const STYLE_ID = 'test-assistant-exec-styles'

// 注入执行样式
function injectExecStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      border: 4px solid #3b82f6 !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.3), 0 0 20px rgba(59,130,246,0.8) !important;
      transition: all 0.3s ease !important;
      box-sizing: border-box !important;
    }
    #${OVERLAY_ID}.success {
      border-color: #22c55e !important;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.2), 0 0 20px rgba(34,197,94,0.8) !important;
    }
    #${OVERLAY_ID}.error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.2), 0 0 20px rgba(239,68,68,0.8) !important;
    }
    #${BADGE_ID} {
      position: fixed !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      background: #3b82f6 !important;
      color: #fff !important;
      padding: 4px 10px !important;
      border-radius: 4px !important;
      font-family: monospace !important;
      font-size: 14px !important;
      font-weight: bold !important;
      white-space: nowrap !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
      transition: all 0.3s ease !important;
    }
    #${BADGE_ID}.success {
      background: #22c55e !important;
    }
    #${BADGE_ID}.error {
      background: #ef4444 !important;
    }
  `
  document.head.appendChild(style)
}

// 清除高亮和标签
function clearExecVisuals() {
  const overlay = document.getElementById(OVERLAY_ID)
  const badge = document.getElementById(BADGE_ID)
  if (overlay) overlay.remove()
  if (badge) badge.remove()
}

// 高亮元素（使用 fixed overlay，不会被目标网站 CSS 影响）
function highlightElement(element: HTMLElement, label: string, status: 'running' | 'success' | 'error' = 'running') {
  injectExecStyles()
  clearExecVisuals()

  const rect = element.getBoundingClientRect()
  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  overlay.className = status
  overlay.style.left = rect.left + 'px'
  overlay.style.top = rect.top + 'px'
  overlay.style.width = rect.width + 'px'
  overlay.style.height = rect.height + 'px'

  const badge = document.createElement('div')
  badge.id = BADGE_ID
  badge.className = status
  badge.textContent = label
  badge.style.left = rect.left + 'px'
  badge.style.top = Math.max(4, rect.top - 32) + 'px'

  document.body.appendChild(overlay)
  document.body.appendChild(badge)

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// 判断选择器是否过于宽泛（纯标签名，如 'li', 'div', 'span'）
function isVagueSelector(selector: string): boolean {
  return /^[a-zA-Z]+$/.test(selector.trim())
}

// 安全的 querySelector，支持 XPath 降级
function safeQuerySelector(target: TestStep['target']): HTMLElement | null {
  // 策略1：优先 XPath（通常更精确，特别是包含 text() 的）
  if (target.xpath) {
    try {
      const result = document.evaluate(
        target.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      const el = result.singleNodeValue as HTMLElement
      if (el) return el
    } catch (e) {
      console.warn('XPath invalid:', target.xpath, e)
    }
  }

  // 策略2：CSS Selector（跳过过于宽泛的纯标签选择器）
  if (target.selector && !isVagueSelector(target.selector)) {
    try {
      const el = document.querySelector(target.selector) as HTMLElement
      if (el) return el
    } catch (e) {
      console.warn('CSS selector invalid:', target.selector, e)
    }
  }

  // 策略3：对于纯标签选择器，尝试结合文本内容做模糊匹配
  if (target.selector && isVagueSelector(target.selector)) {
    const tagName = target.selector.trim().toLowerCase()
    const elements = document.getElementsByTagName(tagName)
    // 如果有文本信息，按文本匹配
    if (target.text) {
      for (const el of elements) {
        if (el.textContent?.trim() === target.text.trim()) {
          return el as HTMLElement
        }
      }
    }
    // 如果有 ARIA 信息，按 ARIA 匹配
    if (target.aria) {
      for (const el of elements) {
        if (el.getAttribute('aria-label') === target.aria) {
          return el as HTMLElement
        }
      }
    }
  }

  // 策略4：ARIA 属性匹配
  if (target.aria) {
    const el = document.querySelector(`[aria-label="${CSS.escape(target.aria)}"]`) as HTMLElement
    if (el) return el
  }

  return null
}

// 从 JSON 数据执行多步（前端解析引擎）
async function executeStepsFromJson(steps: TestStep[], speed: number): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    await executeStep(steps[i], i, steps.length, speed)
    // 步骤间间隔
    await new Promise(r => setTimeout(r, 400))
  }
  clearExecVisuals()
}

// 执行单个步骤（用于回放）
async function executeStep(step: TestStep, stepIndex: number, totalSteps: number, speed: number): Promise<void> {
  const label = `[${stepIndex + 1}/${totalSteps}] ${step.action}`

  // 查找元素 —— 优先精确的定位方式
  let element: HTMLElement | null = null

  // 策略1：优先 XPath（包含 text() 的 XPath 通常最精确）
  if (step.target.xpath) {
    try {
      const result = document.evaluate(
        step.target.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      element = result.singleNodeValue as HTMLElement
    } catch (e) { /* invalid xpath */ }
  }

  // 策略2：CSS Selector（跳过过于宽泛的纯标签选择器如 'li', 'div'）
  if (!element && step.target.selector && !isVagueSelector(step.target.selector)) {
    try {
      element = document.querySelector(step.target.selector) as HTMLElement
    } catch (e) { /* invalid selector */ }
  }

  // 策略3：安全降级
  if (!element) {
    element = safeQuerySelector(step.target)
  }

  if (!element) {
    throw new Error(`元素未找到: ${step.target.selector}`)
  }

  // 高亮（蓝色 running）
  highlightElement(element, label, 'running')

  // 等待观察
  await new Promise(resolve => setTimeout(resolve, Math.max(speed, 800)))

  try {
    switch (step.action) {
      case 'click': {
        // 计算元素中心坐标
        const rect = element.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        // 优先在可见子元素上触发事件（让事件自然冒泡到父元素）
        let targetEl: HTMLElement = element
        const child = element.querySelector('span, i, svg, img, em, strong, b')
        if (child && child instanceof HTMLElement) {
          targetEl = child
        }

        const mouseInit = {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 1,
          clientX: cx,
          clientY: cy,
          screenX: cx + window.screenX,
          screenY: cy + window.screenY + (window.outerHeight - window.innerHeight),
          offsetX: rect.width / 2,
          offsetY: rect.height / 2,
          detail: 1
        } as MouseEventInit

        // 聚焦目标元素
        if ('focus' in element && typeof (element as any).focus === 'function') {
          ;(element as any).focus()
        }

        // 完整的人类点击事件序列（带真实坐标）
        targetEl.dispatchEvent(new MouseEvent('mouseenter', mouseInit))
        await new Promise(r => setTimeout(r, 40))
        targetEl.dispatchEvent(new MouseEvent('mouseover', mouseInit))
        await new Promise(r => setTimeout(r, 40))
        targetEl.dispatchEvent(new MouseEvent('mousedown', mouseInit))
        await new Promise(r => setTimeout(r, 40))

        // PointerEvents（现代浏览器优先）
        if (typeof PointerEvent !== 'undefined') {
          targetEl.dispatchEvent(new PointerEvent('pointerdown', {
            ...mouseInit,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            width: 1,
            height: 1,
            pressure: 0.5
          } as PointerEventInit))
          await new Promise(r => setTimeout(r, 40))
        }

        targetEl.dispatchEvent(new MouseEvent('mouseup', mouseInit))
        await new Promise(r => setTimeout(r, 40))

        if (typeof PointerEvent !== 'undefined') {
          targetEl.dispatchEvent(new PointerEvent('pointerup', {
            ...mouseInit,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            width: 1,
            height: 1,
            pressure: 0
          } as PointerEventInit))
          await new Promise(r => setTimeout(r, 40))
        }

        // 最后触发 click —— 让事件冒泡触发 Vue/React 的事件处理器
        targetEl.dispatchEvent(new MouseEvent('click', mouseInit))

        // 兜底：如果元素是 <a> 标签且仍无响应，尝试直接调用原生 click()
        const aTag = element.closest('a')
        if (aTag && aTag instanceof HTMLAnchorElement) {
          await new Promise(r => setTimeout(r, 100))
          if (window.location.href === step.url || !step.url) {
            aTag.click()
          }
        }

        break
      }

      case 'input': {
        const input = element as HTMLInputElement | HTMLTextAreaElement
        const text = step.value || ''

        // 1. Focus
        input.focus()
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        await new Promise(r => setTimeout(r, 150))

        // 2. 选中全部内容
        input.select()
        await new Promise(r => setTimeout(r, 100))

        // 3. 获取原生 value setter（绕过 React/Vue 劫持）
        const proto = input instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
        const nativeSetter = descriptor?.set

        if (nativeSetter) {
          nativeSetter.call(input, text)
        } else {
          input.value = text
        }

        // 4. 触发事件序列
        const eventInit = { bubbles: true, cancelable: true, composed: true }

        input.dispatchEvent(new Event('input', eventInit))
        await new Promise(r => setTimeout(r, 100))

        input.dispatchEvent(new KeyboardEvent('keydown', { ...eventInit, key: 'End' }))
        input.dispatchEvent(new KeyboardEvent('keyup', { ...eventInit, key: 'End' }))
        await new Promise(r => setTimeout(r, 100))

        input.dispatchEvent(new Event('change', eventInit))
        await new Promise(r => setTimeout(r, 100))

        // 5. 兜底
        if (input.value !== text) {
          input.value = text
          input.dispatchEvent(new Event('input', eventInit))
          input.dispatchEvent(new Event('change', eventInit))
          await new Promise(r => setTimeout(r, 100))
        }

        // 6. Blur
        input.dispatchEvent(new Event('blur', eventInit))
        await new Promise(r => setTimeout(r, 150))

        // 7. 验证
        if (input.value !== text) {
          throw new Error(`输入值未生效: 期望 "${text}", 实际 "${input.value}"`)
        }
        break
      }

      case 'select': {
        const checkbox = element as HTMLInputElement
        checkbox.focus()
        checkbox.checked = step.value === 'true'
        checkbox.dispatchEvent(new Event('change', { bubbles: true }))
        break
      }

      case 'navigate':
        if (step.url && step.url !== window.location.href) {
          window.location.href = step.url
        }
        break

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, parseInt(step.value || '1000')))
        break
    }

    // 标记成功（绿色）
    highlightElement(element, `${label} ✅`, 'success')
    await new Promise(resolve => setTimeout(resolve, 800))
    clearExecVisuals()

  } catch (error: any) {
    // 标记失败（红色）
    highlightElement(element, `${label} ❌ ${error.message.slice(0, 30)}`, 'error')
    await new Promise(resolve => setTimeout(resolve, 1500))
    clearExecVisuals()
    throw error
  }
}

// 监听来自 background / sidepanel 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'START_RECORDING':
      domListener.startRecording()
      sendResponse({ success: true })
      break

    case 'STOP_RECORDING':
      domListener.stopRecording()
      sendResponse({ success: true })
      break

    case 'HIGHLIGHT_ELEMENT': {
      let el: HTMLElement | null = null
      // 优先 XPath
      if (message.payload.xpath) {
        try {
          const result = document.evaluate(
            message.payload.xpath, document, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null
          )
          el = result.singleNodeValue as HTMLElement
        } catch (e) { /* invalid xpath */ }
      }
      // 其次 CSS selector
      if (!el && message.payload.selector) {
        try {
          el = document.querySelector(message.payload.selector) as HTMLElement
        } catch (e) { /* invalid selector */ }
      }
      if (el) {
        const label = message.payload.label || '高亮元素'
        highlightElement(el, label, 'running')
        sendResponse({ success: true, found: true, tag: el.tagName, text: el.textContent?.slice(0, 60) })
      } else {
        sendResponse({ success: false, found: false, error: 'Element not found' })
      }
      break
    }

    case 'GET_PAGE_CONTEXT': {
      const doc = document
      const maxElements = message.payload?.maxElements || 30

      // 收集可交互元素
      const interactive: PageContext['interactiveElements'] = []
      const allInteractive = doc.querySelectorAll(
        'a, button, input, textarea, select, [role="button"], [role="link"], [onclick]'
      )
      for (let i = 0; i < Math.min(allInteractive.length, maxElements); i++) {
        const el = allInteractive[i] as HTMLElement
        const tag = el.tagName.toLowerCase()
        const text = (el.textContent || el.getAttribute('value') || el.getAttribute('aria-label') || '').trim().slice(0, 80)
        const id = el.id && !isDynamicId(el.id) ? `#${el.id}` : ''
        const classes = Array.from(el.classList)
          .filter(c => c.length > 2 && !/^[a-z]-/.test(c))
          .slice(0, 2).join('.')
        const selector = id || (classes ? `.${classes}` : tag)
        const xpath = generateSimpleXPath(el)
        interactive.push({
          tag,
          text,
          selector,
          xpath,
          type: el.getAttribute('type') || undefined,
          placeholder: (el as any).placeholder || el.getAttribute('placeholder') || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
        })
      }

      // 收集表单详情
      const formsDetail: PageContext['formsDetail'] = []
      const forms = doc.querySelectorAll('form')
      forms.forEach(form => {
        const inputs: any[] = []
        form.querySelectorAll('input, textarea, select').forEach(inp => {
          const inputEl = inp as HTMLInputElement
          inputs.push({
            name: inputEl.name || undefined,
            type: inputEl.type || inputEl.tagName.toLowerCase(),
            placeholder: inputEl.placeholder || undefined,
            selector: inputEl.id ? `#${inputEl.id}` : inputEl.name ? `[name="${inputEl.name}"]` : inputEl.tagName.toLowerCase(),
          })
        })
        formsDetail.push({
          action: (form as HTMLFormElement).action || undefined,
          method: (form as HTMLFormElement).method || undefined,
          inputs,
        })
      })

      sendResponse({
        success: true,
        url: window.location.href,
        title: doc.title,
        elements: {
          forms: forms.length,
          inputs: doc.querySelectorAll('input, textarea, select').length,
          buttons: doc.querySelectorAll('button, [role="button"]').length,
          links: doc.querySelectorAll('a').length,
        },
        interactiveElements: interactive,
        formsDetail: formsDetail.length > 0 ? formsDetail : undefined,
      })
      break
    }

    case 'CLEAR_HIGHLIGHT':
      clearExecVisuals()
      sendResponse({ success: true })
      break

    case 'PING':
      sendResponse({ success: true, pong: true })
      break

    case 'EXECUTE_STEP': {
      const { step, stepIndex, totalSteps, speed } = message.payload
      executeStep(step, stepIndex, totalSteps, speed || 1200)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true
    }

    case 'EXECUTE_JSON': {
      const { steps, speed } = message.payload
      executeStepsFromJson(steps, speed || 1200)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true
    }

    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }

  return false
})

// 页面加载完成，通知 background
try {
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    payload: { url: window.location.href }
  })
} catch (error) {
  console.error('Failed to send content script ready message:', error)
}

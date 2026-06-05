import { generateSelector } from './selector'
import { TestStep } from '../shared/types'
import { generateId } from '../shared/utils'

export class DOMListener {
  private isRecording = false

  // 点击防抖：同一个元素 300ms 内只记一次，不同元素不受影响
  private lastClickedSelector = ''
  private lastClickTime = 0
  private clickDebounce = 300

  // 存储绑定后的函数引用，用于清理
  private boundClickHandler: (event: MouseEvent) => void
  private boundInputHandler: (event: Event) => void
  private boundChangeHandler: (event: Event) => void
  private boundSubmitHandler: (event: Event) => void

  constructor() {
    // 预先绑定函数，以便后续可以正确移除
    this.boundClickHandler = this.handleClick.bind(this)
    this.boundInputHandler = this.handleInput.bind(this)
    this.boundChangeHandler = this.handleChange.bind(this)
    this.boundSubmitHandler = this.handleSubmit.bind(this)
    this.setupListeners()
  }

  setupListeners() {
    // 监听点击事件
    document.addEventListener('click', this.boundClickHandler, true)

    // 监听输入事件
    document.addEventListener('input', this.boundInputHandler, true)

    // 监听 change 事件（用于 select, checkbox 等）
    document.addEventListener('change', this.boundChangeHandler, true)

    // 监听表单提交
    document.addEventListener('submit', this.boundSubmitHandler, true)
  }

  private handleClick(event: MouseEvent) {
    if (!this.isRecording) return
    if (!(event.target instanceof Element)) return

    let target = event.target as Element

    // 如果点击的是 SVG/IMG 等行内元素，找到最近的可点击父元素
    const inlineTags = new Set(['SVG', 'PATH', 'CIRCLE', 'RECT', 'LINE', 'POLYGON', 'POLYLINE', 'ELLIPSE', 'G', 'USE', 'TEXT', 'TSPAN', 'IMG', 'BR', 'HR'])
    if (inlineTags.has(target.tagName)) {
      const clickable = target.closest('a, button, [role="button"], li, label, input, select, textarea, summary, details')
      if (clickable) target = clickable
    }

    const selector = generateSelector(target as HTMLElement)
    const selectorKey = selector.xpath || selector.selector || ''

    // 同一个元素 300ms 内只记一次，不同元素不受影响
    const now = Date.now()
    if (selectorKey === this.lastClickedSelector && now - this.lastClickTime < this.clickDebounce) {
      return
    }
    this.lastClickedSelector = selectorKey
    this.lastClickTime = now

    const step: TestStep = {
      id: generateId(),
      action: 'click',
      target: selector,
      timestamp: now,
      url: window.location.href
    }

    this.sendStep(step)
  }

  private inputDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private lastInputTarget: HTMLInputElement | HTMLTextAreaElement | null = null

  private handleInput(event: Event) {
    if (!this.isRecording) return
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return

    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    this.lastInputTarget = target

    // 防抖：用户停止输入 800ms 后才记录
    if (this.inputDebounceTimer) {
      clearTimeout(this.inputDebounceTimer)
    }

    this.inputDebounceTimer = setTimeout(() => {
      if (!this.isRecording || !this.lastInputTarget) return
      if (this.lastInputTarget !== target) return

      const selector = generateSelector(target)
      const step: TestStep = {
        id: generateId(),
        action: 'input',
        target: selector,
        value: target.value,
        timestamp: Date.now(),
        url: window.location.href
      }
      this.sendStep(step)
      this.lastInputTarget = null
    }, 800)
  }

  private handleChange(event: Event) {
    if (!this.isRecording) return
    if (!(event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement)) return

    const target = event.target as HTMLSelectElement | HTMLInputElement

    // 跳过文本输入框的 change 事件（避免和 input 防抖重复记录）
    if (target instanceof HTMLInputElement && ['text', 'password', 'email', 'tel', 'url', 'search', 'number'].includes(target.type)) {
      return
    }

    const selector = generateSelector(target)

    const step: TestStep = {
      id: generateId(),
      action: target.type === 'checkbox' || target.type === 'radio' ? 'select' : 'input',
      target: selector,
      value: target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')
        ? target.checked.toString()
        : target.value,
      timestamp: Date.now(),
      url: window.location.href
    }

    this.sendStep(step)
  }

  private handleSubmit(event: Event) {
    if (!this.isRecording) return

    // 找到触发表单提交的元素（通常是提交按钮）
    const submitter = event instanceof SubmitEvent && event.submitter
    if (submitter instanceof HTMLElement) {
      const selector = generateSelector(submitter)
      const step: TestStep = {
        id: generateId(),
        action: 'click',
        target: selector,
        timestamp: Date.now(),
        url: window.location.href
      }
      this.sendStep(step)
    }
  }

  private sendStep(step: TestStep) {
    try {
      chrome.runtime.sendMessage({
        type: 'EVENT_RECORDED',
        payload: step
      })
    } catch (error) {
      console.error('Failed to send recorded event:', error)
    }
  }

  startRecording() {
    this.isRecording = true
    this.lastClickedSelector = ''
    this.lastClickTime = 0
  }

  stopRecording() {
    this.isRecording = false
  }

  /**
   * 清理所有事件监听器
   * 在卸载时调用以防止内存泄漏
   */
  cleanup() {
    document.removeEventListener('click', this.boundClickHandler, true)
    document.removeEventListener('input', this.boundInputHandler, true)
    document.removeEventListener('change', this.boundChangeHandler, true)
    document.removeEventListener('submit', this.boundSubmitHandler, true)
  }
}

interface SelectorResult {
  selector: string
  xpath?: string
  aria?: string
  text?: string
}

// 判断 id 是否为 Vue/Element UI 等框架生成的动态 ID（页面刷新后会变化）
function isDynamicId(id: string): boolean {
  if (!id) return false
  // Element Plus: el-id-xxx, el-popper-xxx, el-collapse-xxx, el-tabs-xxx
  if (/^el-[a-z]+-\d+/i.test(id)) return true
  // Bootstrap Vue: __BVID__xxx
  if (/^__BVID__/i.test(id)) return true
  // 纯数字 id
  if (/^\d+$/.test(id)) return true
  // hash 类 id（8位以上十六进制或随机字符）
  if (/^[a-f0-9]{8,}$/i.test(id)) return true
  return false
}

// 生成元素的唯一选择器（优先稳定属性，避免长路径）
export function generateSelector(element: HTMLElement): SelectorResult {
  const result: SelectorResult = {
    selector: '',
    xpath: generateXPath(element),
    aria: element.getAttribute('aria-label') || element.getAttribute('aria-describedby') || undefined,
    text: getElementText(element),
  }

  // 1. 如果有 id 且不是动态生成的，直接返回 #id（最稳定）
  if (element.id && !isDynamicId(element.id)) {
    result.selector = `#${CSS.escape(element.id)}`
    return result
  }

  // 2. 如果有 data-testid / data-id 等测试属性（跳过值为空的 Vue scoped style 属性）
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && attr.value && attr.value.trim().length > 0) {
      // 跳过 Vue/React 框架自动注入的 scoped/hash 属性（值很短或是 hash）
      if (/^data-v-[a-f0-9]+$/i.test(attr.name) && attr.value === '') continue
      const sel = `[${CSS.escape(attr.name)}="${CSS.escape(attr.value)}"]`
      if (isUniqueSelector(sel)) {
        result.selector = sel
        return result
      }
    }
  }

  // 3. 如果有 name 属性（表单元素常用）
  const nameAttr = element.getAttribute('name')
  if (nameAttr) {
    result.selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(nameAttr)}"]`
    return result
  }

  // 4. 如果有 aria-label，用属性选择器
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) {
    result.selector = `[aria-label="${CSS.escape(ariaLabel)}"]`
    return result
  }

  // 5. 如果有 placeholder（输入框常用），用属性选择器
  const placeholder = element.getAttribute('placeholder')
  if (placeholder) {
    const sel = `${element.tagName.toLowerCase()}[placeholder="${CSS.escape(placeholder)}"]`
    if (isUniqueSelector(sel)) {
      result.selector = sel
      return result
    }
  }

  // 6. 生成短路径选择器（最多向上找 2 层父元素）
  const shortSelector = generateShortSelector(element, 2)
  if (shortSelector) {
    result.selector = shortSelector
    return result
  }

  // 6. 兜底：完整路径（带 nth-child）
  result.selector = generateFullPath(element)
  return result
}

// 生成短路径选择器（向上查找 maxLevels 层）
function generateShortSelector(element: HTMLElement, maxLevels: number): string | null {
  const tag = element.tagName.toLowerCase()
  const text = getElementText(element)

  // 对输入框优先用 name/placeholder 属性，不要用纯 tag
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    const name = element.getAttribute('name')
    if (name) {
      const sel = `${tag}[name="${CSS.escape(name)}"]`
      if (isUniqueSelector(sel)) return sel
    }
    const ph = element.getAttribute('placeholder')
    if (ph) {
      const sel = `${tag}[placeholder="${CSS.escape(ph)}"]`
      if (isUniqueSelector(sel)) return sel
    }
    const type = element.getAttribute('type')
    if (type && type !== 'text') {
      const sel = `${tag}[type="${CSS.escape(type)}"]`
      if (isUniqueSelector(sel)) return sel
    }
  }

  // 对导航菜单/链接，优先用文本内容生成选择器
  if ((tag === 'a' || tag === 'li' || tag === 'span' || tag === 'button') && text && text.length < 30) {
    // 尝试用 tag + 文本（:contains 不支持，用 nth-match 思路）
    const sameTagSameText = Array.from(document.querySelectorAll(tag)).filter(
      el => getElementText(el as HTMLElement) === text
    )
    if (sameTagSameText.length === 1) {
      // 如果文本唯一，尝试结合父元素生成更短的选择器
      const textSel = generateTextSelector(element, text)
      if (textSel) return textSel
    }
  }

  // 尝试用 tag + text 组合（限定在父元素下查找）
  if (text && text.length < 30) {
    const byText = Array.from(document.querySelectorAll(tag)).filter(
      el => getElementText(el as HTMLElement) === text
    )
    if (byText.length === 1) {
      return tag // 文本唯一，直接用 tag
    }
  }

  // 尝试用 tag + class 组合（最多2个class，且过滤掉动态类）
  const stableClasses = getStableClasses(element)
  if (stableClasses.length > 0) {
    const classSel = tag + '.' + stableClasses.map(c => CSS.escape(c)).join('.')
    if (isUniqueSelector(classSel)) return classSel
  }

  // 向上查找父元素辅助定位
  if (maxLevels > 0 && element.parentElement && element.parentElement !== document.body) {
    const parent = element.parentElement
    const parentSel = generateShortSelector(parent, maxLevels - 1)
    if (parentSel) {
      // 在当前父元素下用 tag + nth-of-type 定位
      const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName)
      if (siblings.length === 1) {
        return `${parentSel} > ${tag}`
      } else {
        const index = siblings.indexOf(element) + 1
        return `${parentSel} > ${tag}:nth-of-type(${index})`
      }
    }
  }

  return null
}

// 获取稳定的 className（过滤掉明显是 hash 的动态类）
function getStableClasses(element: HTMLElement): string[] {
  if (!element.className || typeof element.className !== 'string') return []

  return element.className
    .trim()
    .split(/\s+/)
    .filter(c => {
      // 过滤掉纯 hash 类名（如 css-123abc、_abc123、tailwind 的乱码类）
      if (/^[a-f0-9]{5,}$/i.test(c)) return false
      if (/^_[a-z0-9]{6,}$/i.test(c)) return false
      if (/^(css|sc|styled)-/i.test(c)) return false
      return c.length > 0
    })
    .slice(0, 2) // 最多取前 2 个稳定 class
}

// 用文本内容生成选择器（结合父元素）
function generateTextSelector(element: HTMLElement, text: string): string | null {
  const tag = element.tagName.toLowerCase()
  // 先尝试直接用 tag
  const allSameTag = Array.from(document.querySelectorAll(tag))
  const sameText = allSameTag.filter(el => getElementText(el as HTMLElement) === text)
  if (sameText.length === 1) return tag

  // 尝试 :nth-of-type
  const parent = element.parentElement
  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName)
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1
      return `${tag}:nth-of-type(${index})`
    }
  }

  return null
}

// 检查选择器是否唯一
function isUniqueSelector(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1
  } catch {
    return false
  }
}

// 生成完整路径（兜底方案）
function generateFullPath(element: HTMLElement): string {
  const path: string[] = []
  let current: HTMLElement | null = element
  let levels = 0

  while (current && current !== document.body && levels < 6) {
    let selector = current.tagName.toLowerCase()
    const stableClasses = getStableClasses(current)

    if (stableClasses.length > 0) {
      selector += '.' + stableClasses.map(c => CSS.escape(c)).join('.')
    } else {
      // 没有稳定 class 时才用 nth-of-type
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current!.tagName)
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1
          selector += `:nth-of-type(${index})`
        }
      }
    }

    path.unshift(selector)
    current = current.parentElement
    levels++
  }

  return path.join(' > ')
}

// 检查 XPath 是否唯一
function isUniqueXPath(xpath: string): boolean {
  try {
    const result = document.evaluate(
      xpath, document, null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    )
    return result.snapshotLength === 1
  } catch {
    return false
  }
}

// 生成 XPath（优先属性/文本，避免纯索引路径）
function generateXPath(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase()

  // 1. id 最稳定
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  // 2. name 属性
  const name = element.getAttribute('name')
  if (name) {
    const xp = `//${tag}[@name="${name}"]`
    if (isUniqueXPath(xp)) return xp
  }

  // 3. aria-label
  const aria = element.getAttribute('aria-label')
  if (aria) {
    const xp = `//${tag}[@aria-label="${aria}"]`
    if (isUniqueXPath(xp)) return xp
  }

  // 4. placeholder
  const placeholder = element.getAttribute('placeholder')
  if (placeholder) {
    const xp = `//${tag}[@placeholder="${placeholder}"]`
    if (isUniqueXPath(xp)) return xp
  }

  // 5. 文本内容（导航菜单、按钮、链接等最可靠的定位方式）
  const text = getElementText(element)
  if (text && text.length < 50) {
    // 5.1 精确文本匹配
    let xp = `//${tag}[text()="${text}"]`
    if (isUniqueXPath(xp)) return xp

    // 5.2 normalize-space 匹配（忽略前后空白差异）
    xp = `//${tag}[normalize-space(text())="${text}"]`
    if (isUniqueXPath(xp)) return xp

    // 5.3 contains 文本匹配
    xp = `//${tag}[contains(text(), "${text}")]`
    if (isUniqueXPath(xp)) return xp

    // 5.4 normalize-space + contains
    xp = `//${tag}[contains(normalize-space(text()), "${text}")]`
    if (isUniqueXPath(xp)) return xp
  }

  // 6. 稳定的 class
  const stableClasses = getStableClasses(element)
  if (stableClasses.length > 0) {
    const cond = stableClasses.map(c => `contains(@class, "${c}")`).join(' and ')
    const xp = `//${tag}[${cond}]`
    if (isUniqueXPath(xp)) return xp
  }

  // 7. type 属性（input 专用）
  const type = element.getAttribute('type')
  if (type && tag === 'input') {
    const xp = `//${tag}[@type="${type}"]`
    if (isUniqueXPath(xp)) return xp
  }

  // 8. 短路径：向上最多3层，每层尽量用属性而不是纯索引
  const short = generateXPathShortPath(element, 3)
  if (short) return short

  // 9. 兜底：完整路径（带索引）
  return generateXPathFullPath(element)
}

// 生成 XPath 短路径（向上最多 maxLevels 层，每层优先用属性）
function generateXPathShortPath(element: HTMLElement, maxLevels: number): string | null {
  if (maxLevels <= 0 || !element.parentElement || element === document.body) {
    return generateXPathSegment(element)
  }

  const segment = generateXPathSegment(element)
  const parent = element.parentElement

  if (!parent) return segment

  const parentPath = generateXPathShortPath(parent, maxLevels - 1)
  if (!parentPath) return segment

  return `${parentPath}/${segment}`
}

// 生成单个元素的 XPath 段（优先用属性，而不是 [n] 索引）
function generateXPathSegment(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase()

  // 尝试用属性定位（跳过动态 ID）
  if (element.id && !isDynamicId(element.id)) return `${tag}[@id="${element.id}"]`

  const name = element.getAttribute('name')
  if (name) {
    const xp = `${tag}[@name="${name}"]`
    if (isUniqueXPath(xp)) return xp
  }

  const aria = element.getAttribute('aria-label')
  if (aria) {
    const xp = `${tag}[@aria-label="${aria}"]`
    if (isUniqueXPath(xp)) return xp
  }

  const text = getElementText(element)
  if (text && text.length < 30) {
    const xp = `${tag}[text()="${text}"]`
    if (isUniqueXPath(xp)) return xp
  }

  const stableClasses = getStableClasses(element)
  if (stableClasses.length > 0) {
    const cond = stableClasses.map(c => `contains(@class, "${c}")`).join(' and ')
    const xp = `${tag}[${cond}]`
    if (isUniqueXPath(xp)) return xp
  }

  // 最终用索引
  let index = 1
  let sibling = element.previousElementSibling
  while (sibling) {
    if (sibling.tagName === element.tagName) index++
    sibling = sibling.previousElementSibling
  }
  return `${tag}[${index}]`
}

// 生成 XPath 完整路径（最终兜底）
function generateXPathFullPath(element: HTMLElement): string {
  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.documentElement) {
    let index = 1
    let sibling = current.previousElementSibling
    while (sibling) {
      if (sibling.tagName === current.tagName) index++
      sibling = sibling.previousElementSibling
    }
    path.unshift(`${current.tagName.toLowerCase()}[${index}]`)
    current = current.parentElement
  }

  return '/' + path.join('/')
}

// 获取元素文本（用于识别）
function getElementText(element: HTMLElement): string | undefined {
  // 优先用按钮/链接的文本内容
  if (element.tagName === 'BUTTON' || element.tagName === 'A') {
    const text = element.textContent?.trim()
    if (text && text.length > 0 && text.length < 50) return text
  }

  // 输入框用 placeholder
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const ph = element.placeholder?.trim()
    if (ph) return ph
  }

  // 其他元素如果文本很短也可以记录
  const text = element.textContent?.trim()
  if (text && text.length > 0 && text.length < 30) return text

  return undefined
}

/**
 * Lightweight EJS-like template engine for browser/Chrome extension environment.
 * Replaces the node.js `ejs` package which requires `fs`/`path` modules.
 */

export function renderTemplate(template: string, data: Record<string, any>): string {
  let code = 'let __output = [];\n'
  let cursor = 0
  let match: RegExpExecArray | null

  const regex = /<%([=-]?)([\s\S]*?)%>/g

  while ((match = regex.exec(template)) !== null) {
    const [fullMatch, mode, expr] = match
    const before = template.slice(cursor, match.index)

    // Add literal text before the tag
    if (before) {
      code += `__output.push(${JSON.stringify(before)});\n`
    }

    if (mode === '=') {
      // <%= expr %> — HTML-escaped output
      code += `__output.push(String(${expr.trim()}).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));\n`
    } else if (mode === '-') {
      // <%- expr %> — raw output (no escaping)
      code += `__output.push(String(${expr.trim()}));\n`
    } else {
      // <% code %> — execute JavaScript
      code += `${expr.trim()}\n`
    }

    cursor = match.index + fullMatch.length
  }

  // Add remaining literal text
  if (cursor < template.length) {
    code += `__output.push(${JSON.stringify(template.slice(cursor))});\n`
  }

  code += 'return __output.join("");\n'

  const keys = Object.keys(data)
  const values = Object.values(data)
  const fn = new Function(...keys, code)
  return fn(...values)
}

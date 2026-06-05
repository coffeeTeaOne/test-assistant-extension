/**
 * 生成唯一 ID
 * @returns 格式为 "timestamp-randomString" 的唯一标识符
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 格式化时间戳为时间字符串
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 格式化的时间字符串，如 "14:30:25"
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * 格式化时间戳为日期字符串
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 格式化的日期字符串，如 "2026/05/28"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}



/**
 * Chrome API Promise utilities
 * Provides Promise-based wrappers for Chrome extension APIs
 */

/**
 * Send message to a tab with Promise support
 */
export async function sendMessageToTab(
  tabId: number,
  message: any
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message)
  } catch (error) {
    // Tab may not be ready or content script not loaded
    console.warn(`Failed to send message to tab ${tabId}:`, error)
    throw error
  }
}

/**
 * Get active tab with Promise support
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab || null
  } catch (error) {
    console.warn('Failed to get active tab:', error)
    return null
  }
}

/**
 * Send runtime message with Promise support
 */
export async function sendRuntimeMessage(message: any): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message)
  } catch (error) {
    console.warn('Failed to send runtime message:', error)
    throw error
  }
}

/**
 * Open side panel with Promise support
 */
export async function openSidePanel(): Promise<void> {
  try {
    // @ts-ignore - chrome.sidePanel.open() is available in Chrome 114+ but types may lag
    await chrome.sidePanel.open()
  } catch (error) {
    console.warn('Failed to open side panel:', error)
    throw error
  }
}

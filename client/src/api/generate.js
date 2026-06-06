import { API_BASE } from './index'

/**
 * Generate script with SSE streaming
 * @param {string} inputData - The input script data
 * @param {function} onChunk - Callback for each chunk of output
 * @param {function} onComplete - Callback when generation completes, receives taskId
 */
export async function generateScript(inputData, onChunk, onComplete) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input_data: inputData })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Generation failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          continue
        }
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'chunk' && parsed.content) {
            onChunk(parsed.content)
          }
          if (parsed.type === 'done' && parsed.taskId) {
            onComplete(parsed.taskId)
          }
          if (parsed.error) {
            throw new Error(parsed.error)
          }
        } catch (e) {
          // If it's not JSON, it might be raw content
          if (data && data !== '[DONE]') {
            onChunk(data)
          }
        }
      }
    }
  }
}
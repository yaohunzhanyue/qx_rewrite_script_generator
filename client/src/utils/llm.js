/**
 * LLM 服务 - 前端直接调用 API
 */

/**
 * 流式调用 LLM API
 * @param {Object} config - API 配置 { base_url, api_key, model }
 * @param {Object} template - 提示词模板 { system_prompt, user_prompt }
 * @param {Object} userInput - 用户输入 { rawScript, originalResponse, vipResponse }
 * @param {function} onChunk - 流式输出回调
 */
export async function callLLMStream(config, template, userInput, onChunk) {
  const { base_url, api_key, model } = config
  
  // 清理 base_url
  let cleanBaseUrl = base_url.replace(/\/$/, '')
  cleanBaseUrl = cleanBaseUrl.replace(/\/v1\/?$/, '')
  
  // 构建消息
  const systemPrompt = template.system_prompt
  const userPrompt = template.user_prompt
    .replace(/\{\{rawScript\}\}/g, userInput.rawScript || '无')
    .replace(/\{\{originalResponse\}\}/g, userInput.originalResponse || '无')
    .replace(/\{\{vipResponse\}\}/g, userInput.vipResponse || '无')

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await fetch(`${cleanBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error ${response.status}: ${errorText}`)
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
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        return
      }

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          onChunk(content)
        }
      } catch (e) {
        // 跳过无效 JSON
      }
    }
  }
}

/**
 * 非流式调用 LLM API
 */
export async function callLLM(config, template, userInput) {
  const { base_url, api_key, model } = config
  
  let cleanBaseUrl = base_url.replace(/\/$/, '')
  cleanBaseUrl = cleanBaseUrl.replace(/\/v1\/?$/, '')
  
  const systemPrompt = template.system_prompt
  const userPrompt = template.user_prompt
    .replace(/\{\{rawScript\}\}/g, userInput.rawScript || '无')
    .replace(/\{\{originalResponse\}\}/g, userInput.originalResponse || '无')
    .replace(/\{\{vipResponse\}\}/g, userInput.vipResponse || '无')

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await fetch(`${cleanBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages,
      stream: false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * 测试 API 连接
 */
export async function testApiConnection(config) {
  const { base_url, api_key } = config
  
  let cleanBaseUrl = base_url.replace(/\/$/, '')
  cleanBaseUrl = cleanBaseUrl.replace(/\/v1\/?$/, '')

  try {
    const response = await fetch(`${cleanBaseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: '连接成功' }
    } else {
      const errorText = await response.text()
      return { success: false, message: `API 错误: ${response.status}`, detail: errorText }
    }
  } catch (err) {
    return { success: false, message: `连接失败: ${err.message}` }
  }
}
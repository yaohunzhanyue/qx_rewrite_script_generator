/**
 * LLM Service - OpenAI Compatible API Call
 */

export async function callLLMStream(config, template, userInput, onChunk) {
  const { base_url, api_key, model } = config;
  
  // Clean base_url: remove trailing slash and /v1 if present
  let cleanBaseUrl = base_url.replace(/\/$/, '');
  cleanBaseUrl = cleanBaseUrl.replace(/\/v1\/?$/, '');
  
  // Build messages
  const systemPrompt = template.system_prompt;
  const userPrompt = template.user_prompt
    .replace('{{rawScript}}', userInput.rawScript || '无')
    .replace('{{originalResponse}}', userInput.originalResponse || '无')
    .replace('{{vipResponse}}', userInput.vipResponse || '无');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') {
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

export async function callLLM(config, template, userInput) {
  const { base_url, api_key, model } = config;
  
  // Clean base_url: remove trailing slash and /v1 if present
  let cleanBaseUrl = base_url.replace(/\/$/, '');
  cleanBaseUrl = cleanBaseUrl.replace(/\/v1\/?$/, '');
  
  const systemPrompt = template.system_prompt;
  const userPrompt = template.user_prompt
    .replace('{{rawScript}}', userInput.rawScript || '无')
    .replace('{{originalResponse}}', userInput.originalResponse || '无')
    .replace('{{vipResponse}}', userInput.vipResponse || '无');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
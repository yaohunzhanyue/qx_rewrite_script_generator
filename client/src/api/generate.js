/**
 * 生成脚本相关函数 - 前端直接调用 LLM
 */
import * as storage from '../utils/storage'
import * as llm from '../utils/llm'

/**
 * 生成脚本（流式输出）
 * @param {string} inputData - JSON 字符串 { rawScript, originalResponse, vipResponse }
 * @param {function} onChunk - 每个块的回调
 * @param {function} onComplete - 完成时的回调，接收 taskId
 */
export async function generateScript(inputData, onChunk, onComplete) {
  // 解析输入数据
  let userInput
  try {
    userInput = JSON.parse(inputData)
  } catch (e) {
    // 如果不是 JSON，当作 rawScript
    userInput = { rawScript: inputData, originalResponse: '', vipResponse: '' }
  }

  // 获取配置和模板
  const config = storage.getActiveConfig()
  const template = storage.getActiveTemplate()

  if (!config) {
    throw new Error('请先在设置中配置 API')
  }

  if (!template) {
    throw new Error('未找到提示词模板')
  }

  // 创建任务记录
  const task = storage.saveTask({
    name: `任务 ${new Date().toLocaleString()}`,
    input_data: inputData,
    api_config_id: config.id,
    prompt_template_id: template.id,
    status: 'streaming',
    output_script: ''
  })

  let fullOutput = ''

  try {
    // 流式调用 LLM
    await llm.callLLMStream(config, template, userInput, (chunk) => {
      fullOutput += chunk
      onChunk(chunk)
    })

    // 更新任务为完成
    storage.saveTask({
      ...task,
      output_script: fullOutput,
      status: 'completed'
    })

    onComplete(task.id)
  } catch (err) {
    // 更新任务为失败
    storage.saveTask({
      ...task,
      status: 'failed',
      error_message: err.message
    })
    throw err
  }
}
/**
 * 本地存储服务 - 使用 localStorage 模拟数据库
 */

const STORAGE_KEYS = {
  API_CONFIGS: 'qx_api_configs',
  ACTIVE_CONFIG: 'qx_active_config',
  PROMPT_TEMPLATES: 'qx_prompt_templates',
  ACTIVE_TEMPLATE: 'qx_active_template',
  TASKS: 'qx_tasks'
}

// 默认提示词模板
const DEFAULT_TEMPLATE = {
  id: 1,
  name: '默认模板',
  system_prompt: `# 角色
你是一位精通 iOS 逆向分析和 Quantumult X 脚本开发的高级工程师。

# 任务
请将我提供的"抓包生成的原始请求脚本"转化为"Quantumult X Rewrite 响应修改脚本"，用于实现 App 的 VIP/会员功能解锁。

# 处理要求
1. 脚本转换：移除原有的 $task.fetch 主动请求逻辑，改为使用 QX 内置的 $response 对象进行拦截修改，并通过 $done({body: JSON.stringify(obj)}) 返回。
2. 字段修改逻辑：
   - 如果我提供了【真实会员响应体】，请精准对比两个 JSON 的差异，将非 VIP 响应��中的差异字段全部修改为 VIP 的值。
   - 如果我提供的是"无"，请根据常见 App 的鉴权逻辑和原始响应体中的字段语义（如 vip, isPro, subscriptionStatus, expireTime, level 等）���行合理推断和修改，并加上清晰的注释说明。
3. 容错处理：必须包含 try...catch，解析失败时打印错误日志并执行 $done({}) 放行，防止 App 白屏或功能异常。
4. 日志输出：修改成功后，使用 console.log 打印核心修改的字段，方便我在 QX 日志中确认脚本是否生效。
5. 配置输出：在脚本顶部以注释的形式，输出对应的 QX [rewrite_local] 正则匹配规则和 [mitm] hostname 配置。`,
  user_prompt: `1. 原始抓包脚本：
{{rawScript}}

2. 当前账号（非VIP）的原始响应体：
{{originalResponse}}

3. 真实会员账号的响应体（如果有，这是关键！如果没有请填"无"）：
{{vipResponse}}`,
  is_active: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// 初始化默认数据
function initDefaultData() {
  // 初始化提示词模板
  const templates = getPromptTemplates()
  if (templates.length === 0) {
    savePromptTemplate(DEFAULT_TEMPLATE)
  }
}

// ========== API 配置 ==========

export function getApiConfigs() {
  const data = localStorage.getItem(STORAGE_KEYS.API_CONFIGS)
  return data ? JSON.parse(data) : []
}

export function getActiveConfig() {
  const configs = getApiConfigs()
  return configs.find(c => c.is_active) || configs[0] || null
}

export function saveApiConfig(config) {
  const configs = getApiConfigs()
  if (config.id) {
    // 更新
    const index = configs.findIndex(c => c.id === config.id)
    if (index !== -1) {
      config.updated_at = new Date().toISOString()
      configs[index] = { ...configs[index], ...config }
    }
  } else {
    // 新增
    config.id = Date.now()
    config.created_at = new Date().toISOString()
    config.updated_at = new Date().toISOString()
    config.is_active = configs.length === 0 ? 1 : 0
    configs.push(config)
  }
  localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
  return config
}

export function deleteApiConfig(id) {
  const configs = getApiConfigs().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
}

export function activateApiConfig(id) {
  const configs = getApiConfigs().map(c => ({
    ...c,
    is_active: c.id === id ? 1 : 0
  }))
  localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
  return configs.find(c => c.id === id)
}

// ========== 提示词模板 ==========

export function getPromptTemplates() {
  const data = localStorage.getItem(STORAGE_KEYS.PROMPT_TEMPLATES)
  return data ? JSON.parse(data) : []
}

export function getActiveTemplate() {
  const templates = getPromptTemplates()
  return templates.find(t => t.is_active) || templates[0] || null
}

export function savePromptTemplate(template) {
  const templates = getPromptTemplates()
  if (template.id) {
    // 更新
    const index = templates.findIndex(t => t.id === template.id)
    if (index !== -1) {
      template.updated_at = new Date().toISOString()
      templates[index] = { ...templates[index], ...template }
    }
  } else {
    // 新增
    template.id = Date.now()
    template.created_at = new Date().toISOString()
    template.updated_at = new Date().toISOString()
    template.is_active = templates.length === 0 ? 1 : 0
    templates.push(template)
  }
  localStorage.setItem(STORAGE_KEYS.PROMPT_TEMPLATES, JSON.stringify(templates))
  return template
}

export function deletePromptTemplate(id) {
  const templates = getPromptTemplates().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.PROMPT_TEMPLATES, JSON.stringify(templates))
}

export function activatePromptTemplate(id) {
  const templates = getPromptTemplates().map(t => ({
    ...t,
    is_active: t.id === id ? 1 : 0
  }))
  localStorage.setItem(STORAGE_KEYS.PROMPT_TEMPLATES, JSON.stringify(templates))
  return templates.find(t => t.id === id)
}

// ========== 任务历史 ==========

export function getTasks() {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS)
  return data ? JSON.parse(data) : []
}

export function getTask(id) {
  const tasks = getTasks()
  return tasks.find(t => t.id === id) || null
}

export function saveTask(task) {
  const tasks = getTasks()
  if (task.id) {
    // 更新
    const index = tasks.findIndex(t => t.id === task.id)
    if (index !== -1) {
      task.updated_at = new Date().toISOString()
      tasks[index] = { ...tasks[index], ...task }
    }
  } else {
    // 新增
    task.id = Date.now()
    task.created_at = new Date().toISOString()
    task.updated_at = new Date().toISOString()
    tasks.unshift(task)
    // 只保留最近 50 条
    if (tasks.length > 50) {
      tasks.length = 50
    }
  }
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  return task
}

export function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
}

export function renameTask(id, name) {
  const tasks = getTasks()
  const task = tasks.find(t => t.id === id)
  if (task) {
    task.name = name
    task.updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }
  return task
}

export function archiveTask(id) {
  const tasks = getTasks()
  const task = tasks.find(t => t.id === id)
  if (task) {
    task.archived = task.archived ? 0 : 1
    task.updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }
  return task
}

// ========== 初始化 ==========

export function initStorage() {
  initDefaultData()
}

// 导出存储键名，方便调试
export { STORAGE_KEYS }
<template>
  <div class="work-area">
    <div class="work-container">
      <!-- Input Section -->
      <div class="input-section">
        <h3 class="section-title">输入信息</h3>
        
        <el-form label-position="top" class="input-form">
          <el-form-item label="原始抓包脚本" required>
            <el-input
              v-model="inputForm.rawScript"
              type="textarea"
              :rows="8"
              placeholder="粘贴抓包获取的原始请求脚本（$task.fetch 或 $httpClient）..."
            />
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="当前账号响应体（非VIP）">
                <el-input
                  v-model="inputForm.originalResponse"
                  type="textarea"
                  :rows="4"
                  placeholder="可选：当前非VIP账号的 API 响应 JSON..."
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="VIP 会员响应体">
                <el-input
                  v-model="inputForm.vipResponse"
                  type="textarea"
                  :rows="4"
                  placeholder="可选：VIP会员账号的 API 响应 JSON（如果有）..."
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <div class="input-actions">
          <el-button @click="clearInput">清空</el-button>
          <el-button type="primary" :loading="isGenerating" @click="handleGenerate">
            <el-icon v-if="!isGenerating"><MagicStick /></el-icon>
            {{ isGenerating ? '生成中...' : '生成脚本' }}
          </el-button>
        </div>
      </div>

      <!-- Output Section -->
      <div class="output-section">
        <div class="output-header">
          <h3 class="section-title">输出结果</h3>
          <div class="output-actions">
            <el-button size="small" @click="copyCode" :disabled="!scriptCode">
              <el-icon><CopyDocument /></el-icon>
              复制代码
            </el-button>
            <el-button size="small" @click="downloadCode" :disabled="!scriptCode">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
        
        <el-tabs v-model="outputTab" class="output-tabs">
          <el-tab-pane label="脚本代码" name="code">
            <div class="output-content code-area">
              <pre v-if="scriptCode"><code>{{ scriptCode }}</code></pre>
              <el-empty v-else description="生成的脚本代码将显示在这里" :image-size="80" />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="使用说明" name="guide">
            <div class="output-content guide-area">
              <div v-if="guideText" class="guide-content" v-html="guideText"></div>
              <el-empty v-else description="使用说明将显示在这里" :image-size="80" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { MagicStick, CopyDocument, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  output: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['generate', 'update-input'])

// 输入表单
const inputForm = ref({
  rawScript: '',
  originalResponse: '',
  vipResponse: ''
})

// 输出标签页
const outputTab = ref('code')

// 从输出中分离代码和使用说明
const scriptCode = computed(() => {
  if (!props.output) return ''
  // 尝试提取 ```javascript ... ``` 块
  const codeMatch = props.output.match(/```javascript\n([\s\S]*?)```/)
  if (codeMatch) return codeMatch[1]
  // 如果没有代码块标记，返回整个输出
  return props.output
})

const guideText = computed(() => {
  if (!props.output) return ''
  // 移除代码块后的内容作为使用说明
  let text = props.output
  // 移除 ```javascript ... ``` ��
  text = text.replace(/```javascript\n[\s\S]*?```/g, '')
  // 移除 ``` 块
  text = text.replace(/```[\s\S]*?```/g, '')
  // 清理多余的空行
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text || ''
})

// Watch for task changes
watch(() => props.task, (newTask) => {
  if (newTask && newTask.input_data) {
    try {
      const data = JSON.parse(newTask.input_data)
      inputForm.value = {
        rawScript: data.rawScript || '',
        originalResponse: data.originalResponse || '',
        vipResponse: data.vipResponse || ''
      }
    } catch (e) {
      inputForm.value.rawScript = newTask.input_data || ''
    }
  }
}, { immediate: true })

function clearInput() {
  inputForm.value = {
    rawScript: '',
    originalResponse: '',
    vipResponse: ''
  }
  emit('update-input', '')
}

function handleGenerate() {
  if (!inputForm.value.rawScript.trim()) {
    ElMessage.warning('请输入原始抓包脚本')
    return
  }
  // 传递 JSON 格式的数据
  emit('generate', JSON.stringify(inputForm.value))
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(scriptCode.value)
    ElMessage.success('代码已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

function downloadCode() {
  const blob = new Blob([scriptCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qx-vip-unlock-${Date.now()}.js`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}
</script>

<style scoped>
.work-area {
  height: 100%;
}

.work-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.input-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.input-form {
  margin-top: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.output-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.output-actions {
  display: flex;
  gap: 8px;
}

.output-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.output-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.output-content {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  min-height: 250px;
  max-height: 500px;
}

.code-area {
  background: #1e1e1e;
  padding: 0;
}

.code-area pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

.code-area code {
  color: #d4d4d4;
}

.guide-area {
  background: #fff;
}

.guide-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

.guide-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #303133;
}

.guide-content :deep(h4) {
  font-size: 14px;
  font-weight: 600;
  margin: 12px 0 6px;
  color: #606266;
}

.guide-content :deep(ul),
.guide-content :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.guide-content :deep(li) {
  margin: 4px 0;
}

.guide-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.guide-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
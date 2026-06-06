<template>
  <div class="work-area">
    <div class="work-container">
      <!-- Input Section -->
      <div class="input-section">
        <h3 class="section-title">输入脚本</h3>
        <el-input
          v-model="inputData"
          type="textarea"
          :rows="12"
          placeholder="粘贴原始抓包脚本内容..."
          @input="handleInput"
        />
        
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
            <el-button size="small" @click="copyOutput" :disabled="!output">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button size="small" @click="downloadOutput" :disabled="!output">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
        <div class="output-content">
          <pre v-if="output">{{ output }}</pre>
          <el-empty v-else description="生成的脚本将显示在这里" :image-size="100" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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

const inputData = ref('')

// Watch for task changes
watch(() => props.task, (newTask) => {
  if (newTask) {
    inputData.value = newTask.input_data || ''
  }
}, { immediate: true })

function handleInput() {
  emit('update-input', inputData.value)
}

function clearInput() {
  inputData.value = ''
  emit('update-input', '')
}

function handleGenerate() {
  if (!inputData.value.trim()) {
    ElMessage.warning('请先输入脚本内容')
    return
  }
  emit('generate', inputData.value)
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(props.output)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

function downloadOutput() {
  const blob = new Blob([props.output], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qx-script-${Date.now()}.js`
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
  max-width: 1200px;
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
  min-height: 300px;
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

.output-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  min-height: 200px;
}

.output-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">QX Script Generator</h1>
        <span class="subtitle">Quantumult X Rewrite 脚本生成器</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <!-- Left Panel - Task List -->
      <aside class="task-panel">
        <TaskList
          :tasks="tasks"
          :active-task-id="activeTaskId"
          @select="selectTask"
          @rename="renameTask"
          @archive="archiveTask"
          @delete="deleteTask"
          @new="createNewTask"
        />
      </aside>

      <!-- Right Panel - Work Area -->
      <section class="work-area">
        <WorkArea
          :task="activeTask"
          :is-generating="isGenerating"
          :output="output"
          @generate="handleGenerate"
          @update-input="updateInput"
        />
      </section>
    </main>

    <!-- Footer Status Bar -->
    <footer class="app-footer">
      <span v-if="activeConfig">API: {{ activeConfig.name }} | Model: {{ activeConfig.model }}</span>
      <span v-else class="warning">⚠️ 未配置 API，请先在设置中添加</span>
      <span v-if="activeTemplate"> | Template: {{ activeTemplate.name }}</span>
    </footer>

    <!-- Settings Dialog -->
    <SettingsDialog
      v-model:visible="showSettings"
      :configs="apiConfigs"
      :templates="promptTemplates"
      :active-config="activeConfig"
      :active-template="activeTemplate"
      @config-change="loadConfigs"
      @template-change="loadTemplates"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import TaskList from './components/TaskList.vue'
import WorkArea from './components/WorkArea.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { getApiConfigs, getActiveConfig } from './api/api-config'
import { getPromptTemplates, getActiveTemplate } from './api/prompt-template'
import { getTasks, createTask, updateTask, deleteTask as deleteTaskApi, renameTask as renameTaskApi, archiveTask as archiveTaskApi } from './api/tasks'
import { generateScript } from './api/generate'

// State
const tasks = ref([])
const activeTaskId = ref(null)
const apiConfigs = ref([])
const promptTemplates = ref([])
const activeConfig = ref(null)
const activeTemplate = ref(null)
const showSettings = ref(false)
const isGenerating = ref(false)
const output = ref('')

// Computed
const activeTask = computed(() => {
  if (!activeTaskId.value) return null
  return tasks.value.find(t => t.id === activeTaskId.value) || null
})

// Methods
async function loadTasks() {
  try {
    const data = await getTasks()
    tasks.value = data
    if (!activeTaskId.value && data.length > 0) {
      activeTaskId.value = data[0].id
    }
  } catch (err) {
    console.error('Failed to load tasks:', err)
  }
}

async function loadConfigs() {
  try {
    apiConfigs.value = await getApiConfigs()
    activeConfig.value = await getActiveConfig()
  } catch (err) {
    console.error('Failed to load configs:', err)
  }
}

async function loadTemplates() {
  try {
    promptTemplates.value = await getPromptTemplates()
    activeTemplate.value = await getActiveTemplate()
  } catch (err) {
    console.error('Failed to load templates:', err)
  }
}

function selectTask(id) {
  activeTaskId.value = id
  output.value = activeTask.value?.output_script || ''
}

async function createNewTask() {
  try {
    const task = await createTask({ name: `新任务 ${new Date().toLocaleString()}` })
    tasks.value.unshift(task)
    activeTaskId.value = task.id
    output.value = ''
  } catch (err) {
    console.error('Failed to create task:', err)
  }
}

async function renameTask(id, name) {
  try {
    const updated = await renameTaskApi(id, name)
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = updated
    }
  } catch (err) {
    console.error('Failed to rename task:', err)
  }
}

async function archiveTask(id, archived) {
  try {
    const updated = await archiveTaskApi(id, archived)
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = updated
    }
  } catch (err) {
    console.error('Failed to archive task:', err)
  }
}

async function deleteTask(id) {
  try {
    await deleteTaskApi(id)
    tasks.value = tasks.value.filter(t => t.id !== id)
    if (activeTaskId.value === id) {
      activeTaskId.value = tasks.value[0]?.id || null
    }
  } catch (err) {
    console.error('Failed to delete task:', err)
  }
}

function updateInput(inputData) {
  if (activeTask.value) {
    const index = tasks.value.findIndex(t => t.id === activeTaskId.value)
    if (index !== -1) {
      tasks.value[index].input_data = inputData
    }
  }
}

async function handleGenerate(inputData) {
  if (!activeConfig.value) {
    alert('请先在设置中配置 API')
    return
  }

  isGenerating.value = true
  output.value = ''

  try {
    await generateScript(inputData, (chunk) => {
      output.value += chunk
    }, (taskId) => {
      // Update task with new output
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index].output_script = output.value
        tasks.value[index].status = 'completed'
      }
      isGenerating.value = false
    })
  } catch (err) {
    output.value = `错误: ${err.message}`
    isGenerating.value = false
  }
}

// Initialize
onMounted(async () => {
  await loadConfigs()
  await loadTemplates()
  await loadTasks()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  font-size: 13px;
  color: #909399;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.task-panel {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.work-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.app-footer {
  padding: 8px 20px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #606266;
}

.warning {
  color: #e6a23c;
}
</style>
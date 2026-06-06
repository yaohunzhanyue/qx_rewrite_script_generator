<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="设置"
    width="700px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab">
      <!-- API Configuration Tab -->
      <el-tab-pane label="API 配置" name="api">
        <div class="config-section">
          <div class="config-header">
            <h4>API 配置列表</h4>
            <el-button type="primary" size="small" @click="showConfigDialog()">
              <el-icon><Plus /></el-icon>
              添加配置
            </el-button>
          </div>

          <div class="config-list">
            <div
              v-for="config in configs"
              :key="config.id"
              :class="['config-item', { active: config.id === activeConfig?.id }]"
            >
              <div class="config-info">
                <div class="config-name">
                  {{ config.name }}
                  <el-tag v-if="config.id === activeConfig?.id" type="success" size="small">当前使用</el-tag>
                </div>
                <div class="config-details">
                  <span>{{ config.base_url }}</span>
                  <span class="separator">|</span>
                  <span>{{ config.model }}</span>
                </div>
              </div>
              <div class="config-actions">
                <el-button size="small" text @click="testConfig(config)">
                  测试
                </el-button>
                <el-button size="small" text @click="showConfigDialog(config)">
                  编辑
                </el-button>
                <el-button
                  v-if="config.id !== activeConfig?.id"
                  size="small"
                  text
                  type="primary"
                  @click="activateConfig(config.id)"
                >
                  激活
                </el-button>
                <el-button size="small" text type="danger" @click="deleteConfig(config.id)">
                  删除
                </el-button>
              </div>
            </div>

            <el-empty v-if="configs.length === 0" description="暂无 API 配置" :image-size="80" />
          </div>
        </div>
      </el-tab-pane>

      <!-- Prompt Template Tab -->
      <el-tab-pane label="提示词模板" name="template">
        <div class="config-section">
          <div class="config-header">
            <h4>提示词模板列表</h4>
            <el-button type="primary" size="small" @click="showTemplateDialog()">
              <el-icon><Plus /></el-icon>
              添加模板
            </el-button>
          </div>

          <div class="template-list">
            <div
              v-for="template in templates"
              :key="template.id"
              :class="['template-item', { active: template.id === activeTemplate?.id }]"
            >
              <div class="template-info">
                <div class="template-name">
                  {{ template.name }}
                  <el-tag v-if="template.id === activeTemplate?.id" type="success" size="small">当前使用</el-tag>
                </div>
                <div class="template-preview">
                  {{ (template.system_prompt || '').substring(0, 100) }}...
                </div>
              </div>
              <div class="template-actions">
                <el-button size="small" text @click="showTemplateDialog(template)">
                  编辑
                </el-button>
                <el-button
                  v-if="template.id !== activeTemplate?.id"
                  size="small"
                  text
                  type="primary"
                  @click="activateTemplate(template.id)"
                >
                  激活
                </el-button>
                <el-button size="small" text type="danger" @click="deleteTemplate(template.id)">
                  删除
                </el-button>
              </div>
            </div>

            <el-empty v-if="templates.length === 0" description="暂无提示词模板" :image-size="80" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- API Config Dialog -->
    <el-dialog
      v-model="configDialogVisible"
      :title="editingConfig ? '编辑 API 配置' : '添加 API 配置'"
      width="500px"
      append-to-body
    >
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="配置名称" required>
          <el-input v-model="configForm.name" placeholder="例如: OpenAI" />
        </el-form-item>
        <el-form-item label="API 地址" required>
          <el-input v-model="configForm.base_url" placeholder="例如: https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input v-model="configForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="模型名称" required>
          <el-input v-model="configForm.model" placeholder="例如: gpt-4o-mini" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>

    <!-- Template Dialog -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="editingTemplate ? '编辑提示词模板' : '添加提示词模板'"
      width="700px"
      append-to-body
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="例如: 默认模板" />
        </el-form-item>
        <el-form-item label="模板内容" required>
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="15"
            placeholder="输入提示词模板内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createApiConfig,
  updateApiConfig,
  deleteApiConfig as deleteApiConfigApi,
  activateApiConfig,
  testApiConfig
} from '../api/api-config'
import {
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate as deletePromptTemplateApi,
  activatePromptTemplate
} from '../api/prompt-template'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  configs: {
    type: Array,
    default: () => []
  },
  templates: {
    type: Array,
    default: () => []
  },
  activeConfig: {
    type: Object,
    default: null
  },
  activeTemplate: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'config-change', 'template-change'])

const activeTab = ref('api')
const configDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const editingConfig = ref(null)
const editingTemplate = ref(null)

const configForm = ref({
  name: '',
  base_url: '',
  api_key: '',
  model: ''
})

const templateForm = ref({
  name: '',
  content: ''
})

function showConfigDialog(config = null) {
  editingConfig.value = config
  if (config) {
    configForm.value = { ...config }
  } else {
    configForm.value = { name: '', base_url: '', api_key: '', model: '' }
  }
  configDialogVisible.value = true
}

async function saveConfig() {
  if (!configForm.value.name || !configForm.value.base_url || !configForm.value.api_key || !configForm.value.model) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  try {
    if (editingConfig.value) {
      await updateApiConfig(editingConfig.value.id, configForm.value)
      ElMessage.success('更新成功')
    } else {
      await createApiConfig(configForm.value)
      ElMessage.success('添加成功')
    }
    configDialogVisible.value = false
    emit('config-change')
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function testConfig(config) {
  try {
    const result = await testApiConfig(config.id)
    if (result.success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(result.message || '连接测试失败')
    }
  } catch (err) {
    ElMessage.error(err.message || '连接测试失败')
  }
}

async function activateConfig(id) {
  try {
    await activateApiConfig(id)
    ElMessage.success('已激活')
    emit('config-change')
  } catch (err) {
    ElMessage.error(err.message || '激活失败')
  }
}

async function deleteConfig(id) {
  try {
    await ElMessageBox.confirm('确定要删除此配置吗？', '删除确认', {
      type: 'warning'
    })
    await deleteApiConfigApi(id)
    ElMessage.success('删除成功')
    emit('config-change')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败')
    }
  }
}

function showTemplateDialog(template = null) {
  editingTemplate.value = template
  if (template) {
    templateForm.value = { ...template }
  } else {
    templateForm.value = { name: '', content: '' }
  }
  templateDialogVisible.value = true
}

async function saveTemplate() {
  if (!templateForm.value.name || !templateForm.value.content) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  try {
    if (editingTemplate.value) {
      await updatePromptTemplate(editingTemplate.value.id, templateForm.value)
      ElMessage.success('更新成功')
    } else {
      await createPromptTemplate(templateForm.value)
      ElMessage.success('添加成功')
    }
    templateDialogVisible.value = false
    emit('template-change')
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function activateTemplate(id) {
  try {
    await activatePromptTemplate(id)
    ElMessage.success('已激活')
    emit('template-change')
  } catch (err) {
    ElMessage.error(err.message || '激活失败')
  }
}

async function deleteTemplate(id) {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '删除确认', {
      type: 'warning'
    })
    await deletePromptTemplateApi(id)
    ElMessage.success('删除成功')
    emit('template-change')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.config-section {
  min-height: 300px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.config-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.config-list, .template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item, .template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid transparent;
}

.config-item.active, .template-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.config-info, .template-info {
  flex: 1;
  min-width: 0;
}

.config-name, .template-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-details {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.separator {
  margin: 0 8px;
}

.template-preview {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.config-actions, .template-actions {
  display: flex;
  gap: 4px;
}
</style>
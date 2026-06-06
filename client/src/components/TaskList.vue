<template>
  <div class="task-list">
    <!-- Header -->
    <div class="task-list-header">
      <h3>任务列表</h3>
      <el-button type="primary" size="small" @click="$emit('new')">
        <el-icon><Plus /></el-icon>
        新建
      </el-button>
    </div>

    <!-- Task Items -->
    <div class="task-items">
      <div
        v-for="task in visibleTasks"
        :key="task.id"
        :class="['task-item', { active: task.id === activeTaskId, archived: task.archived }]"
        @click="$emit('select', task.id)"
      >
        <div class="task-info">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-time">{{ formatTime(task.updated_at) }}</span>
        </div>
        <div class="task-actions" @click.stop>
          <el-dropdown trigger="click" @command="handleCommand($event, task)">
            <el-button type="info" size="small" text>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon><Edit /></el-icon>
                  重命名
                </el-dropdown-item>
                <el-dropdown-item :command="task.archived ? 'unarchive' : 'archive'">
                  <el-icon><FolderOpened v-if="task.archived" /><Folder v-else /></el-icon>
                  {{ task.archived ? '取消归档' : '归档' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div v-if="visibleTasks.length === 0" class="empty-state">
        <el-empty description="暂无任务" :image-size="80" />
      </div>
    </div>

    <!-- Archive Toggle -->
    <div v-if="archivedTasks.length > 0" class="archive-toggle">
      <el-button text @click="showArchived = !showArchived">
        <el-icon><FolderOpened v-if="showArchived" /><Folder v-else /></el-icon>
        {{ showArchived ? '隐藏归档' : `显示归档 (${archivedTasks.length})` }}
      </el-button>
    </div>

    <!-- Rename Dialog -->
    <el-dialog v-model="renameDialogVisible" title="重命名任务" width="400px">
      <el-input v-model="newName" placeholder="请输入新名称" @keyup.enter="confirmRename" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, MoreFilled, Edit, Delete, Folder, FolderOpened } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  activeTaskId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['select', 'rename', 'archive', 'delete', 'new'])

const showArchived = ref(false)
const renameDialogVisible = ref(false)
const newName = ref('')
const renamingTask = ref(null)

const visibleTasks = computed(() => {
  return props.tasks.filter(t => !t.archived)
})

const archivedTasks = computed(() => {
  return props.tasks.filter(t => t.archived)
})

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString()
}

function handleCommand(command, task) {
  switch (command) {
    case 'rename':
      renamingTask.value = task
      newName.value = task.name
      renameDialogVisible.value = true
      break
    case 'archive':
      emit('archive', task.id, true)
      break
    case 'unarchive':
      emit('archive', task.id, false)
      break
    case 'delete':
      ElMessageBox.confirm('确定要删除此任务吗？此操作不可撤销。', '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        emit('delete', task.id)
      }).catch(() => {})
      break
  }
}

function confirmRename() {
  if (newName.value.trim() && renamingTask.value) {
    emit('rename', renamingTask.value.id, newName.value.trim())
    renameDialogVisible.value = false
  }
}
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.task-list-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.task-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f5f7fa;
}

.task-item.active {
  background: #ecf5ff;
  border: 1px solid #409eff;
}

.task-item.archived {
  opacity: 0.6;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  font-size: 12px;
  color: #909399;
}

.task-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.empty-state {
  padding: 40px 20px;
}

.archive-toggle {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
}
</style>
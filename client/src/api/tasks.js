/**
 * 任务历史相关函数 - 使用本地存储
 */
import * as storage from '../utils/storage'

export function getTasks() {
  return storage.getTasks()
}

export function getTask(id) {
  return storage.getTask(id)
}

export function createTask(data) {
  return storage.saveTask(data)
}

export function updateTask(id, data) {
  return storage.saveTask({ ...data, id })
}

export function renameTask(id, name) {
  return storage.renameTask(id, name)
}

export function archiveTask(id) {
  return storage.archiveTask(id)
}

export function deleteTask(id) {
  return storage.deleteTask(id)
}
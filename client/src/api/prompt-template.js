/**
 * 提示词模板相关函数 - 使用本地存储
 */
import * as storage from '../utils/storage'

export function getPromptTemplates() {
  return storage.getPromptTemplates()
}

export function getActiveTemplate() {
  return storage.getActiveTemplate()
}

export function createPromptTemplate(data) {
  return storage.savePromptTemplate(data)
}

export function updatePromptTemplate(id, data) {
  return storage.savePromptTemplate({ ...data, id })
}

export function deletePromptTemplate(id) {
  return storage.deletePromptTemplate(id)
}

export function activatePromptTemplate(id) {
  return storage.activatePromptTemplate(id)
}

export async function activatePromptTemplate(id) {
  return request(`/prompt-template/${id}/activate`, {
    method: 'POST'
  })
}
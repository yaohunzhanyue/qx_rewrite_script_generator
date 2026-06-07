/**
 * API 配置相关函数 - 使用本地存储
 */
import * as storage from '../utils/storage'
import * as llm from '../utils/llm'

export function getApiConfigs() {
  return storage.getApiConfigs()
}

export function getActiveConfig() {
  return storage.getActiveConfig()
}

export function createApiConfig(data) {
  return storage.saveApiConfig(data)
}

export function updateApiConfig(id, data) {
  return storage.saveApiConfig({ ...data, id })
}

export function deleteApiConfig(id) {
  return storage.deleteApiConfig(id)
}

export function activateApiConfig(id) {
  return storage.activateApiConfig(id)
}

export async function testApiConfig(id) {
  const config = storage.getApiConfigs().find(c => c.id === id)
  if (!config) {
    return { success: false, message: '配置不存在' }
  }
  return llm.testApiConnection(config)
}

export async function activateApiConfig(id) {
  return request(`/api-config/${id}/activate`, {
    method: 'POST'
  })
}

export async function testApiConfig(id) {
  return request(`/api-config/${id}/test`, {
    method: 'POST'
  })
}
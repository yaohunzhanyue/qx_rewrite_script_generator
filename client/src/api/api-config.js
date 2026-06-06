import { request } from './index'

export async function getApiConfigs() {
  return request('/api-config')
}

export async function getActiveConfig() {
  return request('/api-config/active')
}

export async function createApiConfig(data) {
  return request('/api-config', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateApiConfig(id, data) {
  return request(`/api-config/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteApiConfig(id) {
  return request(`/api-config/${id}`, {
    method: 'DELETE'
  })
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
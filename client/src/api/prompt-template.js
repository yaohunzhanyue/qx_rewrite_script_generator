import { request } from './index'

export async function getPromptTemplates() {
  return request('/prompt-template')
}

export async function getActiveTemplate() {
  return request('/prompt-template/active')
}

export async function createPromptTemplate(data) {
  return request('/prompt-template', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePromptTemplate(id, data) {
  return request(`/prompt-template/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deletePromptTemplate(id) {
  return request(`/prompt-template/${id}`, {
    method: 'DELETE'
  })
}

export async function activatePromptTemplate(id) {
  return request(`/prompt-template/${id}/activate`, {
    method: 'POST'
  })
}
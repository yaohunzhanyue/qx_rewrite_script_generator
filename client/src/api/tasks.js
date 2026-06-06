import { request } from './index'

export async function getTasks() {
  return request('/tasks')
}

export async function getTask(id) {
  return request(`/tasks/${id}`)
}

export async function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTask(id, data) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function renameTask(id, name) {
  return request(`/tasks/${id}/rename`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  })
}

export async function archiveTask(id, archived) {
  return request(`/tasks/${id}/archive`, {
    method: 'PUT',
    body: JSON.stringify({ archived })
  })
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: 'DELETE'
  })
}
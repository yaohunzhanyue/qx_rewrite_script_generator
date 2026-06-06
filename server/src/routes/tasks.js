import Router from '@koa/router';
import { dbHelper } from '../db.js';

const router = new Router();

// GET all tasks (with optional archived filter)
router.get('/', (ctx) => {
  const { archived } = ctx.query;
  let tasks;
  
  if (archived !== undefined) {
    tasks = dbHelper.prepare(`
      SELECT t.*, c.name as config_name, c.model as config_model, p.name as template_name
      FROM generation_tasks t
      LEFT JOIN api_configs c ON t.api_config_id = c.id
      LEFT JOIN prompt_templates p ON t.prompt_template_id = p.id
      WHERE t.archived = ?
      ORDER BY t.created_at DESC
    `).all(archived === '1' ? 1 : 0);
  } else {
    tasks = dbHelper.prepare(`
      SELECT t.*, c.name as config_name, c.model as config_model, p.name as template_name
      FROM generation_tasks t
      LEFT JOIN api_configs c ON t.api_config_id = c.id
      LEFT JOIN prompt_templates p ON t.prompt_template_id = p.id
      ORDER BY t.archived ASC, t.created_at DESC
    `).all();
  }
  
  ctx.body = tasks;
});

// GET single task by id
router.get('/:id', (ctx) => {
  const { id } = ctx.params;
  const task = dbHelper.prepare(`
    SELECT t.*, c.name as config_name, c.model as config_model, p.name as template_name
    FROM generation_tasks t
    LEFT JOIN api_configs c ON t.api_config_id = c.id
    LEFT JOIN prompt_templates p ON t.prompt_template_id = p.id
    WHERE t.id = ?
  `).get(id);
  
  if (!task) {
    ctx.status = 404;
    ctx.body = { error: 'Task not found' };
    return;
  }
  
  // Parse input_data back to object
  try {
    task.input_data = JSON.parse(task.input_data);
  } catch (e) {
    // Keep as string if parse fails
  }
  
  ctx.body = task;
});

// POST create new empty task
router.post('/', (ctx) => {
  const { name, input_data } = ctx.request.body;
  
  const taskName = name || `任务 ${new Date().toLocaleString()}`;
  const inputData = input_data ? JSON.stringify(input_data) : JSON.stringify({});
  
  const result = dbHelper.prepare(`
    INSERT INTO generation_tasks (name, input_data, status)
    VALUES (?, ?, 'pending')
  `).run(taskName, inputData);
  
  const task = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(result.lastInsertRowid);
  ctx.body = task;
});

// PUT update task (rename, etc.)
router.put('/:id', (ctx) => {
  const { id } = ctx.params;
  const { name, input_data, output_script, status, archived } = ctx.request.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (input_data !== undefined) { 
    updates.push('input_data = ?'); 
    values.push(typeof input_data === 'string' ? input_data : JSON.stringify(input_data)); 
  }
  if (output_script !== undefined) { updates.push('output_script = ?'); values.push(output_script); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (archived !== undefined) { updates.push('archived = ?'); values.push(archived ? 1 : 0); }

  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { error: 'No fields to update' };
    return;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  dbHelper.prepare(`UPDATE generation_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(id);
  ctx.body = updated;
});

// PUT rename task
router.put('/:id/rename', (ctx) => {
  const { id } = ctx.params;
  const { name } = ctx.request.body;
  
  if (!name) {
    ctx.status = 400;
    ctx.body = { error: 'name is required' };
    return;
  }
  
  dbHelper.prepare(`
    UPDATE generation_tasks SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(name, id);
  
  const task = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(id);
  ctx.body = task;
});

// PUT archive/unarchive task
router.put('/:id/archive', (ctx) => {
  const { id } = ctx.params;
  const { archived } = ctx.request.body;
  
  const task = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(id);
  if (!task) {
    ctx.status = 404;
    ctx.body = { error: 'Task not found' };
    return;
  }
  
  const newArchived = archived !== undefined ? (archived ? 1 : 0) : (task.archived ? 0 : 1);
  
  dbHelper.prepare(`
    UPDATE generation_tasks SET archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newArchived, id);
  
  const updated = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(id);
  ctx.body = updated;
});

// DELETE task
router.delete('/:id', (ctx) => {
  const { id } = ctx.params;
  dbHelper.prepare('DELETE FROM generation_tasks WHERE id = ?').run(id);
  ctx.status = 204;
});

// DELETE all archived tasks
router.delete('/', (ctx) => {
  const { archived_only } = ctx.query;
  
  if (archived_only === 'true') {
    dbHelper.prepare('DELETE FROM generation_tasks WHERE archived = 1').run();
  } else {
    dbHelper.prepare('DELETE FROM generation_tasks').run();
  }
  
  ctx.status = 204;
});

export default router;
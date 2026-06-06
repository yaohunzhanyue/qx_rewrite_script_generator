import Router from '@koa/router';
import { dbHelper } from '../db.js';

const router = new Router();

// GET all prompt templates
router.get('/', (ctx) => {
  const templates = dbHelper.prepare('SELECT * FROM prompt_templates ORDER BY is_active DESC, id DESC').all();
  ctx.body = templates;
});

// GET active template
router.get('/active', (ctx) => {
  const template = dbHelper.prepare('SELECT * FROM prompt_templates WHERE is_active = 1 LIMIT 1').get();
  ctx.body = template || null;
});

// POST create new template
router.post('/', (ctx) => {
  const { name, system_prompt, user_prompt } = ctx.request.body;
  
  if (!name || !system_prompt || !user_prompt) {
    ctx.status = 400;
    ctx.body = { error: 'name, system_prompt, user_prompt are required' };
    return;
  }

  const result = dbHelper.prepare(`
    INSERT INTO prompt_templates (name, system_prompt, user_prompt)
    VALUES (?, ?, ?)
  `).run(name, system_prompt, user_prompt);

  const newTemplate = dbHelper.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(result.lastInsertRowid);
  ctx.body = newTemplate;
});

// PUT update template
router.put('/:id', (ctx) => {
  const { id } = ctx.params;
  const { name, system_prompt, user_prompt, is_active } = ctx.request.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (system_prompt !== undefined) { updates.push('system_prompt = ?'); values.push(system_prompt); }
  if (user_prompt !== undefined) { updates.push('user_prompt = ?'); values.push(user_prompt); }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { error: 'No fields to update' };
    return;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  dbHelper.prepare(`UPDATE prompt_templates SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = dbHelper.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(id);
  ctx.body = updated;
});

// DELETE template
router.delete('/:id', (ctx) => {
  const { id } = ctx.params;
  dbHelper.prepare('DELETE FROM prompt_templates WHERE id = ?').run(id);
  ctx.status = 204;
});

// POST set active template
router.post('/:id/activate', (ctx) => {
  const { id } = ctx.params;
  
  // Deactivate all
  dbHelper.prepare('UPDATE prompt_templates SET is_active = 0').run();
  // Activate selected
  dbHelper.prepare('UPDATE prompt_templates SET is_active = 1 WHERE id = ?').run(id);
  
  const template = dbHelper.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(id);
  ctx.body = template;
});

export default router;
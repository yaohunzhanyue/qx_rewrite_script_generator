import Router from '@koa/router';
import { dbHelper } from '../db.js';

const router = new Router();

// GET all API configs
router.get('/', (ctx) => {
  const configs = dbHelper.prepare('SELECT * FROM api_configs ORDER BY is_active DESC, id DESC').all();
  ctx.body = configs;
});

// GET active config
router.get('/active', (ctx) => {
  const config = dbHelper.prepare('SELECT * FROM api_configs WHERE is_active = 1 LIMIT 1').get();
  ctx.body = config || null;
});

// POST create new config
router.post('/', (ctx) => {
  const { name, base_url, api_key, model } = ctx.request.body;
  
  if (!name || !base_url || !api_key) {
    ctx.status = 400;
    ctx.body = { error: 'name, base_url, api_key are required' };
    return;
  }

  const result = dbHelper.prepare(`
    INSERT INTO api_configs (name, base_url, api_key, model)
    VALUES (?, ?, ?, ?)
  `).run(name, base_url, api_key, model || 'gpt-4o');

  const newConfig = dbHelper.prepare('SELECT * FROM api_configs WHERE id = ?').get(result.lastInsertRowid);
  ctx.body = newConfig;
});

// PUT update config
router.put('/:id', (ctx) => {
  const { id } = ctx.params;
  const { name, base_url, api_key, model, is_active } = ctx.request.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (base_url !== undefined) { updates.push('base_url = ?'); values.push(base_url); }
  if (api_key !== undefined) { updates.push('api_key = ?'); values.push(api_key); }
  if (model !== undefined) { updates.push('model = ?'); values.push(model); }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { error: 'No fields to update' };
    return;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  dbHelper.prepare(`UPDATE api_configs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = dbHelper.prepare('SELECT * FROM api_configs WHERE id = ?').get(id);
  ctx.body = updated;
});

// DELETE config
router.delete('/:id', (ctx) => {
  const { id } = ctx.params;
  dbHelper.prepare('DELETE FROM api_configs WHERE id = ?').run(id);
  ctx.status = 204;
});

// POST set active config
router.post('/:id/activate', (ctx) => {
  const { id } = ctx.params;
  
  // Deactivate all
  dbHelper.prepare('UPDATE api_configs SET is_active = 0').run();
  // Activate selected
  dbHelper.prepare('UPDATE api_configs SET is_active = 1 WHERE id = ?').run(id);
  
  const config = dbHelper.prepare('SELECT * FROM api_configs WHERE id = ?').get(id);
  ctx.body = config;
});

// POST test config connection
router.post('/:id/test', async (ctx) => {
  const { id } = ctx.params;
  const config = dbHelper.prepare('SELECT * FROM api_configs WHERE id = ?').get(id);
  
  if (!config) {
    ctx.status = 404;
    ctx.body = { error: 'Config not found' };
    return;
  }

  try {
    const response = await fetch(`${config.base_url}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      ctx.body = { success: true, message: 'Connection successful' };
    } else {
      const errorText = await response.text();
      ctx.status = response.status;
      ctx.body = { success: false, message: `API error: ${response.status}`, detail: errorText };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { success: false, message: `Connection failed: ${err.message}` };
  }
});

export default router;
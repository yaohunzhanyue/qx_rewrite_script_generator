import Router from '@koa/router';
import { dbHelper } from '../db.js';
import { callLLMStream } from '../services/llm.js';

const router = new Router();

// POST generate script with SSE streaming
router.post('/', async (ctx) => {
  const { rawScript, originalResponse, vipResponse, taskId, apiConfigId, promptTemplateId } = ctx.request.body;

  // Get active config and template
  let config, template;

  if (apiConfigId) {
    config = dbHelper.prepare('SELECT * FROM api_configs WHERE id = ?').get(apiConfigId);
  } else {
    config = dbHelper.prepare('SELECT * FROM api_configs WHERE is_active = 1 LIMIT 1').get();
  }

  if (promptTemplateId) {
    template = dbHelper.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(promptTemplateId);
  } else {
    template = dbHelper.prepare('SELECT * FROM prompt_templates WHERE is_active = 1 LIMIT 1').get();
  }

  if (!config) {
    ctx.status = 400;
    ctx.body = { error: 'No API config found. Please configure API in settings.' };
    return;
  }

  if (!template) {
    ctx.status = 400;
    ctx.body = { error: 'No prompt template found. Please configure template in settings.' };
    return;
  }

  // Create or update task
  let task;
  const inputData = JSON.stringify({ rawScript, originalResponse, vipResponse });

  if (taskId) {
    dbHelper.prepare(`
      UPDATE generation_tasks 
      SET input_data = ?, status = 'streaming', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(inputData, taskId);
    task = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(taskId);
  } else {
    const result = dbHelper.prepare(`
      INSERT INTO generation_tasks (name, input_data, api_config_id, prompt_template_id, status)
      VALUES (?, ?, ?, ?, 'streaming')
    `).run(`任务 ${new Date().toLocaleString()}`, inputData, config.id, template.id);
    task = dbHelper.prepare('SELECT * FROM generation_tasks WHERE id = ?').get(result.lastInsertRowid);
  }

  // Set SSE headers
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.set('X-Accel-Buffering', 'no');

  const userInput = { rawScript, originalResponse, vipResponse };
  let fullOutput = '';

  try {
    await callLLMStream(config, template, userInput, (chunk) => {
      fullOutput += chunk;
      ctx.res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });

    // Update task with completed output
    dbHelper.prepare(`
      UPDATE generation_tasks 
      SET output_script = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullOutput, task.id);

    ctx.res.write(`data: ${JSON.stringify({ type: 'done', taskId: task.id })}\n\n`);
  } catch (err) {
    // Update task with error
    dbHelper.prepare(`
      UPDATE generation_tasks 
      SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(err.message, task.id);

    ctx.res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  }

  ctx.res.end();
});

export default router;
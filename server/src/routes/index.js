import Router from '@koa/router';
import apiConfigRouter from './api-config.js';
import promptTemplateRouter from './prompt-template.js';
import generateRouter from './generate.js';
import tasksRouter from './tasks.js';

const router = new Router();

// Mount sub-routers
router.use('/api/api-config', apiConfigRouter.routes(), apiConfigRouter.allowedMethods());
router.use('/api/prompt-template', promptTemplateRouter.routes(), promptTemplateRouter.allowedMethods());
router.use('/api/generate', generateRouter.routes(), generateRouter.allowedMethods());
router.use('/api/tasks', tasksRouter.routes(), tasksRouter.allowedMethods());

// Health check
router.get('/api/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

export default router;
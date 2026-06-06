import Koa from 'koa';
import cors from '@koa/cors';
import koaBody from 'koa-body';
import router from './routes/index.js';
import { initDb } from './db.js';
import 'dotenv/config';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(cors());
app.use(koaBody({
  json: true,
  text: true,
  multipart: true,
  urlencoded: true
}));
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'qx_script.db');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize SQL.js
const SQL = await initSqlJs();

// Load or create database
let db;
if (existsSync(dbPath)) {
  const fileBuffer = readFileSync(dbPath);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

// Helper to save database to file
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

// Auto-save on exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(0); });

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS api_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'default',
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS prompt_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'default',
    system_prompt TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS generation_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '未命名任务',
    input_data TEXT NOT NULL,
    output_script TEXT,
    api_config_id INTEGER,
    prompt_template_id INTEGER,
    status TEXT DEFAULT 'pending',
    archived INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_config_id) REFERENCES api_configs(id) ON DELETE SET NULL,
    FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates(id) ON DELETE SET NULL
  )
`);

// Initialize default prompt template from code.md if not exists
const templateCount = db.exec('SELECT COUNT(*) as count FROM prompt_templates')[0]?.values[0][0] || 0;
if (templateCount === 0) {
  try {
    const codeMdPath = join(__dirname, '..', '..', 'code.md');
    const codeMdContent = readFileSync(codeMdPath, 'utf-8');
    
    const systemPrompt = `# 角色
你是一位精通 iOS 逆向分析和 Quantumult X 脚本开发的高级工程师。

# 任务
请将我提供的"抓包生成的原始请求脚本"转化为"Quantumult X Rewrite 响应修改脚本"，用于实现 App 的 VIP/会员功能解锁。

# 处理要求
1. 脚本转换：移除原有的 $task.fetch 主动请求逻辑，改为使用 QX 内置的 $response 对象进行拦截修改，并通过 $done({body: JSON.stringify(obj)}) 返回。
2. 字段修改逻辑：
   - 如果我提供了【真实会员响应体】，请精准对比两个 JSON 的差异，将非 VIP 响应体中的差异字段全部修改为 VIP 的值。
   - 如果我提供的是"无"，请根据常见 App 的鉴权逻辑和原始响应体中的字段语义（如 vip, isPro, subscriptionStatus, expireTime, level 等）进行合理推断和修改，并加上清晰的注释说明。
3. 容错处理：必须包含 try...catch，解析失败时打印错误日志并执行 $done({}) 放行，防止 App 白屏或功能异常。
4. 日志输出：修改成功后，使用 console.log 打印核心修改的字段（如 "VIP 状态已修改为 true"），方便我在 QX 日志中确认脚本是否生效。
5. 配置输出：在脚本顶部以注释的形式，输出对应的 QX [rewrite_local] 正则匹配规则和 [mitm] hostname 配置。`;

    const userPrompt = `1. 原始抓包脚本：
{{rawScript}}

2. 当前账号（非VIP）的原始响应体：
{{originalResponse}}

3. 真实会员账号的响应体（如果有，这是关键！如果没有请填"无"）：
{{vipResponse}}`;

    db.run(`
      INSERT INTO prompt_templates (name, system_prompt, user_prompt, is_active)
      VALUES (?, ?, ?, 1)
    `, ['默认模板', systemPrompt, userPrompt]);
    
    console.log('✅ 默认提示词模板已从 code.md 初始化');
  } catch (err) {
    console.warn('⚠️ 无法读取 code.md，使用内置默认模板:', err.message);
    
    const defaultSystemPrompt = `# 角色
你是一位精通 iOS 逆向分析和 Quantumult X 脚本开发的高级工程师。

# 任务
请将我提供的"抓包生成的原始请求脚本"转化为"Quantumult X Rewrite 响应修改脚本"，用于实现 App 的 VIP/会员功能解锁。

# 处理要求
1. 脚本转换：移除原有的 $task.fetch 主动请求逻辑，改为使用 QX 内置的 $response 对象进行拦截修改，并通过 $done({body: JSON.stringify(obj)}) 返回。
2. 字段修改逻辑：
   - 如果我提供了【真实会员响应体】，请精准对比两个 JSON 的差异，将非 VIP 响应体中的差异字段全部修改为 VIP 的值。
   - 如果我提供的是"无"，请根据常见 App 的鉴权逻辑和原始响应体中的字段语义进行合理推断和修改，并加上清晰的注释说明。
3. 容错处理：必须包含 try...catch，解析失败时打印错误日志并执行 $done({}) 放行，防止 App 白屏或功能异常。
4. 日志输出：修改成功后，使用 console.log 打印核心修改的字段，方便我在 QX 日志中确认脚本是否生效。
5. 配置输出：在脚本顶部以注释的形式，输出对应的 QX [rewrite_local] 正则匹配规则和 [mitm] hostname 配置。`;

    const defaultUserPrompt = `1. 原始抓包脚本：
{{rawScript}}

2. 当前账号（非VIP）的原始响应体：
{{originalResponse}}

3. 真实会���账号的响应体（如果有，这是关键！如果没有请填"无"）：
{{vipResponse}}`;

    db.run(`
      INSERT INTO prompt_templates (name, system_prompt, user_prompt, is_active)
      VALUES (?, ?, ?, 1)
    `, ['默认模板', defaultSystemPrompt, defaultUserPrompt]);
  }
}

saveDb();

// Database helper functions (compatible with better-sqlite3 API)
export const dbHelper = {
  prepare(sql) {
    return {
      run(...params) {
        // For INSERT/UPDATE/DELETE, we need to handle params binding
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        saveDb();
        
        // Get last insert rowid - sql.js has issues with last_insert_rowid()
        // Use alternative: query the max id from the table being inserted
        // Extract table name from INSERT statement
        const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
        let lastInsertRowid = null;
        
        if (tableMatch) {
          const tableName = tableMatch[1];
          const maxIdResult = db.exec(`SELECT MAX(id) FROM ${tableName}`);
          if (maxIdResult.length > 0 && maxIdResult[0].values.length > 0) {
            const value = maxIdResult[0].values[0][0];
            lastInsertRowid = typeof value === 'bigint' ? Number(value) : value;
          }
        }
        
        return { lastInsertRowid };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  
  exec(sql) {
    db.run(sql);
    saveDb();
  }
};

export { db, saveDb, initDb };
export default dbHelper;

// initDb is called automatically on module import
// This export is for explicit initialization if needed
function initDb() {
  // Database is already initialized at module load time
  console.log('✅ Database initialized');
}
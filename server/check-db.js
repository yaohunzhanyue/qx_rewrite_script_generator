import initSqlJs from 'sql.js';
import fs from 'fs';

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('data/qx_script.db'));
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', JSON.stringify(tables, null, 2));
  
  const configs = db.exec('SELECT * FROM api_configs');
  console.log('API Configs:', JSON.stringify(configs, null, 2));
  
  const templates = db.exec('SELECT * FROM prompt_templates');
  console.log('Templates:', JSON.stringify(templates, null, 2));
});
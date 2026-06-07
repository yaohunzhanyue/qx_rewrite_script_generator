# QX Script Generator

QX Script Generator 是一个用于将原始抓包脚本转换为 Quantumult X Rewrite 脚本的单页应用。

## 功能

- 左侧任务列表，支持新建、重命名、归档和删除任务
- 右侧脚本输入与生成结果展示
- API 配置管理
- 提示词模板管理
- 基于 SSE 的流式生成输出
- 兼容 OpenAI 风格的聊天补全接口

## 技术栈

- 前端：Vue 3、Vite、Element Plus
- 存储：localStorage（纯前端，无需后端）
- API：直接调用 LLM 服务（需 OpenAI 兼容接口）

## 项目结构

```
qx_script/
├── client/   # 前端应用（完整独立）
└── code.md   # 默认提示词模板内容来源
```

## 环境要求

- Node.js 18+ 推荐
- npm

## 安装依赖

```bash
cd client && npm install
```

## 启动项目

```bash
npm run dev
```

前端运行在：`http://localhost:5173`

## 使用说明

1. 打开前端页面后，先在"设置"中添加一个 API 配置。
2. 确保 API 服务是 OpenAI 兼容接口，并填写可用的 Base URL、API Key 和模型名。
3. 可在"提示词模板"中维护生成脚本所用模板。
4. 在任务列表中新建任务，填写原始抓包脚本和相关响应内容。
5. 点击"生成脚本"后，结果会以流式方式显示在右侧。

## 数据存储

纯前端方案，数据保存在浏览器 localStorage 中：

- API 配置
- 提示词模板
- 生成任务
- 生成结果与状态

## 常见问题

- 如果页面提示未配置 API，请先在设置中添加 API 配置并激活。
- 如果生成失败，请检查配置的 Base URL、API Key 和模型名是否正确。
- 数据存储在浏览器本地，更换浏览器后数据不会迁移。
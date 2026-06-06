---
description: "Git 提交规范：在会话结束前，智能体应总结更改并创建有意义的提交信息"
applyTo: "**"
---

# Git 提交规范

## 会话结束前提交

在完成用户请求后，如果工作区有未提交的更改，**主动执行 git commit**：

1. **检查更改**：使用 `git status` 和 `git diff` 查看修改内容
2. **总结更改**：根据修改内容生成有意义的提交信息
3. **执行提交**：使用规范的 commit message 格式

## Commit Message 格式

使用 Conventional Commits 规范：

```
<type>(<scope>): <description>

[optional body]
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加用户登录功能 |
| `fix` | Bug 修复 | fix: 修复登录验证逻辑 |
| `docs` | 文档更新 | docs: 更新 README 安装说明 |
| `style` | 代码格式（不影响功能） | style: 格式化代码缩进 |
| `refactor` | 重构（不是新功能也不是修复） | refactor: 重构 API 请求逻辑 |
| `perf` | 性能优化 | perf: 优化列表渲染性能 |
| `test` | 添加测试 | test: 添加登录单元测试 |
| `chore` | 构建/工具变动 | chore: 更新依赖版本 |
| `ci` | CI 配置变动 | ci: 添加 GitHub Actions |

### Scope 范围（可选）

指明影响的模块或文件：
- `feat(api): 添加用户接口`
- `fix(ui): 修复按钮样式`
- `docs(readme): 更新安装说明`

## 提交流程

```
1. git status                    # 查看更改
2. git diff                      # 查看具体修改
3. git add -A                    # 暂存所有更改
4. git commit -m "type: message" # 提交
```

## 示例

```bash
# 添加新功能
git commit -m "feat: 添加任务管理模块"

# 修复 bug
git commit -m "fix: 修复任务删除时的状态同步问题"

# 更新文档
git commit -m "docs: 更新 API 文档"

# 多个更改
git commit -m "feat: 添加统一启动脚本

- 创建根目录 package.json
- 添加 concurrently 依赖
- 配置 VSCode launch.json"
```

## 注意事项

- **排除 node_modules**：确保 `.gitignore` 已包含 `node_modules/`
- **有意义的描述**：提交信息应清楚说明"做了什么"和"为什么"
- **原子提交**：每个提交应该是一个逻辑单元
- **不要提交敏感信息**：检查 `.env` 文件是否在 `.gitignore` 中
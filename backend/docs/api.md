# API 文档

## 通用约定

### 请求格式

所有请求体使用 `application/json`，包含字段：

```json
{
  "username": "string",
  "password": "string"
}
```

认证请求需在 Header 中携带：

```
Authorization: Bearer <token>
```

### 响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 错误码，见下方 |
| message | string | 提示信息 |
| data | object/null | 响应数据，失败时为 null |

### 错误码

| 错误码 | HTTP 状态码 | 含义 | 处理建议 |
|--------|------------|------|---------|
| 200 | 200 | 成功 | — |
| 400 | 400 | 请求参数错误 | 检查请求参数 |
| 401 | 401 | 未授权 | 清除 token，跳转登录 |
| 403 | 403 | 无权限 | 跳转 403 页面 |
| 404 | 404 | 资源不存在 | 检查 API 路径 |
| 409 | 409 | 资源冲突 | 检查唯一性约束 |
| 422 | 422 | 校验失败 | 显示具体字段错误 |
| 500 | 500 | 服务器错误 | 显示 500 页面 |
| 1001 | 401 | 登录失败 | 检查用户名和密码 |
| 1002 | 401 | 账号已禁用 | 联系管理员 |
| 1003 | 401 | 账号已锁定 | 等待解锁或联系管理员 |
| 2001 | 400 | 创建失败 | 检查输入数据 |
| 2002 | 400 | 更新失败 | 检查输入数据 |
| 2003 | 400 | 删除失败 | 检查依赖关系 |

## 认证接口

### POST /api/auth/login

用户登录，返回 JWT token。

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应 (200)：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "real_name": "管理员"
    }
  }
}
```

**失败响应 (401)：**

```json
{
  "code": 1001,
  "message": "用户名或密码错误",
  "data": null
}
```

### GET /api/auth/me

获取当前登录用户信息。

**认证：** 需要 Bearer Token

**成功响应 (200)：**

```json
{
  "code": 200,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "real_name": "管理员"
    }
  }
}
```

### POST /api/auth/logout

注销当前 token，将其加入黑名单。

**认证：** 需要 Bearer Token

**成功响应 (200)：**

```json
{
  "code": 200,
  "message": "退出登录成功",
  "data": null
}
```

## 开发接口

### POST /api/auth/dev-create-user

**仅限开发环境**，用于创建测试用户。

**请求体：**

```json
{
  "username": "testuser",
  "password": "123456",
  "role": "user",
  "real_name": "测试用户"
}
```

**成功响应 (200)：**

```json
{
  "code": 200,
  "message": "用户创建成功",
  "data": {
    "id": 3
  }
}
```

## Health Check

### GET /health

健康检查接口。

**成功响应 (200)：**

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "status": "ok"
  }
}
```

## 任务接口

### GET /api/tasks

获取任务列表，支持筛选、搜索、分页、排序。

**认证：** 需要 Bearer Token

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 状态筛选：pending / in_progress / completed |
| priority | string | 优先级筛选：high / medium / low |
| category | number | 分类ID |
| search | string | 标题/描述模糊搜索 |
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 10 |
| sortField | string | 排序字段 |
| sortOrder | string | 排序方向：ascend / descend |

**成功响应：**
```json
{
  "code": 200,
  "data": {
    "data": [ { "id": 1, "title": "...", ... } ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### POST /api/tasks — 创建任务
### GET /api/tasks/:id — 获取单个任务
### PUT /api/tasks/:id — 更新任务
### DELETE /api/tasks/:id — 软删除（移入回收站）

### PUT /api/tasks/:id/restore — 恢复已删除任务
### DELETE /api/tasks/:id/permanent — 永久删除

### GET /api/tasks/trash — 回收站列表
### GET /api/tasks/stats/overview — 任务统计

```json
{
  "code": 200,
  "data": {
    "total": 25,
    "byStatus": { "pending": 10, "in_progress": 8, "completed": 7 },
    "byPriority": { "high": 3, "medium": 12, "low": 10 },
    "byCategory": { "工作": 12, "学习": 8 },
    "overdue": 2
  }
}
```

### DELETE /api/tasks/batch — 批量删除
### PUT /api/tasks/batch — 批量更新
### PUT /api/tasks/reorder — 看板排序
### GET /api/tasks/export?format=json|csv — 导出
### GET /api/tasks/users — 可分配用户列表

## 分类接口

### GET /api/tasks/categories — 分类列表
### POST /api/tasks/categories — 创建分类

## 评论接口

### GET /api/tasks/:id/comments — 获取评论列表（含嵌套回复）
### POST /api/tasks/:id/comments — 创建评论

**请求体：**
```json
{ "content": "评论内容", "parent_id": null }
```

### DELETE /api/comments/:id — 删除评论（仅自己或admin）

## 通知接口

### GET /api/notifications — 通知列表
### GET /api/notifications/unread-count — 未读数量
```json
{ "code": 200, "data": { "count": 5 } }
```
### PUT /api/notifications/:id/read — 标记已读
### PUT /api/notifications/read-all — 全部已读

## Admin 接口（需 admin 角色）

### GET /api/admin/users — 用户列表
### PUT /api/admin/users/:id — 更新用户
### DELETE /api/admin/users/:id — 删除用户
### GET /api/admin/categories — 分类列表
### POST /api/admin/categories — 创建分类
### PUT /api/admin/categories/:id — 更新分类
### DELETE /api/admin/categories/:id — 删除分类

## Health Check

### GET /api/health

```json
{
  "code": 200,
  "data": {
    "status": "running",
    "database": "connected",
    "uptime": 1234.5,
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| user1 | 123456 | user |
| user2 | 123456 | user |

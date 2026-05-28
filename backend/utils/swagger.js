/**
 * Swagger/OpenAPI 配置 — 轻量化任务管理系统
 * 访问地址：开发环境 http://localhost:3000/api/docs
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '轻量化任务管理系统 API',
      version: '2.0.0',
      description:
        '## 期末项目 — Web 程序设计课程\n\n' +
        '基于 React + Express + MySQL 的轻量化任务管理系统。\n\n' +
        '### 技术栈\n' +
        '- 前端：React 18 + Vite + Ant Design 5 + Zustand\n' +
        '- 后端：Express 5 + JWT + MySQL2\n' +
        '- 部署：Docker Compose (Nginx + Node + MySQL)\n\n' +
        '### 认证\n' +
        '登录成功后返回 JWT Token，后续请求需在 Header 中携带：\n' +
        '`Authorization: Bearer <token>`\n\n' +
        '### 测试账号\n' +
        '| 角色 | 用户名 | 密码 |\n' +
        '|------|--------|------|\n' +
        '| 管理员 | admin | admin123 |\n' +
        '| 普通用户 | user1 | 123456 |',
    },
    servers: [
      { url: 'http://localhost:3000', description: '本地开发服务器' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '登录接口返回的 token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
            real_name: { type: 'string', example: '管理员' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: '完成期末项目' },
            description: { type: 'string', example: '完善任务管理系统的各项功能' },
            status: {
              type: 'string', enum: ['pending', 'in_progress', 'completed'],
              example: 'in_progress',
              description: 'pending=待处理, in_progress=进行中, completed=已完成',
            },
            priority: {
              type: 'string', enum: ['high', 'medium', 'low'],
              example: 'high',
              description: 'high=高, medium=中, low=低',
            },
            category_id: { type: 'integer', example: 1 },
            category_name: { type: 'string', example: '项目' },
            assignee_id: { type: 'integer', example: 1 },
            assignee_name: { type: 'string', example: '管理员' },
            due_date: { type: 'string', format: 'date', example: '2026-06-15' },
            sort_order: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: '工作' },
            color: { type: 'string', example: '#1890ff' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            type: { type: 'string', enum: ['comment', 'assigned', 'due_soon', 'overdue'] },
            task_id: { type: 'integer' },
            message: { type: 'string' },
            is_read: { type: 'integer', example: 0 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'real_name'],
          properties: {
            username: { type: 'string', example: 'newuser' },
            password: { type: 'string', example: '123456' },
            real_name: { type: 'string', example: '新用户' },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: '新建任务' },
            description: { type: 'string', example: '任务描述' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' },
            category_id: { type: 'integer', example: 1 },
            assignee_id: { type: 'integer', example: 2 },
            due_date: { type: 'string', format: 'date', example: '2026-06-30' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200 },
            message: { type: 'string', example: '操作成功' },
            data: { type: 'object' },
          },
        },
        PaginatedTasks: {
          type: 'object',
          properties: {
            list: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
            total: { type: 'integer', example: 25 },
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        StatsOverview: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 25 },
            pending: { type: 'integer', example: 8 },
            in_progress: { type: 'integer', example: 12 },
            completed: { type: 'integer', example: 5 },
            highPriority: { type: 'integer', example: 3 },
            overdue: { type: 'integer', example: 2 },
            statusDistribution: {
              type: 'array', items: {
                type: 'object', properties: {
                  status: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            priorityDistribution: {
              type: 'array', items: {
                type: 'object', properties: {
                  priority: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            categoryDistribution: {
              type: 'array', items: {
                type: 'object', properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: '认证', description: '登录、注册、登出、密码修改' },
      { name: '任务管理', description: '任务 CRUD、筛选、排序、导入导出' },
      { name: '评论', description: '任务评论与回复' },
      { name: '通知', description: '通知查询与已读管理' },
      { name: '系统管理', description: '用户管理、分类管理（需 admin 角色）' },
      { name: '健康检查', description: '服务状态检查' },
    ],
    paths: {
      // ======== 认证 ========
      '/api/auth/login': {
        post: {
          tags: ['认证'],
          summary: '用户登录',
          description: '验证用户名密码，返回 JWT Token。限流 10次/分钟。',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: '登录成功，返回 token 和用户信息' },
            401: { description: '用户名或密码错误' },
            429: { description: '登录尝试过于频繁' },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['认证'],
          summary: '用户注册',
          description: '注册新用户（默认 role=user），成功后自动返回 Token 实现自动登录。限流 5次/分钟。',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: '注册成功，返回 token 和用户信息' },
            409: { description: '用户名已存在' },
            429: { description: '注册过于频繁' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['认证'],
          summary: '获取当前用户信息',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: '当前登录用户信息' },
            401: { description: '未登录或 token 无效' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['认证'],
          summary: '退出登录',
          description: '将当前 Token 加入黑名单。',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: '退出成功' },
          },
        },
      },
      '/api/auth/password': {
        put: {
          tags: ['认证'],
          summary: '修改密码',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword'],
                  properties: {
                    oldPassword: { type: 'string', example: 'admin123' },
                    newPassword: { type: 'string', example: 'newPass123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: '密码修改成功' },
            400: { description: '旧密码不正确' },
          },
        },
      },

      // ======== 任务管理 ========
      '/api/tasks': {
        get: {
          tags: ['任务管理'],
          summary: '获取任务列表',
          description: '支持多条件筛选、分页、排序。',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' }, description: '状态筛选' },
            { name: 'priority', in: 'query', schema: { type: 'string' }, description: '优先级筛选' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: '分类ID' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: '搜索关键词' },
            { name: 'assignee', in: 'query', schema: { type: 'string' }, description: '负责人ID' },
            { name: 'dateRange', in: 'query', schema: { type: 'string' }, description: '日期范围' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: '页码' },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 }, description: '每页条数' },
            { name: 'sortField', in: 'query', schema: { type: 'string' }, description: '排序字段' },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: '排序方向' },
          ],
          responses: {
            200: { description: '任务列表（含分页信息）' },
          },
        },
        post: {
          tags: ['任务管理'],
          summary: '创建任务',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } } },
          },
          responses: {
            201: { description: '任务创建成功' },
            400: { description: '标题不能为空' },
          },
        },
      },
      '/api/tasks/stats/overview': {
        get: {
          tags: ['任务管理'],
          summary: '获取任务统计数据',
          description: '返回任务总数、状态分布、优先级分布、分类分布、逾期数等。',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: '统计数据' },
          },
        },
      },
      '/api/tasks/categories': {
        get: {
          tags: ['任务管理'],
          summary: '获取所有分类',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '分类列表' } },
        },
        post: {
          tags: ['任务管理'],
          summary: '创建分类',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: '新分类' },
                    color: { type: 'string', example: '#ff4d4f' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: '分类创建成功' } },
        },
      },
      '/api/tasks/{id}': {
        get: {
          tags: ['任务管理'],
          summary: '获取单个任务详情',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: '任务详情' },
            404: { description: '任务不存在' },
          },
        },
        put: {
          tags: ['任务管理'],
          summary: '更新任务',
          description: '更新任务字段，自动记录审计日志。',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } } },
          },
          responses: { 200: { description: '更新成功' } },
        },
        delete: {
          tags: ['任务管理'],
          summary: '软删除任务（移入回收站）',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '已移入回收站' } },
        },
      },
      '/api/tasks/{id}/restore': {
        put: {
          tags: ['任务管理'],
          summary: '恢复已删除任务',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '恢复成功' } },
        },
      },
      '/api/tasks/{id}/permanent': {
        delete: {
          tags: ['任务管理'],
          summary: '永久删除任务',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '已永久删除' } },
        },
      },
      '/api/tasks/trash': {
        get: {
          tags: ['任务管理'],
          summary: '获取回收站列表',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: '回收站任务列表' } },
        },
      },
      '/api/tasks/users': {
        get: {
          tags: ['任务管理'],
          summary: '获取可分配用户列表',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '用户列表' } },
        },
      },
      '/api/tasks/export': {
        get: {
          tags: ['任务管理'],
          summary: '导出任务数据',
          description: '支持 JSON 和 CSV 格式。CSV 导出已做公式注入防护。',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
          ],
          responses: {
            200: { description: '导出文件下载' },
          },
        },
      },
      '/api/tasks/import': {
        post: {
          tags: ['任务管理'],
          summary: 'CSV 批量导入任务',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
          },
          responses: { 200: { description: '导入结果' } },
        },
      },
      '/api/tasks/batch': {
        delete: {
          tags: ['任务管理'],
          summary: '批量删除任务',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ids'],
                  properties: { ids: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] } },
                },
              },
            },
          },
          responses: { 200: { description: '批量删除结果' } },
        },
        put: {
          tags: ['任务管理'],
          summary: '批量更新任务',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ids', 'updates'],
                  properties: {
                    ids: { type: 'array', items: { type: 'integer' } },
                    updates: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        priority: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '批量更新结果' } },
        },
      },
      '/api/tasks/reorder': {
        put: {
          tags: ['任务管理'],
          summary: '看板排序',
          description: '更新看板视图中任务的排序位置。',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'taskIds'],
                  properties: {
                    status: { type: 'string' },
                    taskIds: { type: 'array', items: { type: 'integer' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '排序更新成功' } },
        },
      },

      // ======== 评论 ========
      '/api/tasks/{taskId}/comments': {
        get: {
          tags: ['评论'],
          summary: '获取任务评论列表（含嵌套回复）',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '评论列表（树形结构）' } },
        },
        post: {
          tags: ['评论'],
          summary: '添加评论',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string', example: '这个任务进展如何？' },
                    parent_id: { type: 'integer', description: '父评论ID（回复时使用）' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: '评论创建成功' } },
        },
      },
      '/api/comments/{id}': {
        delete: {
          tags: ['评论'],
          summary: '删除评论',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '评论已删除' } },
        },
      },

      // ======== 通知 ========
      '/api/notifications': {
        get: {
          tags: ['通知'],
          summary: '获取通知列表',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '通知列表' } },
        },
      },
      '/api/notifications/unread-count': {
        get: {
          tags: ['通知'],
          summary: '获取未读通知数量',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '未读数量' } },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['通知'],
          summary: '标记通知已读',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '已标记' } },
        },
      },
      '/api/notifications/read-all': {
        put: {
          tags: ['通知'],
          summary: '全部标记已读',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '已全部标记' } },
        },
      },

      // ======== 系统管理 ========
      '/api/admin/users': {
        get: {
          tags: ['系统管理'],
          summary: '获取所有用户列表',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '用户列表' } },
        },
      },
      '/api/admin/users/{id}': {
        put: {
          tags: ['系统管理'],
          summary: '更新用户信息/角色',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '用户已更新' } },
        },
        delete: {
          tags: ['系统管理'],
          summary: '删除用户',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '用户已删除' } },
        },
      },
      '/api/admin/categories': {
        get: {
          tags: ['系统管理'],
          summary: '获取所有分类（管理用）',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '分类列表' } },
        },
        post: {
          tags: ['系统管理'],
          summary: '创建分类',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: '分类已创建' } },
        },
      },
      '/api/admin/categories/{id}': {
        put: {
          tags: ['系统管理'],
          summary: '更新分类',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '分类已更新' } },
        },
        delete: {
          tags: ['系统管理'],
          summary: '删除分类',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '分类已删除' } },
        },
      },

      // ======== 健康检查 ========
      '/api/health': {
        get: {
          tags: ['健康检查'],
          summary: '服务健康检查',
          responses: {
            200: {
              description: '服务正常',
              content: {
                'application/json': {
                  example: { code: 200, message: '服务运行正常', data: { db: 'connected', uptime: 12345 } },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // 不使用文件扫描，所有定义已在上方 paths 中
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

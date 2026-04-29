# Quiz App Monorepo

当前仓库已拆分为前后端分离结构：

```text
project-root/
  frontend/   # React Native + Expo 前端
  backend/    # Java Spring Boot 后端
```

## Frontend

前端位于 `frontend/`，基于 Expo Router。

常用命令：

```bash
cd frontend
npm install
npm start
npm run check
```

## Backend

后端位于 `backend/`，基于 Spring Boot，当前使用内存 mock 数据实现接口。

目标接口：

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/catalog/snapshot`
- `GET /api/v1/categories`
- `GET /api/v1/questions`
- `POST /api/v1/answers`

常用命令：

```bash
cd backend
mvn spring-boot:run
```

说明：

- 当前执行环境缺少 Java Runtime，因此本次改造中后端代码会搭好，但本地编译和启动需要安装 JDK 21。
- 前端保留 mock 模式，同时支持通过环境变量切到后端模式。

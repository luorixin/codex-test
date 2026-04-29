# Quiz Backend

基于 Spring Boot 3 的多模块后端，负责题库读取、登录鉴权、练习会话、作答记录、错题本和学习统计。

当前项目采用：

- Java 21
- Spring Boot 3.3.5
- Spring Security + JWT
- Redis
- MyBatis
- MySQL
- Maven 多模块

## 1. 项目结构

```text
backend/
  pom.xml                  # 父 POM，管理版本与模块
  quiz-common/             # 通用层
  quiz-system/             # 业务层
  quiz-framework/          # 基础设施层
  quiz-admin/              # 启动与 Web 接口层
```

模块依赖关系是单向的：

```text
quiz-admin -> quiz-framework -> quiz-system -> quiz-common
```

这条依赖链是当前项目的基本边界，不要反向引用。

## 2. 各模块职责

### `quiz-common`

通用基础模块，放不依赖具体业务的公共内容。

主要职责：

- 统一响应对象：`ApiResponse`
- 基础实体：`BaseEntity`
- 枚举：`PracticeMode`、`QuestionType`
- 常量：JWT / Redis key 常量
- 异常：`ServiceException`
- 工具：`SecurityUtils`、`ServletUtils`

这层不承载业务逻辑。

### `quiz-system`

业务核心模块，放领域对象、Mapper、Service 接口和实现。

主要职责：

- 领域实体：
  - `Subject` / `Topic` / `Question` / `QuestionOption`
  - `PracticeSession`
  - `PracticeSessionQuestion`
  - `UserAnswer`
  - `WrongBookItem`
- DTO / VO 定义
- MyBatis Mapper 与 XML
- 业务服务实现：
  - `QuestionServiceImpl`
  - `PracticeSessionServiceImpl`
  - `WrongBookServiceImpl`
  - `StudyStatsServiceImpl`
  - `TopicServiceImpl`
  - `SysUserServiceImpl`

这是最主要的业务实现层。

### `quiz-framework`

基础设施与运行时能力模块。

主要职责：

- Spring Security 配置：`SecurityConfig`
- JWT 认证过滤器：`JwtAuthenticationTokenFilter`
- 登录用户模型：`LoginUser`
- Token 管理：`TokenService`
- 认证服务：`AuthServiceImpl`
- `UserDetailsServiceImpl`
- Redis 配置：`RedisConfig`
- MyBatis 配置：`MyBatisConfig`
- CORS 配置：`CorsConfig`
- 全局异常处理：`GlobalExceptionHandler`

这层负责“系统如何运行”，不是“业务怎么处理”。

### `quiz-admin`

应用入口和 HTTP API 暴露层。

主要职责：

- 启动类：`QuizApplication`
- Controller：
  - `HealthController`
  - `AuthController`
  - `CatalogController`
  - `AnswerController`
  - `PracticeSessionController`
  - `WrongBookController`
  - `HomeController`
  - `StudyStatsController`
  - `TopicProgressController`
- 运行配置：
  - `application.yml`
  - `db/schema.sql`
  - `db/data.sql`

这一层只做协议转换、参数接收和结果返回，不应该塞复杂业务。

## 3. 架构分层

请求的大致流转路径：

```text
HTTP Request
  -> Controller (quiz-admin)
  -> Service (quiz-system / quiz-framework)
  -> Mapper (quiz-system)
  -> MySQL / Redis
```

### Web 层

Controller 只负责：

- 路由
- 参数校验
- 调用 Service
- 返回 `ApiResponse`

### Service 层

Service 负责：

- 业务规则
- 事务边界
- 领域对象编排
- 安全边界校验

例如练习主链路里，`submitAnswer` 会在一个服务事务里完成：

- 校验 session 归属
- 校验题目属于当前 session
- 判题
- 写 `user_answer`
- 更新 `wrong_book_item`
- 更新 `practice_session.correct_count / finished_at`

### 持久层

持久层用 MyBatis XML，不用 JPA。

当前 Mapper 分两类：

- 基础读写 Mapper：
  - `PracticeSessionMapper`
  - `PracticeSessionQuestionMapper`
  - `UserAnswerMapper`
  - `WrongBookItemMapper`
  - `QuestionMapper`
  - `TopicMapper`
  - `SubjectMapper`
  - `SysUserMapper`
- 聚合查询 Mapper：
  - `PracticeQueryMapper`
  - `StudyRecordQueryMapper`

这种拆法的目的，是把“基础表写入”和“复杂报表查询”分开。

## 4. 核心业务域

### 4.1 题库域

题库相关表：

- `subject`
- `topic`
- `question`
- `question_option`

题库读取接口：

- `GET /api/v1/catalog/snapshot`
- `POST /api/v1/answers`

约束：

- 对外题目选项不返回 `isCorrect`
- 正确答案只通过判题接口暴露

### 4.2 认证域

当前登录体系：

- 用户表：`sys_user`
- Access Token：JWT
- 登录态缓存：Redis
- Refresh Token：Redis

关键点：

- `POST /api/v1/auth/login` 登录后返回：
  - `accessToken`
  - `refreshToken`
  - `user`
- `POST /api/v1/auth/refresh` 使用 refresh token 换新 token
- 除 `health`、`login`、`refresh` 外，其它 `/api/v1/**` 默认都要求鉴权

### 4.3 练习域

练习相关表：

- `practice_session`
- `practice_session_question`
- `user_answer`
- `wrong_book_item`

主要接口：

- `POST /api/v1/practice-sessions`
- `GET /api/v1/practice-sessions/{sessionId}`
- `POST /api/v1/practice-sessions/{sessionId}/answers`

设计原则：

- session 归属后端管理
- 同一 `sessionId + questionId` 只允许提交一次最终答案
- 练习进度以后端为单一事实来源

### 4.4 错题本与统计域

主要接口：

- `GET /api/v1/wrong-book/overview`
- `GET /api/v1/wrong-book/subjects`
- `GET /api/v1/wrong-book/topics`
- `GET /api/v1/wrong-book/questions`
- `GET /api/v1/wrong-book/questions/{questionId}`
- `GET /api/v1/home/overview`
- `GET /api/v1/home/recent-practice`
- `GET /api/v1/stats/daily`
- `GET /api/v1/stats/recent-practice`
- `GET /api/v1/stats/subjects`
- `GET /api/v1/stats/topics`
- `GET /api/v1/topics/{topicId}/progress`

这些接口对应前端首页、错题本、统计页和 topic 进度页。

## 5. 数据库设计

当前 schema 在：

- [quiz-admin/src/main/resources/db/schema.sql](/Users/fridafeng/Documents/sunxin/work/codex-test/backend/quiz-admin/src/main/resources/db/schema.sql:1)

初始化数据在：

- [quiz-admin/src/main/resources/db/data.sql](/Users/fridafeng/Documents/sunxin/work/codex-test/backend/quiz-admin/src/main/resources/db/data.sql:1)

### 题库表

- `subject`
- `topic`
- `question`
- `question_option`

### 用户表

- `sys_user`

### 学习记录表

- `practice_session`
- `practice_session_question`
- `user_answer`
- `wrong_book_item`

### 关键索引

重点索引围绕这些查询：

- 用户最近练习
- session 下题目顺序
- session 下作答查询
- 用户错题本按 subject / topic / resolved / time 查询
- 用户统计聚合

## 6. 安全设计

安全配置在：

- [quiz-framework/src/main/java/com/quizapp/framework/config/SecurityConfig.java](/Users/fridafeng/Documents/sunxin/work/codex-test/backend/quiz-framework/src/main/java/com/quizapp/framework/config/SecurityConfig.java:1)

当前规则：

- 放行：
  - `GET /api/v1/health`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
- 其余接口默认要求认证

JWT 校验由 `JwtAuthenticationTokenFilter` 完成。

Token 存储分两部分：

- access token：JWT 自描述
- refresh token：Redis 映射到 `LoginUser`

## 7. 异常与响应规范

统一响应对象：

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

错误响应示例：

```json
{
  "success": false,
  "message": "common.errors.invalidRequest",
  "errors": {
    "field": "error.code"
  }
}
```

全局异常处理在：

- [quiz-framework/src/main/java/com/quizapp/framework/web/exception/GlobalExceptionHandler.java](/Users/fridafeng/Documents/sunxin/work/codex-test/backend/quiz-framework/src/main/java/com/quizapp/framework/web/exception/GlobalExceptionHandler.java:1)

当前处理范围：

- `ServiceException`
- 参数校验异常
- 反序列化异常
- 未授权 / 禁止访问
- 未知异常日志记录 + 500

## 8. 配置说明

主配置文件：

- [quiz-admin/src/main/resources/application.yml](/Users/fridafeng/Documents/sunxin/work/codex-test/backend/quiz-admin/src/main/resources/application.yml:1)

### 8.1 端口

```yaml
server:
  port: 8080
```

### 8.2 MySQL

环境变量：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

默认库名是 `quiz`。

### 8.3 Redis

环境变量：

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

### 8.4 JWT

环境变量：

- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`

### 8.5 SQL 初始化

```yaml
spring:
  sql:
    init:
      mode: never
```

默认不开自动建表。需要初始化库时，显式打开：

```bash
SPRING_SQL_INIT_MODE=always
```

## 9. 启动方式

### 9.1 环境要求

- JDK 21
- Maven 3.9+
- MySQL 8+
- Redis 6+

### 9.2 创建数据库

先创建数据库：

```sql
CREATE DATABASE quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 9.3 本地启动

在 `backend/` 目录下执行：

```bash
mvn -pl quiz-admin -am spring-boot:run
```

如果是第一次初始化 schema 和 demo 数据：

```bash
SPRING_SQL_INIT_MODE=always mvn -pl quiz-admin -am spring-boot:run
```

服务默认地址：

```text
http://localhost:8080
```

健康检查：

```text
GET http://localhost:8080/api/v1/health
```

### 9.4 打包运行

```bash
mvn clean package
java -jar quiz-admin/target/quiz-admin-0.0.1-SNAPSHOT.jar
```

## 10. 测试方式

执行全部后端测试：

```bash
mvn -pl quiz-admin -am test
```

当前测试包括：

- Spring Boot smoke test
- 练习主链路集成测试
- H2 内存数据库测试
- Security 测试

测试资源位于：

- `quiz-admin/src/test/resources/application.yml`
- `quiz-admin/src/test/resources/db/schema.sql`

补充说明：

- 当前测试环境为了兼容本机 JDK 25，显式使用了 Mockito subclass mock maker
- 生产运行目标仍然是 Java 21

## 11. 常见开发约束

### 新增业务接口时

- Controller 只做参数接收和响应包装
- 业务编排放到 `quiz-system` 的 Service
- 表访问统一走 Mapper
- 复杂 join / 聚合优先放 XML，不在 Java 里手写 SQL 字符串

### 新增表时

- 先改 `schema.sql`
- 如果需要 demo 数据，再补 `data.sql`
- 同步补 H2 测试 schema
- 补 Mapper / XML / Service / Controller
- 最后补测试

### 改鉴权时

- 先看 `SecurityConfig`
- 再看 `JwtAuthenticationTokenFilter`
- 再看 `TokenService`

不要只改 Controller 放行规则。

## 12. 当前已知边界

- 当前是单应用、单数据源架构，没有拆读写库
- 没有引入 Flyway / Liquibase，schema 变更仍靠 SQL 文件维护
- 没有对象存储、消息队列、任务调度等外围基础设施
- 题库对外接口不下发正确答案，但判题接口会返回 `correctOptionKeys`
- mock / demo 数据仍然存在，适合本地联调，不适合作为生产数据初始化方案

## 13. 建议的阅读顺序

如果你第一次接手这个后端，建议按这个顺序读：

1. `backend/pom.xml`
2. `quiz-admin/src/main/resources/application.yml`
3. `quiz-admin/src/main/java/com/quizapp/QuizApplication.java`
4. `quiz-framework/config/SecurityConfig.java`
5. `quiz-framework/security/service/TokenService.java`
6. `quiz-system/service/impl/PracticeSessionServiceImpl.java`
7. `quiz-system/service/impl/WrongBookServiceImpl.java`
8. `quiz-system/service/impl/StudyStatsServiceImpl.java`
9. `quiz-admin/src/main/resources/db/schema.sql`

这样能最快建立对项目整体结构的正确认识。

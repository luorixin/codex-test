# 刷题 App MVP

基于 `React Native + Expo` 的离线刷题应用，当前已完成：

- `Phase 1`：项目骨架、本地 SQLite、题库种子、静态导航
- `Phase 2`：章节/知识点练题主流程、即时判题、结果页
- `Phase 3`：错题本沉淀、按学科/知识点重做、错题详情
- `Phase 4`：首页统计卡片、统计页聚合、最近 7 天记录、学科/知识点完成度
- `Phase 5`：空状态/异常状态统一、页面返回刷新、发布前检查脚本与说明

## 启动

```bash
npm install
npm start
```

如果 Metro 缓存异常：

```bash
npx expo start --clear
```

## 常用检查

```bash
npm run typecheck
npm run validate-config
npm run doctor
npm run check
```

说明：

- `npm run check`：离线可执行，包含 TypeScript 校验和 Expo 配置解析
- `npm run doctor`：需要联网，用于发布前做更完整的 Expo 诊断

## 当前产品范围

- 支持学科 -> 章节/知识点 -> 练题
- 支持单选、多选、判断题
- 支持即时判题、结果页、错题本、基础学习统计
- 仅本地离线，不含账号、同步、后台

## 发布前人工验收建议

1. 首页进入任意学科、知识点并完成一轮练题。
2. 返回首页和统计页，确认累计作答、正确率、覆盖度已刷新。
3. 进入错题本，确认错题沉淀、按知识点重做和单题详情可用。
4. iOS/Android 上分别验证导航返回、长列表滚动和按钮禁用态。
5. 本地先执行 `npm run check`，联网环境再执行 `npm run doctor`。

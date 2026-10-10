# Claude 二审包

生成时间：2026-04-24

## 已完成项

1. 样本生成：`npm run full` 已生成 518,400 条样本。
2. 样本压缩：`samples-out` 下 720 个 `.jsonl.gz`，无残留 `.jsonl`，压缩后目录大小 5.9G。
3. 样本硬约束：`npm run validate:nihaixia` 通过，扫描 518,400 条。
4. 样本全量审计：`npm run audit:samples` 通过，失败数 0。
5. 资料工程骨架：已建立 `data/nihaixia/`。
6. 权利政策：已建立 `data/nihaixia/docs/RIGHTS_POLICY.md`。
7. 8 阶段蓝图：已建立 `data/nihaixia/docs/EXECUTION_BLUEPRINT.md`。
8. 来源 schema：已建立 `data/nihaixia/schemas/source.schema.json`。
9. 来源 seed：已建立 `data/nihaixia/seed/seed-sources.json`。
10. 自动扩库候选池：已建立 `data/nihaixia/seed/discovered-source-candidates*.json`，当前包含原始批次、batch-002、batch-003、batch-004、batch-005、batch-006、batch-007、batch-008、batch-009、batch-010。
11. 检索任务清单：已建立 `data/nihaixia/seed/source-search-queries.json`，当前 39 条检索任务。
12. 自动合并脚本：已建立 `scripts/expand-nihaixia-source-seeds.ts`，命令为 `npm run expand:sources`，支持 `discovered-source-candidates*.json` 多批次合并。
13. 来源采集：`npm run collect:sources` 通过。
14. 来源审计：`npm run audit:sources` 通过，失败数 0，警告数 0。
15. 来源覆盖统计：已建立 `scripts/report-nihaixia-source-coverage.ts`，命令为 `npm run coverage:sources`。
16. 来源复核队列：已建立 `scripts/report-nihaixia-review-backlog.ts`，命令为 `npm run backlog:sources`，并纳入 `npm run refresh:sources`。
17. 授权联系待办表：已建立 `scripts/report-nihaixia-license-contacts.ts`，命令为 `npm run contacts:sources`，并纳入 `npm run refresh:sources`。
18. 来源质量评分卡：已建立 `scripts/report-nihaixia-quality-scorecard.ts`，命令为 `npm run score:sources`，并纳入 `npm run refresh:sources`。
19. 授权请求草稿：已建立 `scripts/generate-nihaixia-license-drafts.ts`，命令为 `npm run drafts:sources`，并纳入 `npm run refresh:sources`。
20. 私有学习资料库：已建立 `data/nihaixia/private-vault/`，命令为 `npm run private:refresh`。
21. 系统成熟度评分：已建立 `scripts/report-nihaixia-readiness-score.ts`，命令为 `npm run readiness:score`。
22. 证据 schema：已建立 `data/nihaixia/schemas/evidence.schema.json`。
23. 证据映射：已建立 `data/nihaixia/evidence/constraint-evidence-map.json`。
24. 证据链审计：`npm run audit:evidence` 通过，失败数 0，警告数 0。

## 样本审计摘要

详见 `full-samples-audit-report.txt`。

- 分片数：720/720
- 样本总数：518400/518400
- 唯一出生组合：518400/518400
- 重复出生组合：0
- 缺失出生组合：0
- 每分片行数异常：0
- 大限0 `stemIndex == 大限宫干`：518400/518400
- 含 `selfSihua` 的样本：518400/518400
- health 含「子午流注」且含「经络」：518400/518400
- 12 条警示语：全部命中，`魁钺夹命，贵人在旁` 命中 17292 条
- 失败数：0
- 警告数：0

随机 20 条样本抽查（2026-04-24 终端执行）：

- 覆盖分片：20
- 大限0 `stemIndex == 大限宫干`：20/20
- 大限0 `stemIndex != lunarInfo.yearStem`：18/20
- 大限0 与年干数值巧合相同：2/20，且这 2 条仍同时满足 `stemIndex == 大限宫干`
- 含 `selfSihua` 的样本：20/20
- `selfSihua` 宫位平均比例：32.08%
- health 含「肝/肾/脾胃」：15/20
- health 含任一脏腑/经络词：20/20
- health 含「子午流注」且含「经络」：20/20

## 来源审计摘要

详见 `data/nihaixia/reports/source-audit-report.md`。

- 来源总数：211
- 可全文入库：1
- 不可全文入库 / 仅 metadata：210
- 权利状态：`metadata_only` 28，`unknown_needs_review` 167，`authorized_fulltext` 1，`prohibited` 15
- 风险等级：`low` 6，`medium` 83，`high` 107，`blocked` 15
- 媒介类型：官方政策 4，视频 61，音频 21，网页 47，PDF 10，文章 67，archive 1
- 人工复核状态：`approved` 4，`needs_license` 167，`pending` 25，`rejected` 15
- 自动 title 核验：尝试 35，HTTP 成功 33，非 2xx/3xx 且已 rejected 2
- 失败数：0
- 警告数：0

已明确 rejected/blocked 的来源不会进入证据库或全文库，其中包括自动 title 返回“视频去哪了呢？”的不可用 Bilibili 页面、资源站/下载器性质页面、404 页面、网盘/下载页风险线索。

## 来源覆盖摘要

详见 `data/nihaixia/reports/source-coverage-report.md`。

- 平台数：65
- 视频候选：有
- 音频候选：有
- 文字/文章候选：有
- PDF/讲义候选：有
- 风险来源显式 blocked：有
- 内部授权规则源：有

## 来源质量评分摘要

详见 `data/nihaixia/reports/source-quality-scorecard.md`。

- P0/P1 高优先级来源：138
- A 档证据候选：31
- 已授权全文来源：1
- blocked 隔离来源：15
- 授权请求草稿：127 条

## 成熟度评分摘要

详见 `data/nihaixia/reports/system-readiness-score.md`。

- 个人学习准备度：10.0/10
- 工程自动化成熟度：10.0/10
- 严格证据产品分：8.8/10
- 私有学习资料库：结构通过，当前 inbox 为空；放入 `.txt` / `.md` / `.srt` / `.vtt` 后可自动切片和 claim 标签审计

## 重要边界声明

本轮没有、也不应该声称已经合法取得“全网倪海厦全文/音频/视频语料”。

当前完成的是：

- 建立合法、可审计、可扩展的数据工程框架。
- 生成并验证 518,400 条紫微斗数样本。
- 登记十批公开候选来源 metadata。
- 明确把第三方视频、音频、PDF、网页资料标记为 `metadata_only` 或 `unknown_needs_review`。

原因：

- 第三方公开视频、音频、PDF、课程、讲义通常涉及版权和平台条款。
- 未授权前不得下载音视频、保存字幕全文、转存 PDF 全文或用于训练/RAG。
- 后续若要进入全文语料库，必须补充授权文件或明确许可证。

## 可复核命令

```bash
npx tsc --noEmit
npm run validate:nihaixia
npm run audit:samples
npm run expand:sources
npm run collect:sources
npm run audit:sources
npm run coverage:sources
npm run backlog:sources
npm run contacts:sources
npm run score:sources
npm run drafts:sources
npm run private:refresh
npm run readiness:score
npm run audit:evidence
```

## 产物路径

- 样本目录：`samples-out/`
- 样本全量审计：`full-samples-audit-report.txt`
- 来源目录：`data/nihaixia/registry/sources.catalog.jsonl`
- 自动扩库候选池：`data/nihaixia/seed/discovered-source-candidates.json`
- 第二批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-002.json`
- 第三批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-003.json`
- 第四批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-004.json`
- 第五批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-005.json`
- 第六批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-006.json`
- 第七批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-007.json`
- 第八批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-008.json`
- 第九批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-009.json`
- 第十批扩库候选池：`data/nihaixia/seed/discovered-source-candidates-batch-010.json`
- 检索任务清单：`data/nihaixia/seed/source-search-queries.json`
- 来源采集报告：`data/nihaixia/reports/source-collection-report.md`
- 来源审计报告：`data/nihaixia/reports/source-audit-report.md`
- 来源覆盖报告：`data/nihaixia/reports/source-coverage-report.md`
- 来源复核队列：`data/nihaixia/reports/source-review-backlog.md`
- 授权联系待办表：`data/nihaixia/reports/license-contact-backlog.md`
- 授权联系 CSV：`data/nihaixia/reports/license-contact-backlog.csv`
- 来源质量评分卡：`data/nihaixia/reports/source-quality-scorecard.md`
- 来源质量评分 CSV：`data/nihaixia/reports/source-quality-scorecard.csv`
- 授权请求草稿：`data/nihaixia/reports/license-outreach-drafts.md`
- 私有学习资料库：`data/nihaixia/private-vault/`
- 私有资料导入报告：`data/nihaixia/private-vault/reports/private-vault-import-report.md`
- 私有资料审计报告：`data/nihaixia/private-vault/reports/private-vault-audit-report.md`
- 系统成熟度评分：`data/nihaixia/reports/system-readiness-score.md`
- 证据 schema：`data/nihaixia/schemas/evidence.schema.json`
- 证据映射：`data/nihaixia/evidence/constraint-evidence-map.json`
- 证据链审计报告：`data/nihaixia/reports/evidence-audit-report.md`
- 权利政策：`data/nihaixia/docs/RIGHTS_POLICY.md`
- 执行蓝图：`data/nihaixia/docs/EXECUTION_BLUEPRINT.md`

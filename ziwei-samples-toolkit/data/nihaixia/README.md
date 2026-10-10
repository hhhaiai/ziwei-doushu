# 倪海厦紫微斗数资料工程

目标：建立一个可审计、可追溯、可授权扩展的倪海厦体系资料库，让每条紫微斗数结论都能回到算法路径、知识条目和来源证据。

当前状态：`source-search-queries.json` 记录 39 条检索任务，正式来源目录 `sources.catalog.jsonl` 已扩展到 211 条来源、65 个平台；来源审计和证据链审计均为失败 0、警告 0。新增来源质量评分卡、授权请求草稿、私有学习资料库和成熟度评分。按个人学习准备度口径，当前为 10.0/10；严格公开证据产品分单独列出。

## 目录

- `seed/source-search-queries.json`：自动扩库检索任务清单，记录每类查询的目标和默认权利边界。
- `seed/discovered-source-candidates*.json`：联网检索发现的候选来源批次；可持续追加 batch。
- `seed/seed-sources.json`：正式来源 seed，只登记 metadata，不默认保存全文。
- `registry/sources.catalog.jsonl`：采集脚本生成的来源目录。
- `reports/source-audit-report.md`：来源权利、可访问性、重复项、授权状态审计。
- `reports/source-coverage-report.md`：来源平台、媒介、标签、风险覆盖统计。
- `reports/source-review-backlog.md`：优先授权、待授权全文/转写、二手笔记、metadata-only、blocked 风险隔离队列。
- `reports/license-contact-backlog.md` / `.csv`：授权联系优先级和待办表。
- `reports/source-quality-scorecard.md` / `.csv`：来源证据价值评分、A/B/C/D 分层和 P0/P1 排序。
- `reports/license-outreach-drafts.md`：P0/P1 来源授权请求草稿。
- `reports/system-readiness-score.md`：个人学习准备度、工程自动化成熟度、严格证据产品分。
- `private-vault/`：本机私有学习资料导入、切片、hash、claim 标签审计目录。
- `schemas/source.schema.json`：来源登记 schema。
- `schemas/evidence.schema.json`：claim 到证据链的结构 schema。
- `evidence/constraint-evidence-map.json`：倪海厦体系硬约束到内部规则、代码、样本审计和候选来源的证据映射。
- `reports/evidence-audit-report.md`：证据链完整性审计。
- `docs/RIGHTS_POLICY.md`：版权、平台条款、采集边界。
- `docs/EXECUTION_BLUEPRINT.md`：1-8 阶段落地方案。

## 硬原则

1. 不下载、转存、分发无授权音视频。
2. 不把第三方全文、字幕、讲义直接塞入公共语料库。
3. 对未授权公开内容，只保存 metadata、URL、短摘要、人工复核状态。
4. 任何可训练、可展示、可全文检索的内容必须有授权、许可证、公共领域证明或用户私有授权。
5. 每个 claim 必须能追溯到 `source_id`、证据片段、算法规则或内部约束文件。

## 自动化命令

```bash
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

或一次执行：

```bash
npm run refresh:sources
npm run audit:evidence
```

`expand:sources` 会把 `discovered-source-candidates*.json` 合并到正式 seed，并按 `source_id`/URL 去重。`collect:sources` 只抓公开页面 title/status/content-type，不保存正文。`audit:sources` 会拦截未授权全文、音视频下载、不可用视频页、HTTP 非 2xx/3xx 且未 rejected 的自动核验来源、重复来源和 blocked 来源误入库。`backlog:sources` 会生成授权和复核优先队列。`contacts:sources` 会生成可分配的授权联系待办 CSV。`score:sources` 会把来源按证据价值和风险分层。`drafts:sources` 会生成授权请求草稿。`private:refresh` 会导入本机 `private-vault/inbox` 中的私有学习文本并生成证据切片。`readiness:score` 会输出 10 分制成熟度报告。`audit:evidence` 会检查硬约束 claim 是否都有 primary evidence 和授权边界说明。

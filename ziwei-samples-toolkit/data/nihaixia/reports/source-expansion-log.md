# 来源扩库日志

生成时间：2026-04-24

## 当前规模

- 正式来源：211
- 平台数：65
- 检索任务：39
- 候选批次：原始批次 + batch-002 至 batch-010
- 来源审计：失败 0，警告 0
- 证据链审计：失败 0，警告 0
- 复核队列：已生成 `data/nihaixia/reports/source-review-backlog.md`
- 授权联系待办表：已生成 `data/nihaixia/reports/license-contact-backlog.md` 和 `.csv`
- 来源质量评分卡：已生成 `data/nihaixia/reports/source-quality-scorecard.md` 和 `.csv`
- 授权请求草稿：已生成 `data/nihaixia/reports/license-outreach-drafts.md`

## 本轮新增重点

- batch-006：新增 25 条来源，覆盖 Bilibili 视频/专栏、小宇宙、懒人听书、蜻蜓 FM、西瓜视频、希望站、图南阁、Scribd、PDF 参考和 CSDN 风险页。
- batch-007：新增 10 条来源，补强 Bilibili 专栏/视频入口，覆盖第 30 集案例、24-25 集、三方四正、四化禄、子女/疾厄、星曜和择日边界主题。
- batch-008：新增 10 条来源，补强西瓜视频、抖音短视频、Doc88、Book118 文档平台候选，并保持 metadata-only。
- batch-009：新增 5 条来源，补强好看视频、搜狐视频、优酷、爱奇艺长视频平台入口。
- batch-010：新增 16 条来源，补强汉唐官方/支援站版权与《天纪》入口、woniuapp 天纪分集 metadata，以及四化、化忌、三方四正等核心规则授权候选。
- 编号目录探测：扫描 `nihaixiahope.com/tianji/1508-1565.html` 与 `finalhopes.com/tianji/ziweidoushu16-60.html`，未发现有效新增页面。

## 权利边界

- 第三方音视频、PDF、文档平台、专栏和转载文章均不下载、不保存正文、不抓字幕。
- `unknown_needs_review` 仅进入 metadata 目录，不能进入训练/RAG 全文库。
- `prohibited` / `blocked` 来源只作为风险隔离线索，防止后续误采。
- 可全文入库来源当前仍仅限内部授权规则文件。

## 复核命令

```bash
npm run refresh:sources
npm run audit:evidence
```

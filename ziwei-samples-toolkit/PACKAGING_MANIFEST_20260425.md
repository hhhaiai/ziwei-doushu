# 打包清单

生成时间：2026-04-25

## 包含

- `samples-out/`：完整 518,400 条样本，720 个 `.jsonl.gz` 分片。
- `data/nihaixia/`：来源库、证据链、私有学习资料库结构、审计报告、Claude 二审包。
- `lib/`：紫微斗数算法、四化、格局、分析规则代码。
- `scripts/`：生成、验证、审计、扩源、评分、私有资料导入脚本。
- `package.json` / `package-lock.json` / `tsconfig.json`：可复现运行配置。
- `README-CODEX.md` / `倪海厦体系约束.md`：任务说明和硬约束。
- `full-samples-audit-report.txt` 及运行日志：全量样本审计与验证记录。
- `sample-preview/`：预览样本。

## 不包含

- `node_modules/`：第三方依赖目录，可通过 `npm install` 重新安装。

## 关键复核命令

```bash
npm install
npx tsc --noEmit
npm run validate:nihaixia
npm run audit:samples
npm run refresh:sources
npm run private:refresh
npm run readiness:score
npm run audit:evidence
```

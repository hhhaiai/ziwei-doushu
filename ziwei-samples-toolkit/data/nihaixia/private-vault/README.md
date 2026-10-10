# 私有学习资料库

这个目录用于你本机已有的学习资料，不由公网爬虫写入。

## 用法

1. 把你已有的 `.txt`、`.md`、`.srt`、`.vtt` 放入 `inbox/`。
2. 运行：

```bash
npm run private:refresh
npm run readiness:score
```

脚本会生成：

- `registry/private-sources.catalog.jsonl`
- `chunks/private-evidence-chunks.jsonl`
- `reports/private-vault-import-report.md`
- `reports/private-vault-audit-report.md`

## 支持范围

- 文本/字幕：自动切片、打标签、hash 校验。
- PDF/音频/视频：只记录 metadata 和 hash。需要证据切片时，放入你已有的 OCR/转写文本。

## 原则

- 私有资料只进入 `private-vault`。
- 公网候选来源仍只进入公开 metadata catalog。
- 公开产品证据和私有学习证据分开，避免混库。

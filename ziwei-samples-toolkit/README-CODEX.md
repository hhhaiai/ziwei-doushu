# 紫微斗数样本批量生成任务（倪海厦体系）

> Codex 请先通读此文件再动手。本工具包用于批量生成紫微斗数命盘样本，核心约束是 **严格遵循倪海厦（1953-2012）老师的紫微斗数体系**，不引入其他流派（三合派、飞星派等）与现代简化算法。

---

## 1. 你（Codex）要做什么

> ⚠️ **主产出是 full 模式的 518,400 条样本**，preview / mini 只是冒烟，不是终点。

### 执行步骤（按顺序跑）

```bash
# Step 1 — 装依赖
npm install

# Step 2 — 冒烟验证（30 秒）
npm run preview
npm run validate:nihaixia          # 验证倪师铁律

# Step 3 — 主产出（★ 必做 ★）
npm run full
# 产物：samples-out/year-XXXX/YYYY-MM.jsonl
# 规模：518,400 条 · M 系列 Mac 约 30-90 分钟 · 约 60-80 GB

# Step 4 — 压缩
find samples-out -name "*.jsonl" -print0 | xargs -0 -P 4 -I {} gzip {}
# 压缩后约 5-8 GB

# Step 5 — 全量校验
npm run validate:nihaixia
# 所有样本必须全部通过倪师铁律（详见 倪海厦体系约束.md）

# Step 6 — 随机抽查 20 条，在终端输出检查结果
# 要求：
#   a) chart.daXians[0].siHua.stemIndex !== chart.lunarInfo.yearStem
#      （大限四化用宫干，不是年干）
#   b) 统计有 selfSihua 的宫位比例
#   c) topics.health 含「肝/肾/脾胃/肺/心」脏腑词的比例
#   d) topics.move 含「半空折翅」的比例（应 > 10%）
```

### 最终汇报

1. 总样本数 / 失败数 / 总磁盘占用（压缩前后）
2. 随机 20 条抽查结果
3. `npm run validate:nihaixia` 全通过截图 / 日志
4. `samples-out.tar` 或存储地址

**禁止项**：
- ❌ 禁止修改 `lib/ziwei/constants.ts` 里的天干地支、四化表、禄存/天魁/天钺/天马表、纳音五行局、主星亮度表——这些是排盘根基。
- ❌ 禁止替换 `lib/ziwei/db-analysis.ts` 中的知识库内容为"新编"的命理语料；若要扩展，只能增量加条目，不覆盖。
- ❌ 禁止更换底层库（不要从 iztro 切到 ziwei.js 或其他排盘实现）。
- ❌ 禁止绕过大限宫干四化使用"本命年干"替代（北派飞星方法论，项目已采用）。
- ❌ **禁止生成"倪师风格"的假原话**。如需扩展解读内容，只能：
  - 从 `corpus/verified/` 引用倪师《天纪》讲稿的真实原话；
  - 标注为 `[traditional] 古诀云...` 引用紫微通识口诀；
  - 标注为 `[methodology] 紫微斗数共识...` 引用通用方法论。
  **不要** 编造「倪海夏说 XXX」这种冒名原话。

## 语料库（corpus/）

本工具包附带一份**已核对的倪海厦原话语料库**：

- `corpus/verified/` — 从《天纪》02-13 集讲稿抽取的倪师原话（带集数来源）
- `corpus/traditional/` — 紫微通识口诀（非倪师独创，归属写为"古诀云"）
- `corpus/annotations.json` — 对 `lib/ziwei/db-analysis.ts` 中 95 处「倪师/倪海夏」引用的核对结果（verified / traditional / suspect / fabricated / methodology 五类）
- `corpus/sources.md` — 抓取的资料来源清单

**Codex 调用规则**：
- 生成命理文本时先查 `corpus/verified/`
- 找不到 → 改用 `corpus/traditional/` 的口诀
- 仍找不到 → 用通用方法论描述，**不要**假借"倪师说"
- 如果要给某条新增内容打引号，来源标签要写清（`[verified/天纪 XX]` 或 `[traditional]`）

---

## 2. 样本结构

每个样本的 JSON（简略示意）：

```json
{
  "birthInfo": { "year": 1990, "month": 3, "day": 15, "hour": 6, "gender": "male", "longitude": 120 },
  "chart": {
    "lunarInfo": { "lunarYear": 1990, "lunarMonth": 2, "yearStem": 6, "yearBranch": 6, ... },
    "mingGongBranch": 4,
    "shenGongBranch": 10,
    "wuxingJu": 3, "wuxingJuName": "木三局",
    "palaces": [
      {
        "branch": 0, "stem": 6, "name": "命宫",
        "stars": [ { "name": "紫微", "type": "major", "siHua": "禄", "brightness": "bright" }, ... ],
        "selfSihua": [ { "siHua": "禄", "starName": "廉贞" } ],     // 宫干自化
        ...
      }, ... 共 12 宫
    ],
    "daXians": [
      {
        "startAge": 5, "endAge": 14, "palaceBranch": 4, "palaceName": "命宫",
        "stemIndex": 6, "stemName": "庚",
        "siHua": { "lu": "太阳", "quan": "武曲", "ke": "太阴", "ji": "天同" }  // 大限宫干四化
      }, ... 共 12 大限
    ]
  },
  "topics": {
    "overview":    "...（命格总览的完整分析文本，已按倪师体系生成）",
    "personality": "...",
    "love":        "...",
    "career":      "...",
    "wealth":      "...",
    "health":      "...",   // 含 子午流注脏腑映射
    "family":      "...",
    "children":    "...",
    "move":        "...",
    "friends":     "...",
    "home":        "...",
    "spirit":      "...",
    "parents":     "..."
  },
  "system": "倪海厦紫微斗数"
}
```

`sample-preview/` 目录内有 ~20 个预生成样本可作为格式参考。

---

## 3. 倪师体系 10 条必守原则

1. **纳音五行局起盘**（水二/木三/金四/土五/火六），不用简化对照表。
2. **命宫逆数生时，身宫顺数生时**。
3. **紫微安星按倪师起紫微表**（依赖 iztro 底层，不要换库）。
4. **三方四正**：本宫 + 对宫 + 两个三合宫，四宫联动才能下判断。
5. **对宫借星**：本宫空宫时必借对宫主星论事。
6. **大限四化用大限宫的宫干**，不是本命年干（这是最容易搞错的一条）。
7. **流年四化用当年天干**；流月用月柱天干（由五虎遁推）。
8. **宫干自化**：该宫天干的四化恰好在本宫的星上，要标记并警示，尤其是自化忌。
9. **来因宫**：化忌的"根源宫"追溯逻辑必须保留。
10. **疾厄论断结合子午流注**：14 主星各有脏腑对应，健康话题必须出子午流注分析。

---

## 4. 性能与输出

- **512GB 输出估算**：full 模式 518,400 样本，每样本约 80-150KB（含 13 主题文本），合计约 **60-80GB**；用 jsonl + 按月分片可以分阶段处理。
- **运行时间估算**：在 M 系列 Mac 上约 30-90 分钟（单线程）。需要多核并行可以按年拆分并行跑（每 10 年一个进程）。
- **压缩**：.jsonl 默认可 gzip 到 1/5 左右。

如需极限压缩，可以选择 **只存 chart，不存 topics**（因为 topics 是可离线重放的，从 chart 派生）：

```bash
npx tsx scripts/generate-samples.ts --mode=full --out=./samples-out --format=jsonl
```

进一步减小体积，可改脚本中的 `ALL_TOPICS` 裁剪。

---

## 5. 验证检查表（生成后必做）

- [ ] 随机抽 10 个样本，核对：
  - `chart.daXians[0].siHua` 不是以本命年干算的（对比 `chart.lunarInfo.yearStem` 应不同）
  - `palace.selfSihua` 在有自化的宫位不为空
  - `topics.health` 包含"子午流注"或"经络"字样（倪师体系独有标记）
  - `topics.overview` 不含其他流派口吻（如"三合派"、"飞星派"等）
- [ ] 抽 1 个完整样本跑 `JSON.parse` + 结构检查，确保字段齐全
- [ ] 若 full 模式失败率 > 1%，停下来查错（可能是闰月或边界年份问题）

---

## 6. 常见问题

- **Q：iztro 报闰月/日期错误？**  
  A：部分早期年份（1900 前）农历数据缺，先跳过 1924 之前的年份（脚本默认 1924-1983）。
- **Q：输出太大磁盘撑不住？**  
  A：改脚本的 `ALL_TOPICS` 只留 `overview`，体积降到 1/13。
- **Q：能否并行？**  
  A：脚本是单进程的，要并行请按年份切分后启多个进程，或改脚本用 `worker_threads`。
- **Q：流年 / 流月样本要生成吗？**  
  A：默认 `view='mingpan'`（本命视图）。流年 / 流月是**动态**的（每年/每月变），不建议批量预生成；在需要时实时计算即可。

---

## 7. 提交产物要求

完成后请打包：
- `samples-out/` 全部样本（或存储位置的 URL）
- 生成日志（含 ok / fail 数字与失败列表）
- 一份抽样检查报告（10 条随机样本的字段正确性）

---

**核心一句话**：你是在执行批量计算，不是在"创造命理内容"。所有命理语料都来自 `lib/ziwei/db-analysis.ts` 和 `constants.ts`——把它们当作圣经即可，不要临场发挥。

<div align="center">

<img src="website/logo.svg" width="72" height="72" alt="Citation Tracker">

# Citation Tracker

**追踪被引变化，了解学术影响。**

自动追踪 Google Scholar 论文的被引次数，查看每次更新中哪些论文的被引次数增加。数据保存在浏览器本地。

[English](README.md) · [项目官网](https://jaychempan.github.io/citation-tracker) · [Chrome 应用商店](https://chromewebstore.google.com/detail/citation-tracker/fklkbgfognmpjiaflembdklibehgifkm)

[下载 v1.5.0 安装包](https://jaychempan.github.io/citation-tracker/downloads/citation-tracker-1.5.0.zip) · [更新日志](CHANGELOG.md)

</div>

## 功能

- **论文被引追踪**：查看每次更新中哪些论文的被引次数增加，以及增加了多少次。
- **论文列表**：浏览已保存的论文和被引次数，按学者或关键词筛选，按被引次数、发表年份、本次被引增量或标题排序；支持分批加载和 Scholar 在线搜索。
- **被引动态**：查看作者、发表信息、年份、更新前后的被引次数，以及论文详情和引用该论文的文献链接。
- **年度被引趋势**：展示 Scholar 公开的历年被引次数；当前年份标注「截至目前」，同比只比较连续的完整年度。
- **影响力雷达图**：展示被引次数、h-index、i10-index、被引论文占比和增长势头；可展开「指标说明」查看含义。
- **多学者追踪**：同时追踪自己和关注的研究者。
- **自动刷新**：每 30 分钟更新一次；网络失败时保留之前的数据。
- **本地历史记录**：保留最近 180 天内最多 200 条被引增长记录。
- **中英文界面**：首次使用跟随浏览器语言，可通过弹窗顶部的 **中文 / EN** 按钮切换，选择保存在本地。
- **可切换主题**：弹窗底部可选择「松绿」或「石墨」。两版均支持系统深浅色，主题选择保存在本地。

中文界面保留产品名称 `Citation Tracker`、通用指标 `h-index` 和 `i10-index`，以及论文标题、作者和发表信息的原文；操作按钮、说明和提示使用中文。

被引论文占比按已同步论文计算；增长势头采用最近两个连续完整年度的被引次数。某年度的缓存若是在该年结束前获取，则标注「截至上次同步」，刷新前不会计入完整年度比较。

首次成功刷新会保存论文及其被引次数的初始记录。后续刷新按稳定的 Scholar 论文 ID 对比被引次数，已有的被引次数不会计入本次增量。

## 安装与使用

从 [Chrome 应用商店](https://chromewebstore.google.com/detail/citation-tracker/fklkbgfognmpjiaflembdklibehgifkm)安装已发布版本。若要使用本仓库最新代码，请按以下步骤安装：

商店当前为 v1.4.0。使用 v1.5.0 可下载上方安装包，解压后在开发者模式中加载包含 `manifest.json` 的目录；也可按下方步骤从源码安装。

1. 克隆或下载本仓库。
2. 在 Chrome 中打开 `chrome://extensions`，开启右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择项目的 `chrome` 目录。
4. 点击工具栏图标，再点击 **+**，输入自己的 Google Scholar 学者 ID，也可添加其他学者 ID。
5. 点击「保存」，首次刷新保存论文和被引次数。
6. 在「论文」中浏览已保存的论文；后续刷新后，在「动态」中查看被引增长记录。

学者 ID 位于 Scholar 主页网址的 `user=` 后面，例如：

```text
https://scholar.google.com/citations?user=DhtAFkwAAAAJ
```

在已有开发者模式安装中更新代码后，请在 `chrome://extensions` 点击扩展的重新加载按钮，再打开弹窗。

## 常见问题

如果刷新失败，请点击错误提示中的「打开 Scholar 学者主页」，确认 Chrome 能访问 `scholar.google.com`，并在普通标签页完成 Google 验证，然后返回扩展刷新。

扩展会分别提示超时、HTTP 403/429、验证重定向、验证页面、无效学者主页及解析失败。如果被引总数已更新，但无法获取完整论文列表，会保留已获取的数据并显示「仅获取部分论文」。

学者 ID、语言及主题偏好、论文快照和被引历史均保存在设备的 `chrome.storage.local` 中。

## 开发

`chrome/` 为扩展代码，`website/` 为支持中英文的官网，`tests/` 为本地测试和弹窗预览。安装 Node.js 后运行：

```bash
npm test
npm run check
npm run package
```

## 许可证

[MIT](LICENSE)

# 3DGS 前端分享讲稿（精修版）

> 目标：讲清楚 3DGS 在 Web 前端的工程落地方法，并基于可运行示例做现场演示。  
> 受众：熟悉 React/Vite，了解 WebGL/Three.js/引擎基本概念的前端同学。  
> 总时长：约 25 分钟。

---

## 0. 分享目标与受众定位（1 min）

**你要先讲清楚：**

- 这不是“炫技 Demo 分享”，而是“可上线方案分享”。
- 我们关注的是前端真实问题：体积、加载、交互、稳定性、移动端兜底。
- 今天给出一套可以直接复用的模板（代码已落地到示例项目）。

可以用 1～2 句话，把**电商公司场景**点一下，让听众对后面内容有代入感，例如：

- 电商里典型的 3DGS 落地位点：商品详情页 3D 看样、会场页氛围场景、品牌故事页沉浸式内容等。
- 对我们来说，3DGS 不是“炫酷效果”，而是要在“转化率 / 停留时长 / 互动率”这些指标上能证明自己的东西。

---

## 1. 一句话理解 3DGS（前端视角）（2 min）

你可以这样开场：

> 3D Gaussian Splatting 不是三角网格渲染，而是大量带方向/尺度/颜色/透明度的高斯点在 GPU 上做投影与融合。

如果要给完全没听过 3DGS 的人一个 30 秒版本，可以补一句背景：

- 它是从 NeRF 等神经渲染路线演进出来的一个方向，用“高斯点云”替代“体素 / 三角面片”，在保证效果的前提下更容易做到**实时渲染**。
- 和传统 mesh 相比，3DGS 更像是“照片级外观重建”，不太适合骨骼动画，但非常适合**静态场景 / 商品 / 展厅**这类电商常见内容。

前端同学必须抓住三点：

1. **数据形态不同**：不是 glTF mesh 流程，而是一大团“带属性的高斯点云”，上游训练产物往往是 PLY / SOG 之类的新格式。
2. **性能瓶颈不同**：常见瓶颈在传输、解码、显存、fragment 压力，而不是“顶点数 / draw call 数量”这些我们熟悉的指标。
3. **工程解法不同**：格式和渲染链路决定成败，你要重新审视：怎么存、怎么传、怎么在 WebGL 里画、怎么和 React 工程结合。

---

## 2. 格式选择：PLY vs SOG（3 min）

### 2.1 PLY（研发友好，交付偏重）

- 优点：通用、生态广、训练产物常见。
- 缺点：体积大，Web 侧首屏与移动端成本高。

### 2.2 SOG（Web 交付优先）

- 面向 Web 的压缩容器，典型压缩比可显著优于同等 PLY ([developer.playcanvas.com][1])。
- PlayCanvas 在引擎、工具链、React 封装上有一致支持 ([blog.playcanvas.com][2], [developer.playcanvas.com][3])。

**讲稿结论：**

> 研发阶段可保留 PLY，但上线交付优先 SOG。

---

## 3. 为什么选 PlayCanvas 生态（2 min）

你可以从工程交付角度讲三件事：

1. **引擎原生支持 GSplat 组件化能力**，不必手写大量底层管线：  
   - 有现成的 `GSplatComponent`，帮你处理点云数据上传、着色器、排序等复杂细节。  
   - 这一点对前端团队很关键：你不需要自己搞一套 3D 框架，只要学会怎么“用组件”。
2. **`@playcanvas/react` 让 Application / Entity / Components 直接可 React 化封装** ([GitHub][5])：  
   - 在 React 里可以像写普通组件一样去组织 3D 场景，把 3D 部分当成一个 `<SplatViewer />` 使用。  
   - 这意味着它可以直接接入我们现有的 React 工程体系（路由、状态管理、埋点体系等）。
3. **工具链完整：`@playcanvas/splat-transform` 可直接做 PLY → SOG 转换** ([blog.playcanvas.com][2])：  
   - 3D / 算法团队给你 PLY，前端/中间层用官方工具一键转换成 Web 友好的 SOG 即可。  
   - 这条链路在电商场景里非常实用：新品拍完 → 建模 / 训练 → 产出 PLY → 转 SOG → 上线。

可以用一个小段落专门解释 **PlayCanvas + 3DGS 的关键概念**（不用很学术，重点是“前端怎么理解 / 怎么用”）：

- **GSplatComponent**：PlayCanvas 引擎里的 3DGS 组件，负责真正把 SOG 资产渲染出来；  
- **SOG 资产**：为 Web 压缩优化过的高斯点云容器，是我们最终放在 CDN / 静态资源里的东西；  
- **`useSplat` Hook**：在 React 里用来加载 SOG / 订阅加载进度 / 控制高质量开关等，是“资产层与 UI 层”的桥梁；  
- **Application / Entity / Script**：PlayCanvas 的基本运行单元，你可以简单理解成“一个小型游戏引擎被包在组件里”；  
- **`camera-controls` 脚本**：官方提供的相机控制脚本，在电商商品页里就是“拖动物体 / 缩放 / 旋转”的交互基础。

---

## 4. 可运行示例（演示主段，8 min）

### 4.1 示例位置与启动命令

示例目录：`/Users/jerichoding/Desktop/sharing/3DGS/example`

```bash
cd /Users/jerichoding/Desktop/sharing/3DGS/example
npm install
npm run dev
```

### 4.2 现场演示顺序（建议按这个节奏）

1. 打开页面，先展示加载 HUD 和进度条。
2. 模型加载完成后演示 orbit / pan / zoom 交互。
3. 讲解为什么默认 `antialias: false`（fragment 压力控制）。
4. 指出 `highQualitySH` 是质量/性能开关，移动端可默认关闭。
5. 演示如何把默认 URL 换成本地 `public/splats/*.sog`。

### 4.3 代码映射（讲稿不贴大段源码）

| 目标 | 文件 | 讲解重点 |
| --- | --- | --- |
| 示例入口 | `src/App.tsx` | 默认资源 URL 与 Viewer 参数注入 |
| 核心渲染组件 | `src/components/SplatViewer.tsx` | `Application`、`useSplat`、进度订阅、错误兜底 |
| 交互与 HUD 视觉 | `src/components/SplatViewer.css` | 加载层/提示层的用户感知设计 |
| 脚本类型声明 | `src/types/playcanvas-scripts.d.ts` | `camera-controls.mjs` 的 TS 兼容 |
| 运行说明 | `README.md` | 启动、替换资源、转换命令 |

---

## 5. 前端工程落地关键点（4 min）

这一章建议你直接从“我们是电商公司，真实会怎么落地”切入，把抽象点的建议都映射到业务场景上。

### 5.1 资源交付策略（电商视角）

- 用 **SOG + CDN 长缓存**（配版本号与 immutable 策略）。  
  - 对商品详情页来说，可以按“类目 / 品牌 / 活动”维度做资源治理，避免 CDN 上出现大量不可控的散落文件。
- **按场景拆包，避免首屏一次性灌入多个大模型。**  
  - 例如：详情页默认只加载当前主商品的 3DGS，关联推荐的 3D 场景可以懒加载 / 按需加载，不要一进来就全拉。
- **先出业务 UI（海报 / 骨架），再加载 splat。**  
  - 商品主图 / 视频 / 文案必须先可见，3DGS 作为“增强内容”慢半拍出现，不影响核心交易路径。

可以顺带补一句“怎么和后端 / 中台对齐”的话术：

- 建议用一个简单的“3D 资产 ID”挂在商品维度上，由中台负责映射到具体 SOG 地址，前端只认 ID，不直接写死 URL。

### 5.2 加载体验（必须做）

- 使用资产 hook 的 `subscribe` 做进度订阅 ([developer.playcanvas.com][6])。  
  - 详情页里可以把这个进度挂到一个小型 HUD 上，而不是全屏遮挡，保证用户随时可以操作其他内容。
- 错误态必须给可执行提示（URL、CORS、资源可达性）。  
  - 电商场景下建议准备一张“高质量静态渲染图”作为 fallback，避免出现黑屏 / 卡死，保持页面整体质感。

还可以补充一条**灰度与 A/B 的实践**：

- 通过埋点把“3DGS 是否加载成功 / 用户是否交互 / 对比 2D 下的转化指标”都打出去，方便后面做 3DGS 上线与否的决策。

### 5.3 性能开关（必须讲）

- splat 场景优先关闭抗锯齿，减少 fragment 压力 ([developer.playcanvas.com][7])。  
  - 对电商来说，比起“极致边缘平滑”，更重要的是“帧率稳定、不拖页面后腿”，所以可以理直气壮地关。
- `highQualitySH` 作为设备分档开关，移动端可优先性能 ([developer.playcanvas.com][8])。  
  - 可以按照 UA / WebGL 指标 / FPS 预估，把设备划成几档：高档机默认开、高画质；中低档机默认关、保帧率。  
  - 如果有运营诉求，可以在设置面板里给出“高画质模式”开关，让重度用户自己决定是否冒着发热 / 耗电打开它。

---

## 6. 可扩展方案（2 min）

当进入“多模型同屏/超大场景”时，下一步可引入：

- `unified`：多 splat 统一排序/渲染策略。
- `splatBudget` 与 `lodDistances`：按预算控制 LOD。
- 更大规模时结合流式 LOD 资产组织。  
  以上能力可从 GSplat 组件与官方 API 路线继续扩展 ([api.playcanvas.com][4], [developer.playcanvas.com][8])。

---

## 7. 上线前检查清单（2 min）

1. 交付格式是否已统一为 SOG。
2. 是否具备“加载中 / 失败 / fallback”完整状态机。
3. 是否完成性能兜底：`antialias:false`、移动端 `highQualitySH:false`。
4. 是否完成缓存策略与版本管理。
5. 是否有监控：首屏耗时、下载耗时、解码耗时、FPS。
6. 是否验证交互一致性（鼠标 + 触屏）。

---

## 8. 附录：命令速查（讲解时可口播）

### 初始化同类项目

```bash
npm create vite@latest gsplat-web -- --template react-ts
cd gsplat-web
npm install @playcanvas/react playcanvas
```

### PLY 转 SOG

```bash
npm install -g @playcanvas/splat-transform
splat-transform input.ply output.sog
```

---

## 9. 参考资料（末页）

- `@playcanvas/react`（React 集成方式、安装命令）([GitHub][5])
- 用 React 构建第一个 splat 应用（性能建议 + camera-controls）([developer.playcanvas.com][7])
- SOG 格式与压缩说明 ([developer.playcanvas.com][1])
- GSplat / useSplat / 资产 hooks 文档 ([developer.playcanvas.com][8], [developer.playcanvas.com][6])
- Engine API 示例（含 `toy-cat.sog` 资源）([developer.playcanvas.com][9])

---

[1]: https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/ "https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/"
[2]: https://blog.playcanvas.com/playcanvas-open-sources-sog-format-for-gaussian-splatting/ "https://blog.playcanvas.com/playcanvas-open-sources-sog-format-for-gaussian-splatting/"
[3]: https://developer.playcanvas.com/user-manual/editor/assets/inspectors/gsplat/ "https://developer.playcanvas.com/user-manual/editor/assets/inspectors/gsplat/"
[4]: https://api.playcanvas.com/engine/classes/GSplatComponent.html "https://api.playcanvas.com/engine/classes/GSplatComponent.html"
[5]: https://github.com/playcanvas/react "https://github.com/playcanvas/react"
[6]: https://developer.playcanvas.com/user-manual/react/api/hooks/use-asset/ "https://developer.playcanvas.com/user-manual/react/api/hooks/use-asset/"
[7]: https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/react/ "https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/react/"
[8]: https://developer.playcanvas.com/user-manual/react/api/gsplat/ "https://developer.playcanvas.com/user-manual/react/api/gsplat/"
[9]: https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/engine/ "https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/engine/"

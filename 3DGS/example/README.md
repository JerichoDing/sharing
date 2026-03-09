# 3DGS Web Example (React + Vite + PlayCanvas)

这是一个可直接运行的 3D Gaussian Splatting 前端示例，默认加载 PlayCanvas 官方 `toy-cat.sog`。

## 运行

```bash
cd /Users/jerichoding/Desktop/sharing/3DGS/example
npm install
npm run dev
```

访问终端输出的本地地址（通常是 `http://localhost:5173`）。

## 已实现能力

- `GSplat` 资源加载（支持 `.sog` / `.ply`）
- 加载进度条和错误提示
- 相机交互（orbit / pan / zoom）
- 性能默认项：`antialias: false`
- `highQualitySH` 质量开关（代码已预留）

## 关键文件

- `src/App.tsx`：示例入口和默认资源 URL
- `src/components/SplatViewer.tsx`：核心渲染、加载状态、交互逻辑
- `src/components/SplatViewer.css`：HUD 与加载层样式
- `src/types/playcanvas-scripts.d.ts`：`camera-controls.mjs` 类型声明

## 替换为你的 SOG

1. 把模型放到 `public/splats/your-model.sog`
2. 修改 `src/App.tsx` 中 `DEFAULT_SPLAT_URL` 为 `/splats/your-model.sog`

## PLY 转 SOG

```bash
npm install -g @playcanvas/splat-transform
splat-transform input.ply output.sog
```

把 `output.sog` 放到 `public/splats/` 后即可通过本地路径加载。

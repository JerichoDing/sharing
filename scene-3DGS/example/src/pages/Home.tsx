import {
  SplatViewer,
  type CameraInfo,
  type SplatTransform,
  type ViewerControlGroup,
  type ViewerInfoItem,
} from '../components/SplatViewer';
import { useMemo, useState } from 'react';
import './Home.css';

type DatasetConfig = {
  label: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  cameraPosition: [number, number, number];
  cameraDirection: [number, number, number];
};

const DataSets: DatasetConfig[] = [
  {
    label: 'Tracy',
    url: '/tracy.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [12.45, 11.041, 11.91],
    cameraDirection: [-0.608, -0.54, -0.582]
  },
  {
    label: 'Anji',
    url: '/anji.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [401.276, 272.054, 410.806],
    cameraDirection: [-0.631, -0.428, -0.646]
  },
  {
    label: '场景',
    url: '/fish-light.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [5.645, -3.004, 7.297],
    cameraDirection: [0.242, 0.955, 0.172]
  },
  {
    label: '佛像',
    url: '/buddy.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [8.586, 5.617, 8.454],
    cameraDirection: [-0.659, -0.451, -0.602]
  },
];

const operationGroups: ViewerControlGroup[] = [
  {
    title: '桌面端',
    items: [
      '左键拖动：环绕观察主体结构',
      '右键拖动：平移镜头，对准细节区域',
      '滚轮缩放：快速切换全景与局部视角',
    ],
  },
  {
    title: '触控端',
    items: [
      '单指拖动：旋转镜头',
      '双指捏合：缩放视角',
      '双指平移：横向或纵向查看建筑层次',
    ],
  },
  {
    title: '演示建议',
    items: [
      '先拉远建立整体空间感，再逐步推进到局部细节',
      '演示时沿中轴线缓慢平移，更容易体现体积层次',
      '首次进入可能需要等待解码，完成后再开始操作讲解',
    ],
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cameraDrafts, setCameraDrafts] = useState(
    () => DataSets.map((item) => ({ position: item.cameraPosition, direction: item.cameraDirection })),
  );
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const active = DataSets[Math.min(Math.max(activeIndex, 0), DataSets.length - 1)];
  const activeDraft = cameraDrafts[activeIndex];

  const sceneInfo: ViewerInfoItem[] = useMemo(
    () => [
      { label: '场景', value: `${active.label} 模型` },
      { label: '格式', value: 'SOG' },
      { label: '渲染', value: 'PlayCanvas GSplat' },
    ],
    [active.label],
  );

  const externalConfigText = useMemo(() => {
    if (!activeDraft) return '';
    return `{
  label: '${active.label}',
  url: '${active.url}',
  position: [${active.position.join(', ')}],
  rotation: [${active.rotation.join(', ')}],
  scale: [${active.scale.join(', ')}],
  cameraPosition: [${activeDraft.position.map((v) => Number(v.toFixed(3))).join(', ')}],
  cameraDirection: [${activeDraft.direction.map((v) => Number(v.toFixed(3))).join(', ')}]
}`;
  }, [active, activeDraft]);

  return (
    <section className="home-page">
      <div className="home-glow home-glow-a" />
      <div className="home-glow home-glow-b" />

      <div className="home-stage">
        <section className="home-panel home-copy">
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>切换模型</div>
            <select
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              style={{
                width: '100px',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(10,10,14,0.6)',
                color: 'rgba(255,255,255,0.92)',
                outline: 'none',
              }}
            >
              {DataSets.map((item, idx) => (
                <option key={item.url} value={idx}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                if (!cameraInfo) return;
                setCameraDrafts((prev) =>
                  prev.map((item, idx) =>
                    idx === activeIndex
                      ? {
                        position: cameraInfo.position,
                        direction: cameraInfo.direction,
                      }
                      : item,
                  ),
                );
              }}
              style={{
                cursor: 'pointer',
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.42)',
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              使用当前视角作为该模型初始视角
            </button>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
              先在画面中手动调整到理想缩放和角度，再点击保存。
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            当前保存的初始相机：
            <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
              position: [{activeDraft.position.map((v) => v.toFixed(3)).join(', ')}]
              <br />
              direction: [{activeDraft.direction.map((v) => v.toFixed(3)).join(', ')}]
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
              外部传入配置（复制到 DataSets）
            </div>
            <textarea
              readOnly
              value={externalConfigText}
              style={{
                width: '100%',
                minHeight: 120,
                resize: 'vertical',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(10,10,14,0.6)',
                color: 'rgba(255,255,255,0.9)',
                padding: 10,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
              }}
            />
          </div>
        </section>

        <section className="home-viewer-shell">
          <SplatViewer
            src={active.url}
            subtitle="适合分享时现场操作的 3DGS 浏览面板，保留资源信息、状态反馈与操作指南。"
            sceneInfo={sceneInfo}
            operationGroups={operationGroups}
            initialCameraPosition={activeDraft.position}
            initialCameraDirection={activeDraft.direction}
            splatTransform={
              {
                position: active.position as [number, number, number],
                rotation: active.rotation as [number, number, number],
                scale: active.scale as [number, number, number],
              } as SplatTransform
            }
            hintText="建议先滚轮拉远，再沿中轴线缓慢平移，方便展示整体空间关系。"
            onCameraUpdate={setCameraInfo}
          />
        </section>
      </div>
    </section>
  );
}

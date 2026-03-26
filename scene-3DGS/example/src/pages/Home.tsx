import {
  SplatViewer,
  type CameraInfo,
  type SplatTransform,
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
    label: '玩具',
    url: '/tracy.sog',
    position: [8, 5, 8],
    rotation: [180, 180, 0],
    scale: [1, 1, 1],
    cameraPosition: [16.81, 14.907, 16.08],
    cameraDirection: [-0.608, -0.54, -0.582]
  },
  {
    label: '校园',
    url: '/anji.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [401.276, 272.054, 410.806],
    cameraDirection: [-0.631, -0.428, -0.646]
  },
  {
    label: '文物',
    url: '/wenwu.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [12.189, 7.513, 12.03],
    cameraDirection: [-0.652, -0.402, -0.643]
  },
  {
    label: '佛像',
    url: '/buddy.sog',
    position: [8, 5, 8],
    rotation: [180, 0, 0],
    scale: [1, 1, 1],
    cameraPosition: [9.045, 5.94, 8.98],
    cameraDirection: [-0.643, -0.422, -0.639]
  }
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cameraDrafts, setCameraDrafts] = useState(
    () => DataSets.map((item) => ({ position: item.cameraPosition, direction: item.cameraDirection })),
  );
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const active = DataSets[Math.min(Math.max(activeIndex, 0), DataSets.length - 1)];
  const activeDraft = cameraDrafts[activeIndex];

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
          {/* <div style={{ marginTop: 12 }}>
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
          </div> */}
        </section>

        <section className="home-viewer-shell">
          <SplatViewer
            src={active.url}
            subtitle="适合分享时现场操作的 3DGS 浏览面板，保留资源信息、状态反馈与操作指南。"
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

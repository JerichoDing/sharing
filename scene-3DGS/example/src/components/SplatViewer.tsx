import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Application, Entity } from '@playcanvas/react';
import { useApp, useComponent, useScript, useSplat } from '@playcanvas/react/hooks';
import { useAppEvent } from '@playcanvas/react/hooks';
import {
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  type Asset,
  type CameraComponent,
  type GSplatComponent,
  type Script,
} from 'playcanvas';
import { CameraControls } from 'playcanvas/scripts/esm/camera-controls.mjs';

import './SplatViewer.css';

type Vec3 = [number, number, number];

export type ViewerInfoItem = {
  label: string;
  value: string;
};

export type ViewerControlGroup = {
  title: string;
  items: string[];
};

export type SplatTransform = {
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
};

export type SplatViewerProps = {
  src: string;
  initialCameraPosition?: Vec3;
  splatTransform?: SplatTransform;
  highQualitySH?: boolean;
  hintText?: string;
  title?: string;
  subtitle?: string;
  sceneInfo?: ViewerInfoItem[];
  operationGroups?: ViewerControlGroup[];
};

type SceneStatus = {
  loading: boolean;
  error: string | null;
  progress: number;
  hasAsset: boolean;
  empty: boolean;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const cameraSchema = {};

const gsplatSchema = {
  asset: {
    validate: () => true,
    default: null,
    errorMsg: () => '',
    apply: (instance: GSplatComponent, props: Record<string, unknown>) => {
      const value = props.asset as Asset | null;
      if (value) {
        instance.asset = value;
      }
    },
  },
  highQualitySH: {
    validate: (value: unknown) => typeof value === 'boolean',
    default: false,
    errorMsg: () => '',
    apply: (instance: GSplatComponent, props: Record<string, unknown>) => {
      instance.highQualitySH = Boolean(props.highQualitySH);
    },
  },
};

export type CameraInfo = {
  position: Vec3;
  direction: Vec3;
};

type SplatSceneProps = {
  src: string;
  initialCameraPosition: Vec3;
  transform: Required<SplatTransform>;
  highQualitySH: boolean;
  onStatusChange: (status: SceneStatus) => void;
  onCameraUpdate?: (info: CameraInfo) => void;
};

function CameraInfoReporter({ onCameraUpdate }: { onCameraUpdate: (info: CameraInfo) => void }) {
  const app = useApp();
  const lastUpdate = useRef(0);
  const throttleMs = 100;

  useAppEvent(
    'update',
    useCallback(
      (_dt: number) => {
        if (!app?.root || !onCameraUpdate) return;
        const cameraEntity = app.root.findByName('Camera');
        if (!cameraEntity) return;
        const now = performance.now();
        if (now - lastUpdate.current < throttleMs) return;
        lastUpdate.current = now;

        const pos = cameraEntity.getPosition();
        const fwd = cameraEntity.forward;
        onCameraUpdate({
          position: [pos.x, pos.y, pos.z],
          direction: [fwd.x, fwd.y, fwd.z],
        });
      },
      [app, onCameraUpdate],
    ),
  );
  return null;
}

function SplatScene({
  src,
  initialCameraPosition,
  transform,
  highQualitySH,
  onStatusChange,
  onCameraUpdate,
}: SplatSceneProps) {
  const { asset, loading, error, subscribe } = useSplat(src);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe((meta) => {
      if (typeof meta.progress === 'number') {
        setProgress(clamp01(meta.progress));
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    onStatusChange({
      loading,
      error,
      progress,
      hasAsset: Boolean(asset),
      empty: !loading && !error && !asset,
    });
  }, [asset, error, loading, onStatusChange, progress]);

  return (
    <>
      <Entity name="Camera" position={initialCameraPosition}>
        <CameraEntity />
      </Entity>

      <Entity
        name="Splat"
        position={transform.position}
        rotation={transform.rotation}
        scale={transform.scale}
      >
        <GSplatEntity asset={asset} highQualitySH={highQualitySH} />
      </Entity>

      {onCameraUpdate ? <CameraInfoReporter onCameraUpdate={onCameraUpdate} /> : null}
    </>
  );
}

function CameraEntity() {
  useComponent<Record<string, never>, CameraComponent>('camera', {}, cameraSchema);
  useScript(CameraControls as unknown as new () => Script, {}, null);
  return null;
}

type GSplatEntityProps = {
  asset: Asset | null;
  highQualitySH: boolean;
};

function GSplatEntity({ asset, highQualitySH }: GSplatEntityProps) {
  useComponent<GSplatEntityProps, GSplatComponent>(
    'gsplat',
    { asset, highQualitySH },
    gsplatSchema,
  );
  return null;
}

export function SplatViewer({
  src,
  initialCameraPosition = [10, -3000, 2500],
  splatTransform,
  highQualitySH = false,
  hintText = '左键旋转 / 右键平移 / 滚轮缩放',
  title = '3DGS Web Viewer',
  subtitle = '加载高斯泼溅资源并在浏览器中实时浏览。',
  sceneInfo = [],
  operationGroups = [],
}: SplatViewerProps) {
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>({
    loading: true,
    error: null,
    progress: 0,
    hasAsset: false,
    empty: false,
  });
  const [showHelp, setShowHelp] = useState(true);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);

  useEffect(() => {
    if (!sceneStatus.loading && sceneStatus.hasAsset) {
      const timer = window.setTimeout(() => setShowHelp(false), 2500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [sceneStatus.hasAsset, sceneStatus.loading]);

  const transform = useMemo(() => {
    return {
      position: splatTransform?.position ?? ([0, 0, 0] as Vec3),
      rotation: splatTransform?.rotation ?? ([0, 0, 0] as Vec3),
      scale: splatTransform?.scale ?? ([1, 1, 1] as Vec3),
    };
  }, [splatTransform]);

  const statusTone = sceneStatus.error
    ? 'error'
    : sceneStatus.loading
      ? 'loading'
      : sceneStatus.empty
        ? 'empty'
        : 'ready';

  const statusLabel = sceneStatus.error
    ? '资源异常'
    : sceneStatus.loading
      ? `加载中 ${Math.round(sceneStatus.progress * 100)}%`
      : sceneStatus.empty
        ? '等待数据'
        : '可交互浏览';

  const statusDescription = sceneStatus.error
    ? '检查资源路径或网络访问后重试。'
    : sceneStatus.loading
      ? '正在拉取并解码 splat 资源。'
      : sceneStatus.empty
        ? '当前场景未拿到可显示的 splat 数据。'
        : '模型已经进入实时渲染状态。';

  return (
    <div className="splat-root">
      <Application
        graphicsDeviceOptions={{ antialias: false }}
        fillMode={FILLMODE_FILL_WINDOW}
        resolutionMode={RESOLUTION_AUTO}
      >
        <SplatScene
          key={src}
          src={src}
          initialCameraPosition={initialCameraPosition}
          transform={transform}
          highQualitySH={highQualitySH}
          onStatusChange={setSceneStatus}
          onCameraUpdate={setCameraInfo}
        />
      </Application>

      <div className="hud">
        <div className="hud-left">
          <div className="badge">3DGS Demo</div>
          <div className="hero-card">
            <div className="hero-title">{title}</div>
            <div className="hero-subtitle">{subtitle}</div>
            {sceneInfo.length > 0 ? (
              <div className="hero-meta">
                {sceneInfo.map((item) => (
                  <div className="meta-item" key={item.label}>
                    <span className="meta-label">{item.label}</span>
                    <span className="meta-value">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="src" title={src}>
            {src}
          </div>
          {cameraInfo && (
            <div className="camera-info">
              <div className="camera-info-row">
                <span className="camera-info-label">位置</span>
                <span className="camera-info-value">
                  [{cameraInfo.position[0].toFixed(3)}, {cameraInfo.position[1].toFixed(3)},{' '}
                  {cameraInfo.position[2].toFixed(3)}]
                </span>
              </div>
              <div className="camera-info-row">
                <span className="camera-info-label">朝向</span>
                <span className="camera-info-value">
                  [{cameraInfo.direction[0].toFixed(3)}, {cameraInfo.direction[1].toFixed(3)},{' '}
                  {cameraInfo.direction[2].toFixed(3)}]
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="hud-right">
          <div className={`status-card is-${statusTone}`}>
            <div className="status-label">{statusLabel}</div>
            <div className="status-description">{statusDescription}</div>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
          >
            {showHelp ? '收起操作指南' : '展开操作指南'}
          </button>
        </div>
      </div>

      {showHelp && !sceneStatus.error ? (
        <aside className="guide-panel">
          <div className="guide-kicker">操作提示</div>
          <div className="guide-title">建议先熟悉相机控制，再开始演示。</div>
          {operationGroups.map((group) => (
            <section className="guide-group" key={group.title}>
              <div className="guide-group-title">{group.title}</div>
              <ul className="guide-list">
                {group.items.map((item) => (
                  <li className="guide-item" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>
      ) : null}

      {(sceneStatus.loading || sceneStatus.error || sceneStatus.empty) && (
        <div className="overlay">
          <div className="panel">
            <div className="title">
              {sceneStatus.error
                ? '加载失败'
                : sceneStatus.empty
                  ? '资源未显示'
                  : '加载中...'}
            </div>

            {sceneStatus.error ? (
              <div className="error">
                {String(sceneStatus.error)}
                <div className="tips">
                  提示：检查 URL / CORS / 资源可访问性。若用本地文件，放在
                  <code>public/</code> 下。
                </div>
              </div>
            ) : sceneStatus.empty ? (
              <div className="error">
                未拿到可渲染的 splat 资源。请确认文件格式和 URL：
                <div className="tips">
                  当前路径：<code>{src}</code>
                </div>
              </div>
            ) : (
              <>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.round(sceneStatus.progress * 100)}%`,
                    }}
                  />
                </div>
                <div className="progress-text">
                  {Math.round(sceneStatus.progress * 100)}%
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showHelp && !sceneStatus.loading && !sceneStatus.error && (
        <div className="hint">{hintText}</div>
      )}
    </div>
  );
}

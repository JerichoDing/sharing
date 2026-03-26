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

import {
  advanceAutoOrbit,
  createAutoOrbitState,
  shouldEnableAutoOrbitByDefault,
  shouldRunAutoOrbit,
} from './splatAutoOrbit';
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
  initialCameraDirection?: Vec3;
  splatTransform?: SplatTransform;
  autoOrbit?: boolean;
  autoOrbitSpeed?: number;
  highQualitySH?: boolean;
  hintText?: string;
  title?: string;
  subtitle?: string;
  sceneInfo?: ViewerInfoItem[];
  operationGroups?: ViewerControlGroup[];
  onCameraUpdate?: (info: CameraInfo) => void;
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
  initialCameraDirection?: Vec3;
  transform: Required<SplatTransform>;
  autoOrbitEnabled: boolean;
  autoOrbitSpeed: number;
  highQualitySH: boolean;
  onStatusChange: (status: SceneStatus) => void;
  onCameraUpdate?: (info: CameraInfo) => void;
};

function CameraInitialPose({
  initialCameraPosition,
  initialCameraDirection,
}: {
  initialCameraPosition: Vec3;
  initialCameraDirection?: Vec3;
}) {
  const app = useApp();
  const appliedRef = useRef(false);

  useAppEvent(
    'update',
    useCallback(() => {
      if (appliedRef.current || !app?.root) return;
      const cameraEntity = app.root.findByName('Camera');
      if (!cameraEntity) return;

      cameraEntity.setPosition(
        initialCameraPosition[0],
        initialCameraPosition[1],
        initialCameraPosition[2],
      );

      if (initialCameraDirection) {
        const targetX = initialCameraPosition[0] + initialCameraDirection[0];
        const targetY = initialCameraPosition[1] + initialCameraDirection[1];
        const targetZ = initialCameraPosition[2] + initialCameraDirection[2];
        cameraEntity.lookAt(targetX, targetY, targetZ);
      }

      appliedRef.current = true;
    }, [app, initialCameraDirection, initialCameraPosition]),
  );

  return null;
}

function CameraInfoReporter({ onCameraUpdate }: { onCameraUpdate: (info: CameraInfo) => void }) {
  const app = useApp();
  const lastUpdate = useRef(0);
  const throttleMs = 100;

  useAppEvent(
    'update',
    useCallback(
      () => {
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

function AutoOrbitController({
  enabled,
  target,
  angularSpeed,
}: {
  enabled: boolean;
  target: Vec3;
  angularSpeed: number;
}) {
  const app = useApp();
  const orbitStateRef = useRef<ReturnType<typeof createAutoOrbitState>>(null);

  useEffect(() => {
    orbitStateRef.current = null;
  }, [enabled, target]);

  useAppEvent(
    'update',
    useCallback(
      (dt: number) => {
        if (!app?.root) return;
        if (!enabled) {
          orbitStateRef.current = null;
          return;
        }

        const cameraEntity = app.root.findByName('Camera');
        if (!cameraEntity) return;

        if (!orbitStateRef.current) {
          const pos = cameraEntity.getPosition();
          orbitStateRef.current = createAutoOrbitState([pos.x, pos.y, pos.z], target);
        }

        const orbitState = orbitStateRef.current;

        if (
          !shouldRunAutoOrbit({
            autoOrbit: enabled,
            loading: false,
            hasAsset: true,
            userInteracted: false,
            orbitState,
          })
        ) {
          return;
        }

        if (!orbitState) return;

        const result = advanceAutoOrbit(orbitState, dt, angularSpeed);
        orbitStateRef.current = result.state;

        cameraEntity.setPosition(result.position[0], result.position[1], result.position[2]);
        cameraEntity.lookAt(target[0], target[1], target[2]);
      },
      [app, angularSpeed, enabled, target],
    ),
  );

  return null;
}

function SplatScene({
  src,
  initialCameraPosition,
  initialCameraDirection,
  transform,
  autoOrbitEnabled,
  autoOrbitSpeed,
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
      <CameraInitialPose
        initialCameraPosition={initialCameraPosition}
        initialCameraDirection={initialCameraDirection}
      />
      <AutoOrbitController
        enabled={autoOrbitEnabled}
        target={transform.position}
        angularSpeed={autoOrbitSpeed}
      />

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
  initialCameraDirection,
  splatTransform,
  autoOrbit,
  autoOrbitSpeed = 0.35,
  highQualitySH = false,
  hintText = '左键旋转 / 右键平移 / 滚轮缩放',
  title = '3DGS Web Viewer',
  subtitle = '加载高斯泼溅资源并在浏览器中实时浏览。',
  sceneInfo = [],
  operationGroups = [],
  onCameraUpdate,
}: SplatViewerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>({
    loading: true,
    error: null,
    progress: 0,
    hasAsset: false,
    empty: false,
  });
  const [showHelp, setShowHelp] = useState(true);
  const resolvedAutoOrbit = autoOrbit ?? shouldEnableAutoOrbitByDefault(src);
  const autoOrbitSessionKey = `${src}:${resolvedAutoOrbit ? 'auto' : 'manual'}`;
  const [interactedSessionKey, setInteractedSessionKey] = useState<string | null>(null);
  const userInteracted = interactedSessionKey === autoOrbitSessionKey;

  useEffect(() => {
    if (!sceneStatus.loading && sceneStatus.hasAsset) {
      const timer = window.setTimeout(() => setShowHelp(false), 2500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [sceneStatus.hasAsset, sceneStatus.loading]);

  useEffect(() => {
    if (!resolvedAutoOrbit || !sceneStatus.hasAsset || sceneStatus.loading) {
      return undefined;
    }

    const root = rootRef.current;
    if (!root) return undefined;

    const stopAutoOrbit = () => setInteractedSessionKey(autoOrbitSessionKey);
    const stopOnKey = (event: KeyboardEvent) => {
      if (
        [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyQ',
          'KeyE',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'ShiftLeft',
          'ShiftRight',
          'ControlLeft',
          'ControlRight',
        ].includes(event.code)
      ) {
        stopAutoOrbit();
      }
    };

    root.addEventListener('pointerdown', stopAutoOrbit, { passive: true });
    root.addEventListener('wheel', stopAutoOrbit, { passive: true });
    root.addEventListener('touchstart', stopAutoOrbit, { passive: true });
    window.addEventListener('keydown', stopOnKey);

    return () => {
      root.removeEventListener('pointerdown', stopAutoOrbit);
      root.removeEventListener('wheel', stopAutoOrbit);
      root.removeEventListener('touchstart', stopAutoOrbit);
      window.removeEventListener('keydown', stopOnKey);
    };
  }, [autoOrbitSessionKey, resolvedAutoOrbit, sceneStatus.hasAsset, sceneStatus.loading]);

  const transform = useMemo(() => {
    return {
      position: splatTransform?.position ?? ([0, 0, 0] as Vec3),
      rotation: splatTransform?.rotation ?? ([0, 0, 0] as Vec3),
      scale: splatTransform?.scale ?? ([1, 1, 1] as Vec3),
    };
  }, [splatTransform]);

  const autoOrbitEnabled =
    resolvedAutoOrbit && !userInteracted && sceneStatus.hasAsset && !sceneStatus.loading;




  return (
    <div className="splat-root" ref={rootRef}>
      <Application
        graphicsDeviceOptions={{ antialias: false }}
        fillMode={FILLMODE_FILL_WINDOW}
        resolutionMode={RESOLUTION_AUTO}
      >
        <SplatScene
          key={src}
          src={src}
          initialCameraPosition={initialCameraPosition}
          initialCameraDirection={initialCameraDirection}
          transform={transform}
          autoOrbitEnabled={autoOrbitEnabled}
          autoOrbitSpeed={autoOrbitSpeed}
          highQualitySH={highQualitySH}
          onStatusChange={setSceneStatus}
          onCameraUpdate={onCameraUpdate}
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

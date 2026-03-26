import {
  SplatViewer,
  type ViewerControlGroup,
  type ViewerInfoItem,
} from '../components/SplatViewer';
import './Home.css';

const DEFAULT_SPLAT_URL = '/anji.sog';

const sceneInfo: ViewerInfoItem[] = [
  { label: '场景', value: '圆明园遗址' },
  { label: '格式', value: 'SOG v2' },
  { label: '规模', value: '185 万 splats' },
  { label: '渲染', value: 'PlayCanvas GSplat' },
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

const highlights = [
  '本地 SOG 资源直连，适合演示真实交付路径。',
  '界面保留资源状态、格式信息和操作指南，适合分享现场讲解。',
  '控制提示默认展开，避免听众第一次接触时不知道如何交互。',
];

export default function Home() {
  return (
    <section className="home-page">
      <div className="home-glow home-glow-a" />
      <div className="home-glow home-glow-b" />

      <div className="home-stage">
        <section className="home-panel home-copy">
          <div className="home-kicker">3DGS / React / PlayCanvas</div>
          <h1 className="home-title">圆明园 3DGS 在线演示</h1>
          <p className="home-description">
            这一页专门服务分享演示：左侧给出演示重点，右侧直接进入
            GSplat 场景浏览，并在界面中持续保留操作提示和状态反馈。
          </p>

          <div className="home-metric-grid">
            {sceneInfo.map((item) => (
              <div className="home-metric-card" key={item.label}>
                <div className="home-metric-label">{item.label}</div>
                <div className="home-metric-value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="home-section-title">演示细化点</div>
          <ul className="home-highlight-list">
            {highlights.map((item) => (
              <li className="home-highlight-item" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="home-viewer-shell">
          <SplatViewer
            src={DEFAULT_SPLAT_URL}
            title="圆明园场景浏览"
            subtitle="适合分享时现场操作的 3DGS 浏览面板，保留资源信息、状态反馈与操作指南。"
            sceneInfo={sceneInfo}
            operationGroups={operationGroups}
            initialCameraPosition={[862, 432,450]}
            splatTransform={{
              position: [0, 0, 0],
              rotation: [180, 0, 0],
              scale: [1, 1, 1],
            }}
            hintText="建议先滚轮拉远，再沿中轴线缓慢平移，方便展示整体空间关系。"
          />
        </section>
      </div>
    </section>
  );
}

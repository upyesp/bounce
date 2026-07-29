/**
 * Bounce — smoke-test vehicle (+ mobile diagnostics).
 *
 * Scene: ground + four Posts + pinned Cloth + dropped Ball, per orillusion's
 * Sample_Cloth.ts. Desktop renders correctly. On some mobiles the scene
 * renders with wrong colours and physics appears frozen — so this build also
 * surfaces a diagnostic overlay (GPU adapter, limits, engine frame counter,
 * ball height, physics state) so we can read the cause off the screen without
 * a DevTools console.
 *
 * NOTE: published @orillusion/core (0.9.x) is INSTANCE-based — `Engine3D.init()`
 * is a static factory returning an instance; `startRenderView`/`res`/`aspect`
 * are instance members.
 */
import {
  Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent,
  HoverCameraController, Object3D, DirectLight, LitMaterial, MeshRenderer,
  PlaneGeometry, Vector3, Object3DUtil,
} from '@orillusion/core';
import { Physics, Rigidbody, ClothSoftbody } from '@orillusion/physics';

// --- WebGPU feature gate (mirrors the inline check in index.html) ---
if (!navigator.gpu) {
  throw new Error('WebGPU is not available in this browser.');
}

const fpsEl = document.getElementById('fps')!;
const diagEl = document.getElementById('diag')!;
const errorEl = document.getElementById('error')!;

// Diagnostic handles, filled in once the engine / ball exist.
let diagEngine: Engine3D | null = null;
let diagBall: Object3D | null = null;
let gpuText = 'GPU …';

function showError(err: unknown): void {
  errorEl.textContent = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  errorEl.style.display = 'block';
}

// Probe the WebGPU adapter once (does not request a device, so it can't
// interfere with the engine's own device).
async function readGpu(): Promise<void> {
  try {
    const gpu = navigator.gpu as unknown as {
      requestAdapter(): Promise<{
        info?: { vendor?: string; architecture?: string; device?: string; description?: string };
        requestAdapterInfo?: () => Promise<{ vendor?: string; architecture?: string; device?: string; description?: string }>;
        features: { has(name: string): boolean };
        limits: { maxTextureDimension2D: number; maxBufferSize: number };
      } | null>;
    };
    const adapter = await gpu.requestAdapter();
    if (!adapter) { gpuText = 'GPU: no adapter'; return; }
    const info = adapter.info ?? await adapter.requestAdapterInfo?.();
    const f = adapter.features;
    const l = adapter.limits;
    gpuText = [
      `GPU ${info?.vendor ?? '?'}/${info?.architecture ?? '?'}`,
      info?.description ? info.description : (info?.device ?? ''),
      `f32filt=${f.has('float32-filterable')} bgra8store=${f.has('bgra8unorm-storage')}`,
      `maxTex2D=${l.maxTextureDimension2D} maxBuf=${l.maxBufferSize}`,
    ].filter((s) => s.length).join('\n');
  } catch (e) {
    gpuText = 'GPU err: ' + (e as Error).message;
  }
}
void readGpu();

// --- FPS + diag ticker ---
// IMPORTANT: this is an independent rAF loop. It proves the browser is ticking,
// NOT that orillusion is rendering. The engine frame counter below is what
// tells us whether the engine itself is advancing.
let frames = 0;
let last = performance.now();
function tick(): void {
  frames++;
  const now = performance.now();
  if (now - last >= 500) {
    fpsEl.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
    frames = 0;
    last = now;
    const e = diagEngine;
    diagEl.textContent = [
      gpuText,
      e ? `engine frames=${e.frameCount} running=${e.running}` : 'engine: not up',
      diagBall ? `ball.y=${diagBall.y.toFixed(2)}` : 'ball: —',
      `physics.isInited=${Physics.isInited}`,
    ].join('\n');
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

class ClothSmokeTest {
  async run(): Promise<void> {
    try {
      await Physics.init({ useSoftBody: true });
      const engine = await Engine3D.init({ renderLoop: () => Physics.update() });
      diagEngine = engine;

      const view = new View3D();
      view.scene = new Scene3D();
      const sky = view.scene.addComponent(AtmosphericComponent);

      view.camera = CameraUtil.createCamera3DObject(view.scene);
      view.camera.perspective(60, engine.aspect, 1, 1000.0);
      view.camera.object3D
        .addComponent(HoverCameraController)
        .setCamera(0, -30, 20, new Vector3(0, 3, 0));

      const lightObj3D = new Object3D();
      const sunLight = lightObj3D.addComponent(DirectLight);
      sunLight.intensity = 2;
      sunLight.castShadow = true;
      lightObj3D.rotationX = 24;
      lightObj3D.rotationY = -151;
      view.scene.addChild(lightObj3D);
      sky.relativeTransform = lightObj3D.transform;

      engine.startRenderView(view);
      this.createScene(view.scene, engine);
    } catch (err) {
      showError(err);
    }
  }

  private createScene(scene: Scene3D, engine: Engine3D): void {
    const ground = Object3DUtil.GetSingleCube(30, 0, 30, 1, 1, 1);
    scene.addChild(ground);
    const groundRb = ground.addComponent(Rigidbody);
    groundRb.mass = 0;
    groundRb.shape = Rigidbody.collisionShape.createStaticPlaneShape()!;

    this.createShelves(scene);
    this.createCloth(scene, engine);
    this.createBall(scene);
  }

  private createShelves(scene: Scene3D): void {
    const corners = [
      new Vector3(-4, 2.5, -4),
      new Vector3(4, 2.5, -4),
      new Vector3(-4, 2.5, 4),
      new Vector3(4, 2.5, 4),
    ];
    for (const p of corners) {
      const post = Object3DUtil.GetSingleCube(0.5, 5, 0.5, 1, 1, 1);
      post.localPosition = p;
      scene.addChild(post);
    }
  }

  private createCloth(scene: Scene3D, engine: Engine3D): void {
    const cloth = new Object3D();
    const meshRenderer = cloth.addComponent(MeshRenderer);
    meshRenderer.geometry = new PlaneGeometry(8, 8, 20, 20, Vector3.UP);
    const material = new LitMaterial();
    material.baseMap = engine.res.redTexture;
    material.cullMode = 'none';
    meshRenderer.material = material;
    cloth.y = 5;
    scene.addChild(cloth);

    const softBody = cloth.addComponent(ClothSoftbody);
    softBody.mass = 1;
    softBody.margin = 0.2;
    softBody.fixNodeIndices = ['leftTop', 'rightTop', 'leftBottom', 'rightBottom'];
  }

  private createBall(scene: Scene3D): void {
    const ball = Object3DUtil.GetSingleSphere(1, 0.5, 0.2, 0.8);
    ball.y = 10;
    scene.addChild(ball);
    diagBall = ball;
    const rigidbody = ball.addComponent(Rigidbody);
    rigidbody.mass = 1.6;
    rigidbody.shape = Rigidbody.collisionShape.createShapeFromObject(ball)!;
  }
}

new ClothSmokeTest().run();

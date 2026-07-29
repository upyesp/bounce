/**
 * Bounce — smoke-test vehicle.
 *
 * Faithful adaptation of orillusion's official `samples/physics/Sample_Cloth.ts`
 * (debug UI removed): a ground, four Posts, a Cloth whose four corners are pinned,
 * and a Ball dropped onto it. The point of this build is NOT the game yet — it is
 * to validate, on a real mid-range phone, that orillusion's WebGPU renderer +
 * Ammo.js soft-body cloth physics perform acceptably before we build on top of it.
 *
 * NOTE: the published @orillusion/core (0.9.x) is INSTANCE-based. `Engine3D.init()`
 * is a static factory that RETURNS an engine instance; `startRenderView`, `res`
 * and `aspect` are instance members on it. The monorepo sample calls them
 * statically, which does NOT work against the published package.
 *
 * See docs/adr/0001-orillusion-webgpu-only.md and CONTEXT.md.
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

// --- tiny FPS readout for the perf smoke-test ---
// NOTE: this is an independent rAF loop. It proves the browser is ticking, NOT
// that orillusion is rendering. A black screen + 60fps means the engine threw.
const fpsEl = document.getElementById('fps')!;
let frames = 0;
let last = performance.now();
function tickFps(): void {
  frames++;
  const now = performance.now();
  if (now - last >= 500) {
    fpsEl.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
    frames = 0;
    last = now;
  }
  requestAnimationFrame(tickFps);
}
requestAnimationFrame(tickFps);

// --- on-screen error surface (mobile has no DevTools console) ---
function showError(err: unknown): void {
  const el = document.getElementById('error')!;
  el.textContent = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  el.style.display = 'block';
}

class ClothSmokeTest {
  async run(): Promise<void> {
    try {
      await Physics.init({ useSoftBody: true });

      // Engine3D.init is a static factory returning an engine INSTANCE.
      const engine = await Engine3D.init({ renderLoop: () => Physics.update() });

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
    // Ground (static collider).
    const ground = Object3DUtil.GetSingleCube(30, 0, 30, 1, 1, 1);
    scene.addChild(ground);
    const groundRb = ground.addComponent(Rigidbody);
    groundRb.mass = 0;
    groundRb.shape = Rigidbody.collisionShape.createStaticPlaneShape()!;

    this.createShelves(scene); // the four Posts — visual anchors at the Cloth corners
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

    // Pin the four corners — this is the "frame" the Cloth is stretched on.
    const softBody = cloth.addComponent(ClothSoftbody);
    softBody.mass = 1;
    softBody.margin = 0.2;
    softBody.fixNodeIndices = ['leftTop', 'rightTop', 'leftBottom', 'rightBottom'];
  }

  private createBall(scene: Scene3D): void {
    const ball = Object3DUtil.GetSingleSphere(1, 0.5, 0.2, 0.8);
    ball.y = 10;
    scene.addChild(ball);
    const rigidbody = ball.addComponent(Rigidbody);
    rigidbody.mass = 1.6;
    rigidbody.shape = Rigidbody.collisionShape.createShapeFromObject(ball)!;
  }
}

new ClothSmokeTest().run();

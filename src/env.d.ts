// Minimal ambient shims so `tsc` passes against APIs the shipped type defs don't yet declare.

// WebGPU isn't in the standard DOM lib yet — declare just enough for feature detection.
// Replace with the `@webgpu/types` package once we use real GPU APIs (adapter/device/queue).
interface Navigator {
  gpu?: unknown;
}

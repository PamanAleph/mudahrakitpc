/**
 * Tiny semi-implicit spring integrator for per-frame 3D animation.
 * Underdamped settings give the small overshoot that makes latches and
 * pressed parts feel physical; critically damped settings just glide.
 */
export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

export function createSpring(value = 0): SpringState {
  return { value, velocity: 0 };
}

export function stepSpring(state: SpringState, target: number, dt: number, config: SpringConfig): number {
  // Sub-step so large frame gaps don't explode the integration.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const force = -config.stiffness * (state.value - target) - config.damping * state.velocity;
    state.velocity += force * h;
    state.value += state.velocity * h;
  }
  return state.value;
}

export function snapSpring(state: SpringState, value: number): void {
  state.value = value;
  state.velocity = 0;
}

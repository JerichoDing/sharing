# SOG Default Auto-Orbit Design

## Goal

Make loaded `.sog` assets start with camera auto-orbit enabled by default, while preserving the current manual camera controls and existing behavior for non-`.sog` assets.

## Scope

- Enable automatic camera orbit only when the current `src` resolves to a `.sog` asset.
- Start orbiting only after the asset has loaded successfully.
- Orbit around the active splat transform position.
- Stop the automatic orbit immediately after the first user interaction that indicates manual control intent.

## Non-Goals

- No model self-rotation.
- No changes to third-party PlayCanvas source files.
- No change to the current manual orbit / pan / zoom control scheme.
- No new UI controls for toggling auto-orbit in this task.

## Design

The viewer will keep using PlayCanvas `CameraControls` for manual interaction. A local auto-orbit layer will be added in `SplatViewer.tsx` and run through the PlayCanvas update loop.

When auto-orbit is active, the camera will move on the horizontal plane around the current model center while preserving its initial height offset and horizontal radius. Each frame it will update the camera position and call `lookAt` toward the target point.

Auto-orbit will default to `true` for `.sog` URLs and `false` for other formats. The logic will be expressed through small pure helper functions so the enabling conditions and orbit math can be unit-tested without booting the full viewer.

## Failure Handling

- If the asset is still loading or fails to load, auto-orbit remains inactive.
- If the initial camera is already directly above the target and a stable horizontal orbit radius cannot be derived, the orbit layer will stay inactive instead of forcing a broken path.
- Once the user interacts through pointer, wheel, touch, or keyboard input, auto-orbit stops for the current scene instance.

## Testing

- Add unit tests for `.sog` detection.
- Add unit tests for the auto-orbit activation guard.
- Add unit tests for deriving and advancing orbit state.
- Run lint and production build after implementation.

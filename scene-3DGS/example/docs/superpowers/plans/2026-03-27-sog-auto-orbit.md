# SOG Auto-Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `.sog` assets start with camera auto-orbit enabled by default and stop orbiting on first manual interaction.

**Architecture:** Keep the existing PlayCanvas `CameraControls` script for manual input and add a local auto-orbit layer in the viewer. Move the defaulting logic and orbit math into a focused helper module so behavior can be covered with small unit tests.

**Tech Stack:** React 19, TypeScript, Vite, PlayCanvas, Vitest

---

### Task 1: Add minimal test infrastructure and failing helper tests

**Files:**
- Modify: `package.json`
- Create: `src/components/splatAutoOrbit.ts`
- Create: `src/components/splatAutoOrbit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  advanceAutoOrbit,
  createAutoOrbitState,
  shouldEnableAutoOrbitByDefault,
  shouldRunAutoOrbit,
} from './splatAutoOrbit';

describe('shouldEnableAutoOrbitByDefault', () => {
  it('enables auto orbit for sog assets', () => {
    expect(shouldEnableAutoOrbitByDefault('/scene.sog')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/splatAutoOrbit.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function shouldEnableAutoOrbitByDefault(src: string) {
  return src.toLowerCase().endsWith('.sog');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/splatAutoOrbit.test.ts`
Expected: PASS for the first helper test.

- [ ] **Step 5: Expand tests for activation guard and orbit math**

Add cases for:
- loading incomplete -> false
- user already interacted -> false
- valid camera/target -> orbit state created
- positive dt advances orbit position while preserving radius and height

### Task 2: Integrate auto-orbit into the viewer

**Files:**
- Modify: `src/components/SplatViewer.tsx`
- Test: `src/components/splatAutoOrbit.test.ts`

- [ ] **Step 1: Write the failing test**

Use helper tests to describe the final enablement rules and orbit step calculations before integration code changes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/splatAutoOrbit.test.ts`
Expected: FAIL for the newly added helper assertions.

- [ ] **Step 3: Write minimal implementation**

Implement:
- viewer-level default `autoOrbit` decision based on `src`
- user-interaction tracking that disables auto-orbit
- PlayCanvas update hook that advances camera orbit after load

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/splatAutoOrbit.test.ts`
Expected: PASS

- [ ] **Step 5: Verify the app still builds**

Run: `npm run build`
Expected: production build succeeds

### Task 3: Verify and tidy

**Files:**
- Modify: `src/components/SplatViewer.tsx`
- Modify: `package-lock.json`

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: exit code 0

- [ ] **Step 2: Run full test command**

Run: `npm test`
Expected: all tests pass

- [ ] **Step 3: Run final build verification**

Run: `npm run build`
Expected: exit code 0

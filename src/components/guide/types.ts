import type { ReactElement } from 'react';

export interface GuidePhase {
  /** Start of the phase, as a fraction of the loop */
  at: number;
  text: string;
}

export interface GuideStep {
  id: string;
  title: string;
  /** Short name for the step list */
  short: string;
  /** Loop length, ms */
  duration: number;
  phases: GuidePhase[];
  /** One practical warning shown under the actions */
  tip: string;
  /** Track name → keyframes; elements opt in with data-t */
  tracks: Record<string, Keyframe[]>;
  Art: () => ReactElement;
}

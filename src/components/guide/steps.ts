import { cpu, prep, ram } from './scenes-1';
import { board, boot, cooler, gpu, m2, psu } from './scenes-2';
import type { GuideStep } from './types';

/** Order follows a real build: everything that fits on the board goes on before the board goes into the case */
export const guideSteps: GuideStep[] = [prep, cpu, ram, cooler, m2, board, psu, gpu, boot];

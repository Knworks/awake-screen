export const awakeLabel = 'Awake';

export const awakeStateValues = ['off', 'starting', 'on', 'error'] as const;

export type AwakeState = typeof awakeStateValues[number];

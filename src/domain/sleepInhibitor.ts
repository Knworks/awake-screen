export type SleepInhibitorErrorCode =
	| 'unsupported-os'
	| 'command-missing'
	| 'start-failed'
	| 'stop-failed';

export interface SleepInhibitor {
	start(): Promise<void>;
	stop(): Promise<void>;
}

export class SleepInhibitorError extends Error {
	public readonly code: SleepInhibitorErrorCode;
	public readonly retryable: boolean;
	public readonly cause: unknown;

	constructor(
		message: string,
		options: {
			code: SleepInhibitorErrorCode;
			retryable: boolean;
			cause?: unknown;
		},
	) {
		super(message);
		this.name = 'SleepInhibitorError';
		this.code = options.code;
		this.retryable = options.retryable;
		this.cause = options.cause;
	}
}

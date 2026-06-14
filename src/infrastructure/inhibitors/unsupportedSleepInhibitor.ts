import { SleepInhibitor, SleepInhibitorError } from '../../domain/sleepInhibitor';

export class UnsupportedSleepInhibitor implements SleepInhibitor {
	public constructor(private readonly platform: NodeJS.Platform) {}

	public async start(): Promise<void> {
		throw new SleepInhibitorError(`Keep Awake does not support ${this.platform}.`, {
			code: 'unsupported-os',
			retryable: false,
		});
	}

	public async stop(): Promise<void> {
		return;
	}
}

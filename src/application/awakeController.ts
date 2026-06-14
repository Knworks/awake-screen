import { AwakeState } from '../domain/awakeState';
import { SleepInhibitor } from '../domain/sleepInhibitor';
import { AwakeStatePresenter } from '../ui/statusBarController';
import { formatStartError } from './errorMessages';

export interface ErrorNotifier {
	showError(message: string): Thenable<string | undefined> | Promise<string | undefined>;
}

export interface LoggerLike {
	error(message: string, error?: unknown): void;
}

export class AwakeController {
	private state: AwakeState = 'off';

	public constructor(
		private readonly presenter: AwakeStatePresenter,
		private readonly inhibitor: SleepInhibitor,
		private readonly notifier: ErrorNotifier,
		private readonly logger: LoggerLike,
	) {
		this.presenter.setState(this.state);
	}

	public getState(): AwakeState {
		return this.state;
	}

	public async toggle(): Promise<void> {
		switch (this.state) {
			case 'on':
				await this.disable();
				return;
			case 'off':
			case 'error':
				await this.enable();
				return;
			case 'starting':
				return;
		}
	}

	public async enable(): Promise<void> {
		if (this.state === 'starting' || this.state === 'on') {
			return;
		}

		this.setState('starting');

		try {
			await this.inhibitor.start();
			this.setState('on');
		} catch (error) {
			this.setState('error');
			await this.notifier.showError(formatStartError(error));
		}
	}

	public async disable(): Promise<void> {
		if (this.state !== 'on') {
			if (this.state !== 'starting') {
				this.setState('off');
			}
			return;
		}

		await this.stopAndReset();
	}

	public async deactivate(): Promise<void> {
		await this.stopAndReset();
	}

	private async stopAndReset(): Promise<void> {
		try {
			await this.inhibitor.stop();
		} catch (error) {
			this.logger.error('Failed to stop sleep inhibitor.', error);
		} finally {
			this.setState('off');
		}
	}

	private setState(state: AwakeState): void {
		this.state = state;
		this.presenter.setState(state);
	}
}

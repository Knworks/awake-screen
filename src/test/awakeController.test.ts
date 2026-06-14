import * as assert from 'assert';
import { AwakeController, ErrorNotifier, LoggerLike } from '../application/awakeController';
import { SleepInhibitor, SleepInhibitorError } from '../domain/sleepInhibitor';
import { AwakeStatePresenter } from '../ui/statusBarController';

class RecordingPresenter implements AwakeStatePresenter {
	public readonly states: string[] = [];

	public setState(state: string): void {
		this.states.push(state);
	}
}

class FakeNotifier implements ErrorNotifier {
	public readonly messages: string[] = [];

	public async showError(message: string): Promise<string | undefined> {
		this.messages.push(message);
		return undefined;
	}
}

class FakeLogger implements LoggerLike {
	public readonly entries: string[] = [];

	public error(message: string): void {
		this.entries.push(message);
	}
}

class FakeSleepInhibitor implements SleepInhibitor {
	public startCalls = 0;
	public stopCalls = 0;
	public startHandler: () => Promise<void> = async () => undefined;
	public stopHandler: () => Promise<void> = async () => undefined;

	public start(): Promise<void> {
		this.startCalls += 1;
		return this.startHandler();
	}

	public stop(): Promise<void> {
		this.stopCalls += 1;
		return this.stopHandler();
	}
}

suite('AwakeController', () => {
	test('enable transitions from off to on', async () => {
		const presenter = new RecordingPresenter();
		const inhibitor = new FakeSleepInhibitor();
		const notifier = new FakeNotifier();
		const logger = new FakeLogger();
		const controller = new AwakeController(presenter, inhibitor, notifier, logger);

		await controller.enable();

		assert.deepStrictEqual(presenter.states, ['off', 'starting', 'on']);
		assert.strictEqual(controller.getState(), 'on');
		assert.strictEqual(inhibitor.startCalls, 1);
		assert.deepStrictEqual(notifier.messages, []);
	});

	test('toggle ignores reentry during starting', async () => {
		const presenter = new RecordingPresenter();
		const inhibitor = new FakeSleepInhibitor();
		let releaseStart: (() => void) | undefined;
		inhibitor.startHandler = () => new Promise<void>((resolve) => {
			releaseStart = resolve;
		});
		const notifier = new FakeNotifier();
		const logger = new FakeLogger();
		const controller = new AwakeController(presenter, inhibitor, notifier, logger);

		const enablePromise = controller.enable();
		await controller.toggle();
		releaseStart?.();
		await enablePromise;

		assert.strictEqual(inhibitor.startCalls, 1);
		assert.deepStrictEqual(presenter.states, ['off', 'starting', 'on']);
	});

	test('failed start transitions to error and notifies user', async () => {
		const presenter = new RecordingPresenter();
		const inhibitor = new FakeSleepInhibitor();
		inhibitor.startHandler = async () => {
			throw new SleepInhibitorError('systemd-inhibit is not available.', {
				code: 'command-missing',
				retryable: true,
			});
		};
		const notifier = new FakeNotifier();
		const logger = new FakeLogger();
		const controller = new AwakeController(presenter, inhibitor, notifier, logger);

		await controller.enable();

		assert.deepStrictEqual(presenter.states, ['off', 'starting', 'error']);
		assert.strictEqual(controller.getState(), 'error');
		assert.strictEqual(notifier.messages[0], 'systemd-inhibit is not available. Install the required OS command and try again.');
	});

	test('disable stops inhibitor and returns to off', async () => {
		const presenter = new RecordingPresenter();
		const inhibitor = new FakeSleepInhibitor();
		const notifier = new FakeNotifier();
		const logger = new FakeLogger();
		const controller = new AwakeController(presenter, inhibitor, notifier, logger);

		await controller.enable();
		await controller.disable();

		assert.deepStrictEqual(presenter.states, ['off', 'starting', 'on', 'off']);
		assert.strictEqual(inhibitor.stopCalls, 1);
		assert.strictEqual(controller.getState(), 'off');
	});

	test('deactivate resets to off even if stop fails', async () => {
		const presenter = new RecordingPresenter();
		const inhibitor = new FakeSleepInhibitor();
		inhibitor.stopHandler = async () => {
			throw new SleepInhibitorError('stop failed', {
				code: 'stop-failed',
				retryable: false,
			});
		};
		const notifier = new FakeNotifier();
		const logger = new FakeLogger();
		const controller = new AwakeController(presenter, inhibitor, notifier, logger);

		await controller.enable();
		await controller.deactivate();

		assert.strictEqual(controller.getState(), 'off');
		assert.strictEqual(logger.entries.length, 1);
		assert.deepStrictEqual(notifier.messages, []);
	});
});

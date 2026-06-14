import * as assert from 'assert';
import { LinuxSleepInhibitor } from '../infrastructure/inhibitors/linuxSleepInhibitor';
import { ChildProcessFacade } from '../infrastructure/process/childProcessFacade';
import { SleepInhibitorError } from '../domain/sleepInhibitor';
import { FakeChildProcess } from './helpers/fakeChildProcess';

suite('LinuxSleepInhibitor', () => {
	test('starts systemd-inhibit with the expected arguments', async () => {
		const child = new FakeChildProcess();
		const facade: ChildProcessFacade = {
			spawn(command, args) {
				assert.strictEqual(command, 'systemd-inhibit');
				assert.deepStrictEqual(args, ['--what=idle:sleep', '--why=AwakeScreen', 'sleep', '2147483647']);
				setImmediate(() => child.emit('spawn'));
				return child;
			},
		};

		const inhibitor = new LinuxSleepInhibitor(facade);
		await inhibitor.start();
		await inhibitor.stop();

		assert.strictEqual(child.killed, true);
	});

	test('surfaces a missing command as a retryable error', async () => {
		const child = new FakeChildProcess();
		const missingError = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
		const facade: ChildProcessFacade = {
			spawn() {
				setImmediate(() => child.emit('error', missingError));
				return child;
			},
		};

		const inhibitor = new LinuxSleepInhibitor(facade);

		await assert.rejects(() => inhibitor.start(), (error: unknown) => {
			assert.ok(error instanceof SleepInhibitorError);
			assert.strictEqual(error.code, 'command-missing');
			return true;
		});
	});
});

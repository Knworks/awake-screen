import * as assert from 'assert';
import { MacosSleepInhibitor } from '../infrastructure/inhibitors/macosSleepInhibitor';
import { ChildProcessFacade } from '../infrastructure/process/childProcessFacade';
import { FakeChildProcess } from './helpers/fakeChildProcess';

suite('MacosSleepInhibitor', () => {
	test('starts caffeinate and stops it', async () => {
		const child = new FakeChildProcess();
		const facade: ChildProcessFacade = {
			spawn(command, args) {
				assert.strictEqual(command, 'caffeinate');
				assert.deepStrictEqual(args, ['-d', '-i']);
				setImmediate(() => child.emit('spawn'));
				return child;
			},
		};

		const inhibitor = new MacosSleepInhibitor(facade);
		await inhibitor.start();
		await inhibitor.stop();

		assert.strictEqual(child.killed, true);
	});

	test('treats an early exit after spawn as a start failure', async () => {
		const child = new FakeChildProcess();
		const facade: ChildProcessFacade = {
			spawn() {
				setImmediate(() => {
					child.emit('spawn');
					child.emit('exit', 1, null);
				});
				return child;
			},
		};

		const inhibitor = new MacosSleepInhibitor(facade);

		await assert.rejects(() => inhibitor.start(), /exited before sleep prevention was established/);
	});
});

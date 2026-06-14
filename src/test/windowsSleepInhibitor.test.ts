import * as assert from 'assert';
import { WindowsSleepInhibitor } from '../infrastructure/inhibitors/windowsSleepInhibitor';
import { ChildProcessFacade, nodeChildProcessFacade } from '../infrastructure/process/childProcessFacade';
import { FakeChildProcess } from './helpers/fakeChildProcess';

suite('WindowsSleepInhibitor', () => {
	test('spawns a hidden powershell helper', async () => {
		const child = new FakeChildProcess();
		const facade: ChildProcessFacade = {
			spawn(command, args) {
				assert.strictEqual(command, 'powershell.exe');
				assert.ok(args.includes('-WindowStyle'));
				assert.ok(args.includes('Hidden'));
				assert.ok(args.includes('-Command'));
				const script = args.at(-1);
				assert.ok(script?.includes('SetThreadExecutionState'));
				assert.ok(script?.includes('[uint32]2147483651'));
				assert.ok(script?.includes('[uint32]2147483648'));
				assert.ok(script?.includes('\n'));
				setImmediate(() => child.emit('spawn'));
				return child;
			},
		};

		const inhibitor = new WindowsSleepInhibitor(facade);
		await inhibitor.start();
		await inhibitor.stop();

		assert.strictEqual(child.killed, true);
	});

	test('starts the real powershell helper without exiting immediately on windows', async function() {
		if (process.platform !== 'win32') {
			this.skip();
		}

		const inhibitor = new WindowsSleepInhibitor(nodeChildProcessFacade);
		await inhibitor.start();
		await inhibitor.stop();
	});
});

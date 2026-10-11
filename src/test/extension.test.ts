import * as assert from 'assert';
import * as vscode from 'vscode';
import { AwakeExtensionApi, createAwakeExtension } from '../extension';
import { SleepInhibitor } from '../domain/sleepInhibitor';
import { StatusBarItemLike } from '../ui/statusBarController';

suite('Extension integration', () => {
	async function getExtension(): Promise<vscode.Extension<AwakeExtensionApi>> {
		const extension = vscode.extensions.getExtension<AwakeExtensionApi>('Knworks.awake-screen');
		assert.ok(extension);
		return extension;
	}

	async function getApi(): Promise<AwakeExtensionApi> {
		const extension = await getExtension();
		return extension.activate();
	}

	test('registers commands and initializes the off state', async () => {
		const api = await getApi();

		const commands = await vscode.commands.getCommands(true);
		const statusBar = api.getStatusBarSnapshot();

		assert.strictEqual(statusBar.text, '$(vm-outline) Awake');
		assert.strictEqual(statusBar.command, 'awake-screen.toggle');
		assert.ok(commands.includes('awake-screen.toggle'));
		assert.ok(commands.includes('awake-screen.enable'));
		assert.ok(commands.includes('awake-screen.disable'));
		assert.strictEqual(api.controller.getState(), 'off');
	});

	test('deactivate stops the active inhibitor', async () => {
		const extension = await getExtension();
		const api = await extension.activate();

		await extension.exports.deactivate();

		assert.strictEqual(api.controller.getState(), 'off');
		assert.strictEqual(api.getStatusBarSnapshot().text, '$(vm-outline) Awake');
	});

	suite('Startup setting', () => {
		let api: AwakeExtensionApi | undefined;
		let subscriptions: vscode.Disposable[];
		let startCount: number;
		let stopCount: number;
		let errors: string[];
		let inhibitor: SleepInhibitor;

		setup(async () => {
			await (await getApi()).deactivate();
			api = undefined;
			subscriptions = [];
			startCount = 0;
			stopCount = 0;
			errors = [];
			inhibitor = {
				start: async () => { startCount++; },
				stop: async () => { stopCount++; },
			};
		});

		teardown(async () => {
			await api?.deactivate();
		});

		async function create(enableOnStartup?: boolean): Promise<AwakeExtensionApi> {
			const statusBar: StatusBarItemLike = { text: '', show: () => {}, dispose: () => {} };
			api = await createAwakeExtension({ subscriptions } as vscode.ExtensionContext, {
				enableOnStartup,
				sleepInhibitor: inhibitor,
				createStatusBarItem: () => statusBar,
				errorNotifier: { showError: async (message) => { errors.push(message); return undefined; } },
			});
			return api;
		}

		test('defaults to false and leaves sleep prevention off', async () => {
			const configuration = vscode.workspace.getConfiguration('awake-screen');
			assert.strictEqual(configuration.inspect<boolean>('enableOnStartup')?.defaultValue, false);
			const extension = await create();
			assert.strictEqual(extension.controller.getState(), 'off');
			assert.strictEqual(startCount, 0);
		});

		test('false leaves sleep prevention off and commands remain usable', async () => {
			const extension = await create(false);
			assert.strictEqual(extension.controller.getState(), 'off');
			assert.strictEqual(startCount, 0);
			await vscode.commands.executeCommand('awake-screen.enable');
			assert.strictEqual(extension.controller.getState(), 'on');
			await vscode.commands.executeCommand('awake-screen.disable');
			assert.strictEqual(extension.controller.getState(), 'off');
		});

		test('true enables at startup and permits manual disable and re-enable', async () => {
			const extension = await create(true);
			assert.strictEqual(startCount, 1);
			assert.strictEqual(extension.controller.getState(), 'on');
			assert.strictEqual(extension.getStatusBarSnapshot().text, '$(vm-pending) Awake');
			await vscode.commands.executeCommand('awake-screen.enable');
			assert.strictEqual(startCount, 1);
			await vscode.commands.executeCommand('awake-screen.disable');
			assert.strictEqual(extension.controller.getState(), 'off');
			assert.strictEqual(stopCount, 1);
			await vscode.commands.executeCommand('awake-screen.toggle');
			assert.strictEqual(extension.controller.getState(), 'on');
			assert.strictEqual(startCount, 2);
		});

		test('reads user settings on startup and defers changes until the next startup', async () => {
			const configuration = vscode.workspace.getConfiguration('awake-screen');
			const previous = configuration.inspect<boolean>('enableOnStartup')?.globalValue;
			try {
				await configuration.update('enableOnStartup', true, vscode.ConfigurationTarget.Global);
				const extension = await create();
				assert.strictEqual(extension.controller.getState(), 'on');
				await configuration.update('enableOnStartup', false, vscode.ConfigurationTarget.Global);
				assert.strictEqual(extension.controller.getState(), 'on');
				await extension.deactivate();
				const nextExtension = await create();
				assert.strictEqual(nextExtension.controller.getState(), 'off');
			} finally {
				await configuration.update('enableOnStartup', previous, vscode.ConfigurationTarget.Global);
			}
		});

		test('startup failure shows a warning and permits manual retry', async () => {
			inhibitor.start = async () => {
				startCount++;
				if (startCount === 1) {
					throw new Error('Startup failed');
				}
			};
			const extension = await create(true);
			assert.strictEqual(extension.controller.getState(), 'error');
			assert.strictEqual(extension.getStatusBarSnapshot().text, '$(warning) Awake');
			assert.strictEqual(errors.length, 1);
			await vscode.commands.executeCommand('awake-screen.toggle');
			assert.strictEqual(extension.controller.getState(), 'on');
		});

		test('shutdown waits for automatic startup before stopping the inhibitor', async () => {
			let finishStart!: () => void;
			inhibitor.start = () => new Promise<void>((resolve) => { finishStart = resolve; });
			const activation = create(true);
			const cleanup = subscriptions[subscriptions.length - 1];
			const shutdown = Promise.resolve(cleanup.dispose());
			await Promise.resolve();
			assert.strictEqual(stopCount, 0);
			finishStart();
			const extension = await activation;
			await shutdown;
			assert.strictEqual(stopCount, 1);
			assert.strictEqual(extension.controller.getState(), 'off');
		});
	});
});

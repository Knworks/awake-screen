import * as assert from 'assert';
import * as vscode from 'vscode';
import { AwakeExtensionApi } from '../extension';

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
});

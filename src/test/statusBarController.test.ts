import * as assert from 'assert';
import { getStatusBarPresentation, StatusBarController, StatusBarItemLike } from '../ui/statusBarController';

class FakeStatusBarItem implements StatusBarItemLike {
	public text = '';
	public tooltip = '';
	public command: string | undefined;
	public shown = false;
	public disposed = false;

	public show(): void {
		this.shown = true;
	}

	public dispose(): void {
		this.disposed = true;
	}
}

suite('StatusBarController', () => {
	test('initialize shows the off state', () => {
		const item = new FakeStatusBarItem();
		const controller = new StatusBarController(item);

		controller.initialize();

		assert.strictEqual(item.text, '$(vm-outline) Awake');
		assert.strictEqual(item.command, 'awake-screen.toggle');
		assert.strictEqual(item.shown, true);
	});

	test('starting state removes the command', () => {
		const item = new FakeStatusBarItem();
		const controller = new StatusBarController(item);

		controller.setState('starting');

		assert.strictEqual(item.command, undefined);
		assert.strictEqual(item.text, '$(loading~spin) Awake');
	});

	test('presentation map stays aligned with the four states', () => {
		const off = getStatusBarPresentation('off');
		const on = getStatusBarPresentation('on');
		const error = getStatusBarPresentation('error');

		assert.strictEqual(off.tooltip, 'Keep Awake is off. Click to enable sleep prevention.');
		assert.strictEqual(on.text, '$(vm-pending) Awake');
		assert.strictEqual(error.command, 'awake-screen.toggle');
	});
});

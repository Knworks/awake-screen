import * as vscode from 'vscode';
import { AwakeController, ErrorNotifier, LoggerLike } from './application/awakeController';
import { SleepInhibitor } from './domain/sleepInhibitor';
import { createSleepInhibitor } from './infrastructure/inhibitors/createSleepInhibitor';
import { nodeChildProcessFacade, ChildProcessFacade } from './infrastructure/process/childProcessFacade';
import { StatusBarController, StatusBarItemLike } from './ui/statusBarController';

export interface AwakeExtensionDependencies {
	platform?: NodeJS.Platform;
	processFacade?: ChildProcessFacade;
	createStatusBarItem?: () => StatusBarItemLike;
	errorNotifier?: ErrorNotifier;
	logger?: LoggerLike;
	sleepInhibitor?: SleepInhibitor;
}

interface ResolvedAwakeExtensionDependencies {
	platform: NodeJS.Platform;
	processFacade: ChildProcessFacade;
	createStatusBarItem: () => StatusBarItemLike;
	errorNotifier: ErrorNotifier;
	logger: LoggerLike;
	sleepInhibitor?: SleepInhibitor;
}

export interface AwakeExtensionApi {
	readonly controller: AwakeController;
	deactivate(): Promise<void>;
	getStatusBarSnapshot(): { text: string; tooltip: string; command?: string };
}

class WindowErrorNotifier implements ErrorNotifier {
	public showError(message: string): Thenable<string | undefined> {
		return vscode.window.showErrorMessage(message);
	}
}

class ConsoleLogger implements LoggerLike {
	public error(message: string, error?: unknown): void {
		console.error(message, error);
	}
}

class AwakeExtension implements AwakeExtensionApi {
	public readonly controller: AwakeController;
	private readonly statusBarController: StatusBarController;
	private readonly commandDisposables: vscode.Disposable[] = [];

	public constructor(dependencies: ResolvedAwakeExtensionDependencies) {
		this.statusBarController = new StatusBarController(dependencies.createStatusBarItem());
		this.statusBarController.initialize();
		const inhibitor = dependencies.sleepInhibitor ?? createSleepInhibitor(dependencies.platform, dependencies.processFacade);
		this.controller = new AwakeController(
			this.statusBarController,
			inhibitor,
			dependencies.errorNotifier,
			dependencies.logger,
		);
	}

	public setCommandDisposables(disposables: vscode.Disposable[]): void {
		this.commandDisposables.push(...disposables);
	}

	public async deactivate(): Promise<void> {
		await this.controller.deactivate();
		this.statusBarController.dispose();
		this.commandDisposables.forEach((disposable) => disposable.dispose());
	}

	public getStatusBarSnapshot(): { text: string; tooltip: string; command?: string } {
		return this.statusBarController.getSnapshot();
	}
}

let activeExtension: AwakeExtensionApi | undefined;

function resolveDependencies(overrides: AwakeExtensionDependencies = {}): ResolvedAwakeExtensionDependencies {
	return {
		platform: overrides.platform ?? process.platform,
		processFacade: overrides.processFacade ?? nodeChildProcessFacade,
		createStatusBarItem: overrides.createStatusBarItem ?? (() => vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)),
		errorNotifier: overrides.errorNotifier ?? new WindowErrorNotifier(),
		logger: overrides.logger ?? new ConsoleLogger(),
		sleepInhibitor: overrides.sleepInhibitor,
	};
}

export function createAwakeExtension(
	context: vscode.ExtensionContext,
	overrides: AwakeExtensionDependencies = {},
): AwakeExtensionApi {
	const dependencies = resolveDependencies(overrides);
	const extension = new AwakeExtension(dependencies);
	const commandDisposables = [
		vscode.commands.registerCommand('awake-screen.toggle', async () => extension.controller.toggle()),
		vscode.commands.registerCommand('awake-screen.enable', async () => extension.controller.enable()),
		vscode.commands.registerCommand('awake-screen.disable', async () => extension.controller.disable()),
	];
	commandDisposables.forEach((disposable) => context.subscriptions.push(disposable));
	extension.setCommandDisposables(commandDisposables);
	context.subscriptions.push({ dispose: () => extension.deactivate() });
	return extension;
}

export function activate(context: vscode.ExtensionContext): AwakeExtensionApi {
	activeExtension = createAwakeExtension(context);
	return activeExtension;
}

export async function deactivate(): Promise<void> {
	if (activeExtension === undefined) {
		return;
	}

	const extension = activeExtension;
	activeExtension = undefined;
	await extension.deactivate();
}

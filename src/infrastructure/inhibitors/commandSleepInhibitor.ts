import { SpawnOptionsWithoutStdio } from 'child_process';
import { SleepInhibitor, SleepInhibitorError } from '../../domain/sleepInhibitor';
import { ChildProcessFacade, ChildProcessLike } from '../process/childProcessFacade';

function toSleepInhibitorError(command: string, error: unknown): SleepInhibitorError {
	if (error instanceof SleepInhibitorError) {
		return error;
	}

	if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
		return new SleepInhibitorError(`${command} is not available.`, {
			code: 'command-missing',
			retryable: true,
			cause: error,
		});
	}

	const message = error instanceof Error && error.message.trim().length > 0
		? error.message
		: `Failed to start ${command}.`;

	return new SleepInhibitorError(message, {
		code: 'start-failed',
		retryable: true,
		cause: error,
	});
}

export interface CommandSleepInhibitorOptions {
	command: string;
	args: readonly string[];
	spawnOptions?: SpawnOptionsWithoutStdio;
	processFacade: ChildProcessFacade;
	startupProbeMs?: number;
}

export class CommandSleepInhibitor implements SleepInhibitor {
	private runningProcess: ChildProcessLike | undefined;

	public constructor(private readonly options: CommandSleepInhibitorOptions) {}

	public async start(): Promise<void> {
		if (this.runningProcess !== undefined) {
			return;
		}

		const child = this.options.processFacade.spawn(
			this.options.command,
			this.options.args,
			this.options.spawnOptions,
		);

		await new Promise<void>((resolve, reject) => {
			let settled = false;
			let startupTimer: NodeJS.Timeout | undefined;

			const clearStartupTimer = (): void => {
				if (startupTimer !== undefined) {
					clearTimeout(startupTimer);
					startupTimer = undefined;
				}
			};

			child.once('spawn', () => {
				if (settled) {
					return;
				}

				startupTimer = setTimeout(() => {
					if (settled) {
						return;
					}

					settled = true;
					this.runningProcess = child;
					resolve();
				}, this.options.startupProbeMs ?? 200);
			});

			child.once('error', (error) => {
				if (settled) {
					return;
				}

				settled = true;
				clearStartupTimer();
				reject(toSleepInhibitorError(this.options.command, error));
			});

			child.once('exit', (code, signal) => {
				clearStartupTimer();

				if (!settled) {
					settled = true;
					reject(new SleepInhibitorError(
						`${this.options.command} exited before sleep prevention was established (code: ${code ?? 'null'}, signal: ${signal ?? 'none'}).`,
						{
							code: 'start-failed',
							retryable: true,
						},
					));
				}

				if (this.runningProcess === child) {
					this.runningProcess = undefined;
				}
			});
		});
	}

	public async stop(): Promise<void> {
		if (this.runningProcess === undefined) {
			return;
		}

		const child = this.runningProcess;
		this.runningProcess = undefined;

		if (child.exitCode !== null) {
			return;
		}

		const killed = child.kill();
		if (!killed) {
			throw new SleepInhibitorError(`Failed to stop ${this.options.command}.`, {
				code: 'stop-failed',
				retryable: false,
			});
		}
	}
}

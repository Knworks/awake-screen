import { ChildProcess, spawn as nodeSpawn, SpawnOptionsWithoutStdio } from 'child_process';

export interface ChildProcessLike {
	readonly exitCode: number | null;
	readonly pid?: number;
	kill(signal?: NodeJS.Signals | number): boolean;
	once(event: 'spawn', listener: () => void): this;
	once(event: 'error', listener: (error: Error) => void): this;
	once(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
}

export interface ChildProcessFacade {
	spawn(command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessLike;
}

export const nodeChildProcessFacade: ChildProcessFacade = {
	spawn(command, args, options) {
		return nodeSpawn(command, [...args], options) as ChildProcess;
	},
};

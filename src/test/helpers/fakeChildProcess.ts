import { EventEmitter } from 'events';
import { ChildProcessLike } from '../../infrastructure/process/childProcessFacade';

export class FakeChildProcess extends EventEmitter implements ChildProcessLike {
	public exitCode: number | null = null;
	public pid: number | undefined = 1;
	public killed = false;
	public killResult = true;

	public kill(): boolean {
		this.killed = true;
		this.exitCode = 0;
		return this.killResult;
	}
}

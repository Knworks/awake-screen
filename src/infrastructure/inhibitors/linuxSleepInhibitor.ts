import { CommandSleepInhibitor } from './commandSleepInhibitor';
import { ChildProcessFacade } from '../process/childProcessFacade';

export class LinuxSleepInhibitor extends CommandSleepInhibitor {
	public constructor(processFacade: ChildProcessFacade) {
		super({
			command: 'systemd-inhibit',
			args: ['--what=idle:sleep', '--why=AwakeScreen', 'sleep', '2147483647'],
			processFacade,
		});
	}
}

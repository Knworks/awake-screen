import { CommandSleepInhibitor } from './commandSleepInhibitor';
import { ChildProcessFacade } from '../process/childProcessFacade';

export class MacosSleepInhibitor extends CommandSleepInhibitor {
	public constructor(processFacade: ChildProcessFacade) {
		super({
			command: 'caffeinate',
			args: ['-d', '-i'],
			processFacade,
		});
	}
}

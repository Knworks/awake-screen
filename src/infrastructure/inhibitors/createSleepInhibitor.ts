import { SleepInhibitor } from '../../domain/sleepInhibitor';
import { ChildProcessFacade } from '../process/childProcessFacade';
import { LinuxSleepInhibitor } from './linuxSleepInhibitor';
import { MacosSleepInhibitor } from './macosSleepInhibitor';
import { UnsupportedSleepInhibitor } from './unsupportedSleepInhibitor';
import { WindowsSleepInhibitor } from './windowsSleepInhibitor';

export function createSleepInhibitor(
	platform: NodeJS.Platform,
	processFacade: ChildProcessFacade,
): SleepInhibitor {
	switch (platform) {
		case 'darwin':
			return new MacosSleepInhibitor(processFacade);
		case 'linux':
			return new LinuxSleepInhibitor(processFacade);
		case 'win32':
			return new WindowsSleepInhibitor(processFacade);
		default:
			return new UnsupportedSleepInhibitor(platform);
	}
}

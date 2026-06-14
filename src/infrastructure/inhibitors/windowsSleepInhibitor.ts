import { CommandSleepInhibitor } from './commandSleepInhibitor';
import { ChildProcessFacade } from '../process/childProcessFacade';

const keepAwakeExecutionState = '[uint32]2147483651';
const clearExecutionState = '[uint32]2147483648';

const setThreadExecutionStateScript = [
	'$signature = @"',
	'using System.Runtime.InteropServices;',
	'public static class NativeMethods {',
	'  [DllImport("kernel32.dll")]',
	'  public static extern uint SetThreadExecutionState(uint esFlags);',
	'}',
	'"@',
	'Add-Type -TypeDefinition $signature | Out-Null',
	'try {',
	// PowerShell parses 0x80000003 as a signed Int32, so keep the flags as UInt32 decimal literals.
	`  [NativeMethods]::SetThreadExecutionState(${keepAwakeExecutionState}) | Out-Null`,
	'  while ($true) {',
	'    Start-Sleep -Seconds 30',
	`    [NativeMethods]::SetThreadExecutionState(${keepAwakeExecutionState}) | Out-Null`,
	'  }',
	'} finally {',
	`  [NativeMethods]::SetThreadExecutionState(${clearExecutionState}) | Out-Null`,
	'}',
].join('\n');

export class WindowsSleepInhibitor extends CommandSleepInhibitor {
	public constructor(processFacade: ChildProcessFacade) {
		super({
			command: 'powershell.exe',
			args: [
				'-NoProfile',
				'-NonInteractive',
				'-WindowStyle',
				'Hidden',
				'-Command',
				setThreadExecutionStateScript,
			],
			processFacade,
		});
	}
}

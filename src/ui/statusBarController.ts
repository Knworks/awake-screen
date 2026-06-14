import { AwakeState, awakeLabel } from '../domain/awakeState';

export interface StatusBarItemLike {
	text: string;
	tooltip?: unknown;
	command?: unknown;
	show(): void;
	dispose(): void;
}

export interface AwakeStatePresenter {
	setState(state: AwakeState): void;
}

export interface StatusBarPresentation {
	readonly text: string;
	readonly tooltip: string;
	readonly command?: string;
}

const toggleCommandId = 'awake-screen.toggle';

const presentationByState: Record<AwakeState, StatusBarPresentation> = {
	off: {
		text: `$(vm-outline) ${awakeLabel}`,
		tooltip: 'Keep Awake is off. Click to enable sleep prevention.',
		command: toggleCommandId,
	},
	starting: {
		text: `$(loading~spin) ${awakeLabel}`,
		tooltip: 'Keep Awake is starting. Please wait.',
	},
	on: {
		text: `$(vm-pending) ${awakeLabel}`,
		tooltip: 'Keep Awake is on. Click to disable sleep prevention.',
		command: toggleCommandId,
	},
	error: {
		text: `$(warning) ${awakeLabel}`,
		tooltip: 'Keep Awake could not start. Click to retry.',
		command: toggleCommandId,
	},
};

export function getStatusBarPresentation(state: AwakeState): StatusBarPresentation {
	return presentationByState[state];
}

export class StatusBarController implements AwakeStatePresenter {
	public constructor(private readonly item: StatusBarItemLike) {}

	public initialize(): void {
		this.setState('off');
		this.item.show();
	}

	public setState(state: AwakeState): void {
		const presentation = getStatusBarPresentation(state);
		this.item.text = presentation.text;
		this.item.tooltip = presentation.tooltip;
		this.item.command = presentation.command;
	}

	public dispose(): void {
		this.item.dispose();
	}

	public getSnapshot(): StatusBarPresentation {
		return {
			text: this.item.text,
			tooltip: typeof this.item.tooltip === 'string' ? this.item.tooltip : '',
			command: typeof this.item.command === 'string' ? this.item.command : undefined,
		};
	}
}

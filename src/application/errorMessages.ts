import { SleepInhibitorError } from '../domain/sleepInhibitor';

export function formatStartError(error: unknown): string {
	if (error instanceof SleepInhibitorError) {
		switch (error.code) {
			case 'unsupported-os':
				return `${error.message} This environment is not supported by Keep Awake.`;
			case 'command-missing':
				return `${error.message} Install the required OS command and try again.`;
			case 'start-failed':
				return error.message;
			case 'stop-failed':
				return 'Keep Awake could not finish the previous sleep prevention session cleanly.';
		}
	}

	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return 'Keep Awake could not enable sleep prevention.';
}

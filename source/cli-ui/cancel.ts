export const interactiveCancelMessage = 'Interactive input was canceled.';

export function createInteractiveCancelError(): Error {
	return new Error(interactiveCancelMessage);
}

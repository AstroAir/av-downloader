import {Box, Text, render, useFocus, useFocusManager, useInput} from 'ink';
import type {ReactElement} from 'react';
import {useEffect, useState} from 'react';
import type {DownloaderOptions} from '../downloader/types.js';

type ReviewAction = 'run' | 'edit' | 'exit';
type RecoverAction = 'retry' | 'edit' | 'exit';

function FocusableActionRow(props: {
	readonly id: string;
	readonly text: string;
	readonly autoFocus?: boolean;
	readonly active: boolean;
}): ReactElement {
	const focus = useFocus({id: props.id, autoFocus: props.autoFocus});
	const marker = focus.isFocused ? '>' : ' ';
	const color = props.active || focus.isFocused ? 'green' : 'white';
	return (
		<Text color={color}>
			{marker} {props.text}
		</Text>
	);
}

function toRowId(index: number): string {
	return `review-action-${String(index)}`;
}

type ReviewPromptProps = {
	readonly options: DownloaderOptions;
	readonly onSelect: (action: ReviewAction) => void;
	readonly onCancel: () => void;
};

export function ReviewPrompt({options, onSelect, onCancel}: ReviewPromptProps) {
	const actions: readonly ReviewAction[] = ['run', 'edit', 'exit'];
	const [activeIndex, setActiveIndex] = useState(0);
	const focusManager = useFocusManager();
	const actionLabels: Record<ReviewAction, string> = {
		run: 'Run download with this configuration',
		edit: 'Edit advanced parameters',
		exit: 'Exit interactive session',
	};

	useEffect(() => {
		focusManager.focus(toRowId(activeIndex));
	}, [activeIndex, focusManager]);

	useInput((input, key) => {
		if ((key.ctrl && input.toLowerCase() === 'c') || input === '\u0003') {
			onCancel();
			return;
		}

		if (key.escape || input === '\u001B') {
			onCancel();
			return;
		}

		if (key.tab || input === '\t' || key.downArrow) {
			const delta = key.shift ? -1 : 1;
			setActiveIndex(previous => (previous + delta + actions.length) % actions.length);
			return;
		}

		if (key.upArrow) {
			setActiveIndex(previous => (previous - 1 + actions.length) % actions.length);
			return;
		}

		if (key.return || input === '\r' || input === '\n') {
			onSelect(actions[activeIndex] ?? 'run');
			return;
		}

		if (input.toLowerCase() === 'r') {
			onSelect('run');
			return;
		}

		if (input.toLowerCase() === 'e') {
			onSelect('edit');
			return;
		}

		if (input.toLowerCase() === 'x' || input.toLowerCase() === 'q') {
			onSelect('exit');
		}
	});

	return (
		<Box flexDirection="column">
			<Text bold color="blue">
				Review Configuration
			</Text>
			<Text dimColor>Confirm normalized values before execution.</Text>
			<Box marginTop={1} flexDirection="column">
				<Text>Input: {options.url || options.pageUrl}</Text>
				<Text>
					Network: concurrency={String(options.concurrency)} timeout=
					{String(options.timeoutMs)} retries={String(options.retries)} backoff=
					{String(options.retryBackoffMs)}
				</Text>
				<Text>
					Segments: sniff={String(options.sniff)} maxMiss={String(options.maxMisses)}
					seq={String(options.startSequence)}-{String(options.endSequence)}
				</Text>
				<Text>
					Output: out={options.out} overwrite={String(options.overwrite)} keepMergedTs=
					{String(options.keepMergedTs)}
				</Text>
			</Box>
			<Box marginTop={1} flexDirection="column">
				{actions.map((action, index) => (
					<FocusableActionRow
						key={action}
						id={toRowId(index)}
						text={actionLabels[action]}
						autoFocus={index === 0}
						active={index === activeIndex}
					/>
				))}
			</Box>
		</Box>
	);
}

type RecoverPromptProps = {
	readonly errorMessage: string;
	readonly onSelect: (action: RecoverAction) => void;
	readonly onCancel: () => void;
};

export function RecoverPrompt({errorMessage, onSelect, onCancel}: RecoverPromptProps) {
	const actions: readonly RecoverAction[] = ['retry', 'edit', 'exit'];
	const [activeIndex, setActiveIndex] = useState(0);
	const focusManager = useFocusManager();
	const actionLabels: Record<RecoverAction, string> = {
		retry: 'Retry with current configuration',
		edit: 'Edit configuration before retry',
		exit: 'Exit interactive session',
	};

	useEffect(() => {
		focusManager.focus(toRowId(activeIndex));
	}, [activeIndex, focusManager]);

	useInput((input, key) => {
		if ((key.ctrl && input.toLowerCase() === 'c') || input === '\u0003') {
			onCancel();
			return;
		}

		if (key.escape || input === '\u001B') {
			onCancel();
			return;
		}

		if (key.tab || input === '\t' || key.downArrow) {
			const delta = key.shift ? -1 : 1;
			setActiveIndex(previous => (previous + delta + actions.length) % actions.length);
			return;
		}

		if (key.upArrow) {
			setActiveIndex(previous => (previous - 1 + actions.length) % actions.length);
			return;
		}

		if (key.return || input === '\r' || input === '\n') {
			onSelect(actions[activeIndex] ?? 'retry');
			return;
		}

		if (input.toLowerCase() === 'r') {
			onSelect('retry');
			return;
		}

		if (input.toLowerCase() === 'e') {
			onSelect('edit');
			return;
		}

		if (input.toLowerCase() === 'x' || input.toLowerCase() === 'q') {
			onSelect('exit');
		}
	});

	return (
		<Box flexDirection="column">
			<Text bold color="red">
				Download Failed
			</Text>
			<Text color="red">Error: {errorMessage}</Text>
			<Text dimColor>
				Choose an action. Existing configuration is preserved unless you edit it.
			</Text>
			<Box marginTop={1} flexDirection="column">
				{actions.map((action, index) => (
					<FocusableActionRow
						key={action}
						id={toRowId(index)}
						text={actionLabels[action]}
						autoFocus={index === 0}
						active={index === activeIndex}
					/>
				))}
			</Box>
		</Box>
	);
}

export async function collectReviewAction(
	options: DownloaderOptions,
): Promise<ReviewAction> {
	return new Promise<ReviewAction>((resolve, reject) => {
		const app = render(
			<ReviewPrompt
				options={options}
				onSelect={action => {
					app.unmount();
					resolve(action);
				}}
				onCancel={() => {
					app.unmount();
					reject(new Error('Interactive review was canceled.'));
				}}
			/>,
			{patchConsole: false},
		);
	});
}

export async function collectRecoveryAction(
	errorMessage: string,
): Promise<RecoverAction> {
	return new Promise<RecoverAction>((resolve, reject) => {
		const app = render(
			<RecoverPrompt
				errorMessage={errorMessage}
				onSelect={action => {
					app.unmount();
					resolve(action);
				}}
				onCancel={() => {
					app.unmount();
					reject(new Error('Interactive recovery was canceled.'));
				}}
			/>,
			{patchConsole: false},
		);
	});
}

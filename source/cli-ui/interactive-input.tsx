import {Box, Text, render, useFocus, useFocusManager, useInput} from 'ink';
import type {ReactElement} from 'react';
import {useMemo, useState} from 'react';
import type {CliInputFlags} from '../downloader/options.js';
import {normalizeUrlInput} from '../downloader/options.js';
import {createInteractiveCancelError} from './cancel.js';

type InputKind = 'url' | 'pageUrl';

type PromptProps = {
	readonly onSubmit: (value: Pick<CliInputFlags, InputKind>) => void;
	readonly onCancel: () => void;
};

function FocusableRow(props: {
	readonly id: string;
	readonly text: string;
	readonly autoFocus?: boolean;
	readonly active?: boolean;
}): ReactElement {
	const focus = useFocus({id: props.id, autoFocus: props.autoFocus});
	const isFocused = focus.isFocused;
	const marker = isFocused ? '>' : ' ';
	const color = props.active ? 'cyan' : isFocused ? 'green' : 'white';
	return (
		<Text color={color}>
			{marker} {props.text}
		</Text>
	);
}

export function InteractiveInputPrompt({onSubmit, onCancel}: PromptProps) {
	const [rawValue, setRawValue] = useState('');
	const [kind, setKind] = useState<InputKind>('url');
	const [errorText, setErrorText] = useState('');
	const focusManager = useFocusManager();
	const modeLabel = useMemo(
		() => (kind === 'url' ? 'Mode: --url' : 'Mode: --page-url'),
		[kind],
	);

	const submit = (): void => {
		const normalized = normalizeUrlInput(rawValue);
		if (!normalized) {
			setErrorText('Input cannot be empty. Paste or type a valid URL.');
			focusManager.focus('input');
			return;
		}

		if (kind === 'url') {
			onSubmit({url: normalized});
			return;
		}

		onSubmit({pageUrl: normalized});
	};

	useInput((input, key) => {
		if (
			key.escape ||
			input === '\u001B' ||
			(key.ctrl && input.toLowerCase() === 'c')
		) {
			onCancel();
			return;
		}

		if (key.tab || input === '\t' || key.downArrow) {
			if (key.shift) {
				focusManager.focusPrevious();
				return;
			}

			focusManager.focusNext();
			return;
		}

		if (key.upArrow) {
			focusManager.focusPrevious();
			return;
		}

		if (key.return || input === '\r' || input === '\n') {
			submit();
			return;
		}

		if (input.toLowerCase() === 's' && !key.ctrl && !key.meta) {
			submit();
			return;
		}

		if (!rawValue && input.length === 1 && input.toLowerCase() === 'u') {
			setKind('url');
			return;
		}

		if (!rawValue && input.length === 1 && input.toLowerCase() === 'p') {
			setKind('pageUrl');
			return;
		}

		if (key.backspace) {
			setRawValue(value => value.slice(0, -1));
			return;
		}

		if (!key.ctrl && !key.meta && !key.delete) {
			if (!input) {
				return;
			}

			setRawValue(value => `${value}${input}`);
			if (errorText) {
				setErrorText('');
			}
		}
	});

	return (
		<Box flexDirection="column">
			<Text bold color="blue">
				AV Downloader Setup
			</Text>
			<Text dimColor>
				Missing input source. Type or paste a URL. Tab cycles focus, Enter or S
				submits, Esc cancels.
			</Text>
			<Box marginTop={1} flexDirection="column">
				<FocusableRow
					id="input"
					text={`Input: ${rawValue || '<empty>'}`}
					autoFocus
					active
				/>
				<FocusableRow
					id="mode-url"
					text="Press U to use --url"
					active={kind === 'url'}
				/>
				<FocusableRow
					id="mode-page"
					text="Press P to use --page-url"
					active={kind === 'pageUrl'}
				/>
				<FocusableRow id="submit" text="Press Enter or S to continue" />
				<FocusableRow id="cancel" text="Press Esc to cancel" />
			</Box>
			<Text color="cyan">{modeLabel}</Text>
			{errorText ? <Text color="red">{errorText}</Text> : null}
		</Box>
	);
}

export async function collectMissingInput(
	flags: CliInputFlags,
): Promise<CliInputFlags> {
	if (flags.url || flags.pageUrl) {
		return flags;
	}

	return new Promise<CliInputFlags>((resolve, reject) => {
		const app = render(
			<InteractiveInputPrompt
				onSubmit={value => {
					app.unmount();
					resolve({...flags, ...value});
				}}
				onCancel={() => {
					app.unmount();
					reject(createInteractiveCancelError());
				}}
			/>,
			{patchConsole: false},
		);
	});
}

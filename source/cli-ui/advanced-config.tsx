import {Box, Text, render, useFocus, useFocusManager, useInput} from 'ink';
import type {ReactElement} from 'react';
import {useEffect, useMemo, useState} from 'react';
import {downloaderDefaults} from '../downloader/defaults.js';
import type {CliInputFlags} from '../downloader/options.js';
import {createInteractiveCancelError} from './cancel.js';

type FieldKind = 'number' | 'boolean' | 'string';

type FieldDefinition = {
	readonly key: keyof CliInputFlags;
	readonly label: string;
	readonly group: 'network' | 'resilience' | 'segment' | 'output';
	readonly kind: FieldKind;
	readonly description: string;
};

const advancedFields: readonly FieldDefinition[] = [
	{
		key: 'concurrency',
		label: 'Concurrency',
		group: 'network',
		kind: 'number',
		description: 'Concurrent segment requests.',
	},
	{
		key: 'timeout',
		label: 'Timeout (ms)',
		group: 'network',
		kind: 'number',
		description: 'HTTP timeout for each request.',
	},
	{
		key: 'referer',
		label: 'Referer',
		group: 'network',
		kind: 'string',
		description: 'Optional HTTP Referer override.',
	},
	{
		key: 'userAgent',
		label: 'User-Agent',
		group: 'network',
		kind: 'string',
		description: 'Optional HTTP User-Agent override.',
	},
	{
		key: 'retries',
		label: 'Retries',
		group: 'resilience',
		kind: 'number',
		description: 'Retry count per request.',
	},
	{
		key: 'retryBackoff',
		label: 'Retry backoff (ms)',
		group: 'resilience',
		kind: 'number',
		description: 'Linear retry backoff base delay.',
	},
	{
		key: 'sniff',
		label: 'Enable sniff',
		group: 'segment',
		kind: 'boolean',
		description: 'Probe sequential segments.',
	},
	{
		key: 'maxMiss',
		label: 'Max sniff miss',
		group: 'segment',
		kind: 'number',
		description: 'Stop probing after N misses.',
	},
	{
		key: 'scriptLimit',
		label: 'Script scan limit',
		group: 'segment',
		kind: 'number',
		description: 'Max scripts inspected from page.',
	},
	{
		key: 'startSequence',
		label: 'Start sequence',
		group: 'segment',
		kind: 'number',
		description: 'Sequence lower bound (0 disables).',
	},
	{
		key: 'endSequence',
		label: 'End sequence',
		group: 'segment',
		kind: 'number',
		description: 'Sequence upper bound (0 disables).',
	},
	{
		key: 'out',
		label: 'Output path',
		group: 'output',
		kind: 'string',
		description: 'Requested output file path.',
	},
	{
		key: 'workdir',
		label: 'Workdir',
		group: 'output',
		kind: 'string',
		description: 'Temporary download workspace.',
	},
	{
		key: 'overwrite',
		label: 'Overwrite output',
		group: 'output',
		kind: 'boolean',
		description: 'Allow replacing existing output files.',
	},
	{
		key: 'keepMergedTs',
		label: 'Keep merged.ts',
		group: 'output',
		kind: 'boolean',
		description: 'Keep merged.ts after execution.',
	},
];

type PromptProps = {
	readonly initialFlags: CliInputFlags;
	readonly validationError?: string;
	readonly onSubmit: (flags: CliInputFlags) => void;
	readonly onCancel: () => void;
};

function fieldFocusId(key: keyof CliInputFlags): string {
	return `field-${String(key)}`;
}

function sanitizeSingleLine(value: string): string {
	return value.replace(/\r\n/g, '\n').split('\n')[0]?.trim() ?? '';
}

function getFieldFallbackValue(
	field: FieldDefinition,
): boolean | number | string {
	switch (field.key) {
		case 'concurrency': {
			return downloaderDefaults.concurrency;
		}

		case 'timeout': {
			return downloaderDefaults.timeoutMs;
		}

		case 'retries': {
			return downloaderDefaults.retries;
		}

		case 'retryBackoff': {
			return downloaderDefaults.retryBackoffMs;
		}

		case 'sniff': {
			return downloaderDefaults.sniff;
		}

		case 'maxMiss': {
			return downloaderDefaults.maxMisses;
		}

		case 'scriptLimit': {
			return downloaderDefaults.scriptLimit;
		}

		case 'startSequence': {
			return downloaderDefaults.startSequence;
		}

		case 'endSequence': {
			return downloaderDefaults.endSequence;
		}

		case 'overwrite': {
			return downloaderDefaults.overwrite;
		}

		case 'keepMergedTs': {
			return downloaderDefaults.keepMergedTs;
		}

		case 'userAgent': {
			return downloaderDefaults.userAgent;
		}

		case 'out': {
			return downloaderDefaults.out;
		}

		case 'workdir': {
			return downloaderDefaults.workdir;
		}

		default: {
			return '';
		}
	}
}

function readFieldValue(
	flags: CliInputFlags,
	field: FieldDefinition,
): boolean | number | string {
	const value = flags[field.key];
	return value === undefined ? getFieldFallbackValue(field) : value;
}

function writeFieldValue(
	flags: CliInputFlags,
	key: keyof CliInputFlags,
	value: boolean | number | string | undefined,
): CliInputFlags {
	const next: Record<string, boolean | number | string | undefined> = {
		...flags,
	};
	const propertyName = String(key);

	if (value === undefined) {
		return Object.fromEntries(
			Object.entries(next).filter(
				([currentKey]) => currentKey !== propertyName,
			),
		) as CliInputFlags;
	}

	next[propertyName] = value;

	return next as CliInputFlags;
}

function formatFieldValue(value: boolean | number | string): string {
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}

	if (typeof value === 'number') {
		return String(value);
	}

	return value || '<empty>';
}

function FocusableFieldRow(props: {
	readonly id: string;
	readonly group: string;
	readonly label: string;
	readonly description: string;
	readonly value: string;
	readonly autoFocus?: boolean;
	readonly active: boolean;
	readonly editing: boolean;
}): ReactElement {
	const focus = useFocus({id: props.id, autoFocus: props.autoFocus});
	const marker = focus.isFocused ? '>' : ' ';
	const color = props.editing
		? 'yellow'
		: focus.isFocused || props.active
		? 'green'
		: 'white';

	return (
		<Box flexDirection="column">
			<Text color={color}>
				{marker} [{props.group}] {props.label}: {props.value}
			</Text>
			<Text dimColor>{props.description}</Text>
		</Box>
	);
}

export function AdvancedConfigPrompt({
	initialFlags,
	validationError = '',
	onSubmit,
	onCancel,
}: PromptProps) {
	const [draftFlags, setDraftFlags] = useState<CliInputFlags>(initialFlags);
	const [activeIndex, setActiveIndex] = useState(0);
	const [editingKey, setEditingKey] = useState<keyof CliInputFlags | null>(
		null,
	);
	const [inputBuffer, setInputBuffer] = useState('');
	const [errorText, setErrorText] = useState(validationError);
	const focusManager = useFocusManager();
	const activeField = advancedFields[activeIndex];

	useEffect(() => {
		setErrorText(validationError);
	}, [validationError]);

	useEffect(() => {
		if (activeField) {
			focusManager.focus(fieldFocusId(activeField.key));
		}
	}, [activeField, focusManager]);

	const editingLabel = useMemo(() => {
		if (!editingKey) {
			return '';
		}

		const field = advancedFields.find(item => item.key === editingKey);
		return field?.label ?? String(editingKey);
	}, [editingKey]);

	const updateField = (
		key: keyof CliInputFlags,
		value: boolean | number | string | undefined,
	): void => {
		setDraftFlags(previous => writeFieldValue(previous, key, value));
	};

	const applyEditing = (): void => {
		if (!editingKey) {
			return;
		}

		const field = advancedFields.find(item => item.key === editingKey);
		if (!field) {
			setEditingKey(null);
			setInputBuffer('');
			return;
		}

		if (field.kind === 'number') {
			const normalized = sanitizeSingleLine(inputBuffer);
			const parsed = Number(normalized);
			if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
				setErrorText(`Invalid ${field.label}: expected an integer value.`);
				return;
			}

			updateField(field.key, parsed);
		} else if (field.kind === 'string') {
			const normalized = sanitizeSingleLine(inputBuffer);
			updateField(field.key, normalized || undefined);
		}

		setEditingKey(null);
		setInputBuffer('');
		setErrorText('');
	};

	const toggleBooleanField = (field: FieldDefinition): void => {
		const current = Boolean(readFieldValue(draftFlags, field));
		updateField(field.key, !current);
		setErrorText('');
	};

	const startEditing = (field: FieldDefinition): void => {
		if (field.kind === 'boolean') {
			toggleBooleanField(field);
			return;
		}

		const current = readFieldValue(draftFlags, field);
		setEditingKey(field.key);
		setInputBuffer(String(current));
		setErrorText('');
	};

	const moveFocus = (delta: number): void => {
		setActiveIndex(previous => {
			const next =
				(previous + delta + advancedFields.length) % advancedFields.length;
			return next;
		});
	};

	useInput((input, key) => {
		if ((key.ctrl && input.toLowerCase() === 'c') || input === '\u0003') {
			onCancel();
			return;
		}

		if (editingKey) {
			if (key.escape) {
				setEditingKey(null);
				setInputBuffer('');
				return;
			}

			if (key.return || input === '\r' || input === '\n') {
				applyEditing();
				return;
			}

			if (key.backspace) {
				setInputBuffer(value => value.slice(0, -1));
				return;
			}

			if (!key.ctrl && !key.meta && !key.delete && input) {
				setInputBuffer(value => `${value}${input}`);
			}

			return;
		}

		if (key.escape || input === '\u001B') {
			onCancel();
			return;
		}

		if (key.tab || input === '\t' || key.downArrow) {
			const delta = key.shift ? -1 : 1;
			moveFocus(delta);
			return;
		}

		if (key.upArrow) {
			moveFocus(-1);
			return;
		}

		if (key.return || input === '\r' || input === '\n') {
			if (activeField) {
				startEditing(activeField);
			}
			return;
		}

		if (input.toLowerCase() === 'c') {
			onSubmit(draftFlags);
		}
	});

	return (
		<Box flexDirection="column">
			<Text bold color="blue">
				Advanced Download Configuration
			</Text>
			<Text dimColor>
				Tab/Up/Down to move focus, Enter to edit/toggle, C to confirm, Esc to
				cancel.
			</Text>
			<Box flexDirection="column" marginTop={1}>
				{advancedFields.map((field, index) => {
					const value = formatFieldValue(readFieldValue(draftFlags, field));
					return (
						<FocusableFieldRow
							key={String(field.key)}
							id={fieldFocusId(field.key)}
							group={field.group}
							label={field.label}
							description={field.description}
							value={value}
							active={activeIndex === index}
							autoFocus={index === 0}
							editing={editingKey === field.key}
						/>
					);
				})}
			</Box>
			{editingKey ? (
				<Box marginTop={1} flexDirection="column">
					<Text color="yellow">
						Editing {editingLabel}: {inputBuffer || '<empty>'}
					</Text>
					<Text dimColor>Press Enter to apply or Esc to cancel this edit.</Text>
				</Box>
			) : null}
			{errorText ? (
				<Text color="red" wrap="wrap">
					{errorText}
				</Text>
			) : null}
		</Box>
	);
}

export async function collectAdvancedOptions(
	flags: CliInputFlags,
	validationError = '',
): Promise<CliInputFlags> {
	return new Promise<CliInputFlags>((resolve, reject) => {
		const app = render(
			<AdvancedConfigPrompt
				initialFlags={flags}
				validationError={validationError}
				onSubmit={nextFlags => {
					app.unmount();
					resolve(nextFlags);
				}}
				onCancel={() => {
					app.unmount();
					reject(createInteractiveCancelError());
				}}
			/>,
			{
				patchConsole: false,
			},
		);
	});
}

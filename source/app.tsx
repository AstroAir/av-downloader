import {Box} from 'ink';
import {
	MessageFeed,
	ProgressRow,
	ResultSummary,
	StatusRow,
	WarningList,
} from './cli-ui/presentation.js';
import type {CliUiState} from './cli-ui/types.js';

type Props = {
	readonly state: CliUiState;
};

export default function App({state}: Props) {
	return (
		<Box flexDirection="column">
			<StatusRow state={state} />
			<ProgressRow state={state} />
			<WarningList warnings={state.warnings} />
			<ResultSummary state={state} />
			<MessageFeed messages={state.messages} />
		</Box>
	);
}

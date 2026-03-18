import {Text} from 'ink';
import {defaultName} from './cli-metadata.js';

type Props = {
	readonly name?: string;
};

export default function App(props: Props) {
	const {name = defaultName} = props;
	return <Text>Hello, {name}</Text>;
}

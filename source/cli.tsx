#!/usr/bin/env node
import meow from 'meow';
import {render} from 'ink';
import App from './app.js';
import {buildCliHelpText, cliFlags} from './cli-metadata.js';

const cli = meow(buildCliHelpText(), {
	importMeta: import.meta,
	flags: {
		name: {
			type: cliFlags.name.type,
			default: cliFlags.name.default,
		},
	},
});

render(<App name={cli.flags.name} />);

/**
 * Canonical CLI name used by runtime help text and generated docs.
 */
export const cliName = 'react-cli-quick-starter';

/**
 * Default fallback name used in greetings and option docs.
 */
export const defaultName = 'Stranger';

export type CliFlagDefinition = {
	readonly type: 'string';
	readonly description: string;
	readonly default: string;
};

export const cliFlags: Record<'name', CliFlagDefinition> = {
	name: {
		type: 'string',
		description: 'Your name',
		default: defaultName,
	},
};

export const cliExamples = [`$ ${cliName} --name=Jane`, 'Hello, Jane'] as const;

export function buildCliHelpText(): string {
	return `
	Usage
	  $ ${cliName}

	Options
	  --name  ${cliFlags.name.description} (default: ${cliFlags.name.default})

	Examples
	  ${cliExamples[0]}
	  ${cliExamples[1]}
	`;
}

import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';

export async function mergeFilesSequentially(
	inputFiles: readonly string[],
	outputFile: string,
): Promise<void> {
	await fs.writeFile(outputFile, Buffer.alloc(0));
	for (const filePath of inputFiles) {
		const chunk = await fs.readFile(filePath);
		await fs.appendFile(outputFile, chunk);
	}
}

export function hasFfmpeg(
	platform: NodeJS.Platform = process.platform,
): boolean {
	const binary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
	const check = spawnSync(binary, ['-version'], {
		stdio: 'ignore',
		shell: false,
	});
	return check.status === 0;
}

export async function remuxTsToMp4(
	tsPath: string,
	mp4Path: string,
	platform: NodeJS.Platform = process.platform,
): Promise<void> {
	const binary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			binary,
			['-y', '-i', tsPath, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', mp4Path],
			{
				stdio: 'inherit',
				shell: false,
			},
		);

		child.on('error', reject);
		child.on('exit', code => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(new Error(`ffmpeg exited with code ${String(code)}`));
		});
	});
}

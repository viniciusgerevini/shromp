import yoctoSpinner, { Spinner } from 'yocto-spinner';

let spinner: Spinner;

export function init(text: string): void {
	spinner = yoctoSpinner({ text }).start();
}

export function start(text: string): void {
	if (spinner.isSpinning) {
		updateCurrent(text);
	} else {
		spinner.start(text);
	}
}

export function info(text: string): void {
	spinner.info(text);
}

export function warning(text?: string): void {
	spinner.warning(text);
}

export function success(text?: string): void {
	spinner.success(text);
}

export function error(): void {
	spinner.error();
}

export function updateCurrent(text: string): void {
	spinner.text = text;
}

export function logShrimplySuccess(text: string): void {
	console.log(`\n🦐🦐🦐🦐 ${text} 🦐🦐🦐🦐\n`);
}

export function log(text: string): void {
	console.log(text);
}

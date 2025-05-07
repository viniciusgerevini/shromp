import { consola } from "consola";

export function info(text: string): void {
	consola.info(text);
}

export function start(text: string): void {
	consola.start(text);
}

export function warn(text: string): void {
	consola.warn(text);
}

export function success(text: string): void {
	consola.success(text);
}

export function error(text: string | Error): void {
	consola.error(text);
}

export function logShrimplySuccess(text: string): void {
	consola.box(`🦐🦐🦐🦐 ${text} 🦐🦐🦐🦐`);
}

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			/** Set when the failure is the database being unreachable, so the page can say what to check. */
			code?: 'database';
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

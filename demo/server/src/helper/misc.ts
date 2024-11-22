export async function sleepMilliSeconds(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sleepSecondds(sec: number): Promise<void> {
	return sleepMilliSeconds(sec * 1000);
}

export function extractNameFromEmail(email: string): string | null {
	if (!email.includes('@')) return null;
	const parts = email.split('@');
	return parts[0] || null;
}

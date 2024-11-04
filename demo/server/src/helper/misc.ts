export async function sleepMilliSeconds(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sleepSecondds(sec: number): Promise<void> {
  return sleepMilliSeconds(sec * 1000);
}

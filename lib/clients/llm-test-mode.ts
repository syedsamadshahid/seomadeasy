export function isLlmTestMode(): boolean {
  return process.env.USE_DEEPSEEK_TEST === "true";
}

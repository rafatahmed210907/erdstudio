export function isReadOnlyDataStore() {
  return process.env.VERCEL === "1" || process.env.READ_ONLY_DATA === "1";
}

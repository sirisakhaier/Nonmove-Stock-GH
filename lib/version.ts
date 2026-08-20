export const APP_VERSION = "v1.3.0";
export const TEAM_NAME = "Sell out team, Haier (Thailand)";

export function getCommitHash(): string {
  if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) {
    return process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  return "ba7ef42";
}

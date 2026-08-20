import { NextResponse } from "next/server";
import { APP_VERSION, TEAM_NAME, getCommitHash } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA
    ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    : getCommitHash();

  return NextResponse.json({
    version: APP_VERSION,
    commit,
    team: TEAM_NAME,
    branch: process.env.VERCEL_GIT_COMMIT_REF || "main",
  });
}

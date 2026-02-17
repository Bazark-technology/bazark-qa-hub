import { NextRequest, NextResponse } from "next/server";

interface AzureDevOpsCommit {
  commitId: string;
  comment: string;
  author: {
    name: string;
    email: string;
  };
}

interface AzureDevOpsPushEvent {
  eventType: string;
  resource: {
    repository: {
      name: string;
    };
    refUpdates: Array<{
      name: string;
    }>;
    commits: AzureDevOpsCommit[];
  };
}

const REPO_PATHS: Record<string, string> = {
  web: "/home/bazarkadmin/projects/bazark-web",
  backend: "/home/bazarkadmin/projects/bazark-backend",
};

function getRepoType(repoName: string): "web" | "backend" | null {
  const lower = repoName.toLowerCase();
  if (lower === "web") return "web";
  if (lower === "backend") return "backend";
  return null;
}

function getBranchName(refName: string): string {
  // refs/heads/main -> main
  return refName.replace("refs/heads/", "");
}

function composeMessage(
  repoType: "web" | "backend",
  repoName: string,
  branch: string,
  commits: AzureDevOpsCommit[]
): string {
  const commitLines = commits
    .map((c) => `- ${c.commitId.slice(0, 7)}: "${c.comment}" by ${c.author.email}`)
    .join("\n");

  const repoPath = REPO_PATHS[repoType];
  const impactAnalyzerNote =
    repoType === "backend"
      ? " For backend commits, use bazark-impact-analyzer first to find affected frontend screens on the web repo."
      : "";

  return `New ${repoType} push to ${repoName}/${branch} with ${commits.length} commit(s):
${commitLines}

Pull the ${repoType} repo at ${repoPath}, analyze these commits using bazark-qa-tester skill.${impactAnalyzerNote} Report all results to the QA dashboard at http://localhost:3000 and send me a Telegram summary.`;
}

async function sendToOpenClaw(message: string): Promise<void> {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (!token) {
    console.log("[Webhook] Warning: OPENCLAW_GATEWAY_TOKEN not set, skipping OpenClaw notification");
    return;
  }

  const response = await fetch("http://127.0.0.1:18789/api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      channel: "telegram",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenClaw gateway returned ${response.status}: ${text}`);
  }

  console.log("[Webhook] Successfully sent message to OpenClaw gateway");
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as AzureDevOpsPushEvent;

    console.log("[Webhook] Received Azure DevOps event:", payload.eventType);

    // Only process git.push events
    if (payload.eventType !== "git.push") {
      console.log("[Webhook] Ignoring non-push event:", payload.eventType);
      return NextResponse.json({ status: "ignored", reason: "not a push event" });
    }

    const repoName = payload.resource?.repository?.name;
    const refUpdates = payload.resource?.refUpdates || [];
    const commits = payload.resource?.commits || [];

    if (!repoName) {
      console.log("[Webhook] No repository name in payload");
      return NextResponse.json({ status: "ignored", reason: "no repository name" });
    }

    // Check if any ref update is to main or develop branch
    const allowedBranches = ["main", "develop"];
    const targetBranchUpdate = refUpdates.find((ref) =>
      allowedBranches.includes(getBranchName(ref.name))
    );

    if (!targetBranchUpdate) {
      console.log("[Webhook] Ignoring push to non-main/develop branch");
      return NextResponse.json({ status: "ignored", reason: "not main or develop branch" });
    }

    const branch = getBranchName(targetBranchUpdate.name);
    const repoType = getRepoType(repoName);

    if (!repoType) {
      console.log("[Webhook] Unknown repository:", repoName);
      return NextResponse.json({ status: "ignored", reason: "unknown repository" });
    }

    if (commits.length === 0) {
      console.log("[Webhook] No commits in push event");
      return NextResponse.json({ status: "ignored", reason: "no commits" });
    }

    console.log(
      `[Webhook] Processing ${repoType} push to ${branch} with ${commits.length} commit(s)`
    );

    const message = composeMessage(repoType, repoName, branch, commits);
    console.log("[Webhook] Composed message:", message);

    // Send to OpenClaw gateway
    try {
      await sendToOpenClaw(message);
    } catch (error) {
      console.log("[Webhook] Failed to send to OpenClaw gateway:", error);
      // Don't fail the webhook - Azure DevOps will retry
    }

    return NextResponse.json({
      status: "ok",
      repo: repoName,
      branch,
      commits: commits.length,
    });
  } catch (error) {
    console.log("[Webhook] Error processing webhook:", error);
    // Always return 200 to prevent Azure DevOps retries
    return NextResponse.json({ status: "error", message: "Failed to process webhook" });
  }
}

// Handle GET for testing/health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Azure DevOps webhook",
    accepts: "git.push events to main or develop branch",
  });
}

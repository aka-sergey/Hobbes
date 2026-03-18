type GitHubControlConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

type GitHubContentsResponse = {
  sha: string;
  content?: string;
  encoding?: string;
  html_url?: string;
  path?: string;
};

type GitHubCommitResult = {
  commitSha: string;
  commitUrl: string | null;
  htmlUrl: string | null;
  path: string;
  branch: string;
};

export type GitHubFileHistoryItem = {
  sha: string;
  message: string;
  authorName: string | null;
  committedAt: string | null;
  htmlUrl: string | null;
};

function getGitHubConfig(): GitHubControlConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_REPO_BRANCH ?? "master";

  if (!token || !owner || !repo) {
    return null;
  }

  return {
    token,
    owner,
    repo,
    branch
  };
}

export function hasGitHubControl() {
  return Boolean(getGitHubConfig());
}

function getContentsUrl(pathValue: string, branch: string, owner: string, repo: string) {
  const encodedPath = pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
}

async function requestGitHub(url: string, init: RequestInit = {}) {
  const config = getGitHubConfig();

  if (!config) {
    throw new Error("github_control_not_configured");
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "User-Agent": "hobbes-dashboard-control-center",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  return response;
}

export async function getGitHubFile(pathValue: string) {
  const config = getGitHubConfig();

  if (!config) {
    return null;
  }

  const response = await requestGitHub(getContentsUrl(pathValue, config.branch, config.owner, config.repo));

  if (response.status === 404) {
    return {
      available: false,
      sourceContent: "",
      sha: null,
      htmlUrl: null,
      branch: config.branch
    };
  }

  if (!response.ok) {
    throw new Error(`github_read_failed:${response.status}`);
  }

  const payload = (await response.json()) as GitHubContentsResponse;
  const decoded =
    payload.content && payload.encoding === "base64"
      ? Buffer.from(payload.content, "base64").toString("utf8")
      : "";

  return {
    available: true,
    sourceContent: decoded,
    sha: payload.sha,
    htmlUrl: payload.html_url ?? null,
    branch: config.branch
  };
}

export async function updateGitHubFile(pathValue: string, content: string, message: string): Promise<GitHubCommitResult> {
  const config = getGitHubConfig();

  if (!config) {
    throw new Error("github_control_not_configured");
  }

  const current = await getGitHubFile(pathValue);

  if (!current || !current.available || !current.sha) {
    throw new Error("github_file_not_found");
  }

  const response = await requestGitHub(getContentsUrl(pathValue, config.branch, config.owner, config.repo), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha: current.sha,
      branch: config.branch
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`github_write_failed:${response.status}:${errorText}`);
  }

  const payload = await response.json();

  return {
    commitSha: payload.commit?.sha ?? "",
    commitUrl: payload.commit?.html_url ?? null,
    htmlUrl: payload.content?.html_url ?? null,
    path: pathValue,
    branch: config.branch
  };
}

export async function listGitHubFileHistory(pathValue: string, limit = 10): Promise<GitHubFileHistoryItem[]> {
  const config = getGitHubConfig();

  if (!config) {
    return [];
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/commits?path=${encodeURIComponent(pathValue)}&sha=${encodeURIComponent(config.branch)}&per_page=${limit}`;
  const response = await requestGitHub(url);

  if (!response.ok) {
    throw new Error(`github_history_failed:${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    sha: string;
    html_url?: string;
    commit?: {
      message?: string;
      author?: {
        name?: string;
        date?: string;
      };
    };
  }>;

  return payload.map((entry) => ({
    sha: entry.sha,
    message: entry.commit?.message ?? "",
    authorName: entry.commit?.author?.name ?? null,
    committedAt: entry.commit?.author?.date ?? null,
    htmlUrl: entry.html_url ?? null
  }));
}

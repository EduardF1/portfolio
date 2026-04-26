/**
 * Public GitHub-profile aggregate fetcher.
 *
 * Two endpoints, both ISR-cached for 1h:
 *   GET /users/:user        → public_repos, followers
 *   GET /users/:user/repos  → ★ totals, language counts (top 100)
 *
 * GITHUB_TOKEN is optional — set it in Vercel to lift the 60/hr
 * unauth rate limit to 5 000/hr. We do not require any scopes, a
 * classic PAT with `public_repo` is plenty.
 *
 * On any error we return null so the call site can render an
 * empty-state instead of breaking the page.
 */
const USER = "EduardF1";
const REVALIDATE_SECONDS = 60 * 60; // 1h

export type ProfileStats = {
  user: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  topLanguages: Array<{ name: string; count: number }>;
};

type GhProfile = {
  public_repos: number;
  followers: number;
};

type GhRepo = {
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function getProfileStats(): Promise<ProfileStats | null> {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${USER}`, {
        headers: authHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      }),
      fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, {
        headers: authHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      }),
    ]);
    if (!profileRes.ok || !reposRes.ok) {
      console.error(
        `[github-stats] ${profileRes.status} / ${reposRes.status}`,
      );
      return null;
    }
    const profile = (await profileRes.json()) as GhProfile;
    const repos = (await reposRes.json()) as GhRepo[];
    return summarizeStats(profile, repos);
  } catch (e) {
    console.error("[github-stats] fetch failed", e);
    return null;
  }
}

/**
 * Pure aggregator — exported separately so the unit test can drive
 * it with fixtures without faking the fetch.
 */
export function summarizeStats(
  profile: GhProfile,
  repos: GhRepo[],
): ProfileStats {
  const live = repos.filter((r) => !r.fork && !r.archived);
  const totalStars = live.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
  const langCounts = new Map<string, number>();
  for (const r of live) {
    if (r.language) langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const topLanguages = [...langCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] < b[0] ? -1 : 1;
    })
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return {
    user: USER,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    totalStars,
    topLanguages,
  };
}

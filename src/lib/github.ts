export type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  updated_at: string;
  fork: boolean;
  archived: boolean;
};

const USER = "EduardF1";

export async function getRepos(): Promise<Repo[]> {
  const url = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated&type=owner`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error(`[github] ${res.status} ${res.statusText}`);
      return [];
    }
    const repos = (await res.json()) as Repo[];
    return repos.filter((r) => !r.fork && !r.archived);
  } catch (e) {
    console.error("[github] fetch failed", e);
    return [];
  }
}

export function summarize(repos: Repo[]) {
  const languages = new Map<string, number>();
  for (const r of repos) {
    if (r.language) languages.set(r.language, (languages.get(r.language) ?? 0) + 1);
  }
  return {
    total: repos.length,
    languages: [...languages.entries()].sort((a, b) => b[1] - a[1]),
  };
}

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GithubFeed } from "./github-feed";
import type { Repo } from "@/lib/github";

const fixtures: Repo[] = [
  {
    id: 1,
    name: "react-thing",
    full_name: "EduardF1/react-thing",
    html_url: "https://github.com/EduardF1/react-thing",
    description: "A React widget",
    language: "TypeScript",
    topics: ["react"],
    stargazers_count: 3,
    forks_count: 0,
    pushed_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    fork: false,
    archived: false,
  },
  {
    id: 2,
    name: "java-handson",
    full_name: "EduardF1/java-handson",
    html_url: "https://github.com/EduardF1/java-handson",
    description: "Practice repo",
    language: "Java",
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2023-01-15T00:00:00Z",
    updated_at: "2023-01-15T00:00:00Z",
    fork: false,
    archived: false,
  },
];

describe("<GithubFeed />", () => {
  it("renders all repos by default", () => {
    render(<GithubFeed repos={fixtures} />);
    expect(screen.getByText("react-thing")).toBeInTheDocument();
    expect(screen.getByText("java-handson")).toBeInTheDocument();
    expect(screen.getByText("2 of 2 shown")).toBeInTheDocument();
  });

  it("filters by language when a tag is clicked", async () => {
    const user = userEvent.setup();
    render(<GithubFeed repos={fixtures} />);
    await user.click(screen.getByRole("button", { name: /TypeScript \(1\)/ }));
    expect(screen.getByText("react-thing")).toBeInTheDocument();
    expect(screen.queryByText("java-handson")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 shown")).toBeInTheDocument();
  });

  it("filters by free-text search across name and description", async () => {
    const user = userEvent.setup();
    render(<GithubFeed repos={fixtures} />);
    const search = screen.getByPlaceholderText(/Search repos/i);
    await user.type(search, "practice");
    expect(screen.queryByText("react-thing")).not.toBeInTheDocument();
    expect(screen.getByText("java-handson")).toBeInTheDocument();
  });
});

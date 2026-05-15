import { describe, it, expect } from "vitest";
import {
  ipv4ToInt,
  isBotHit,
  isBotUserAgent,
  isDatacenterIp,
} from "./bot-detect";

describe("ipv4ToInt", () => {
  it("parses a normal dotted quad", () => {
    expect(ipv4ToInt("1.2.3.4")).toBe((1 << 24) + (2 << 16) + (3 << 8) + 4);
  });
  it("returns null for null, IPv6, or junk", () => {
    expect(ipv4ToInt(null)).toBeNull();
    expect(ipv4ToInt("::1")).toBeNull();
    expect(ipv4ToInt("not.an.ip.address")).toBeNull();
    expect(ipv4ToInt("1.2.3")).toBeNull();
    expect(ipv4ToInt("256.0.0.0")).toBeNull();
  });
});

describe("isBotUserAgent", () => {
  it("flags well-known crawlers", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(true);
    expect(isBotUserAgent("ClaudeBot/1.0")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; GPTBot/1.2)")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
  });
  it("flags headless / automation UAs", () => {
    expect(isBotUserAgent("HeadlessChrome/120.0.0.0")).toBe(true);
    expect(isBotUserAgent("playwright/1.59 (Chromium)")).toBe(true);
  });
  it("treats a missing UA as bot-like", () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
  });
  it("lets a normal Chrome UA through", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});

describe("isDatacenterIp", () => {
  it("matches a GCP us-central1 sample address (34.x.x.x)", () => {
    expect(isDatacenterIp("34.120.10.5")).toBe(true);
  });
  it("matches an AWS sample address (52.x.x.x)", () => {
    expect(isDatacenterIp("52.85.132.10")).toBe(true);
  });
  it("does not match an obviously residential ISP (109.x.x.x — Telia DK)", () => {
    expect(isDatacenterIp("109.58.10.10")).toBe(false);
  });
  it("does not match an IPv6 address (we only classify v4)", () => {
    expect(isDatacenterIp("2a00:1450:4001::1")).toBe(false);
  });
});

describe("isBotHit", () => {
  it("is true when only the UA matches", () => {
    expect(isBotHit({ ua: "Googlebot/2.1", ip: "1.1.1.1" })).toBe(true);
  });
  it("is true when only the IP matches a datacenter CIDR", () => {
    expect(
      isBotHit({
        ua: "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36",
        ip: "52.85.132.10",
      }),
    ).toBe(true);
  });
  it("is false when neither signal fires", () => {
    expect(
      isBotHit({
        ua: "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36",
        ip: "109.58.10.10",
      }),
    ).toBe(false);
  });
});

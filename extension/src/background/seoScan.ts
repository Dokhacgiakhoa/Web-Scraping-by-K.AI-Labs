import { SeoScanResult } from "../lib/types.js";

// IMPORTANT: this function is injected into the target page via
// chrome.scripting.executeScript({ func: seoScanInPage, args: [checks] }). Chrome serializes the
// function body and re-runs it in the page's isolated world, so it must not reference any
// variable from the outer (background) module scope — only `checks` (the passed argument) and
// standard web APIs (document, window, performance) are available inside.
export async function seoScanInPage(checks: string[]): Promise<SeoScanResult> {
  const result: Record<string, unknown> = {};

  if (checks.includes("on_page_basics")) {
    const title = document.title || "";
    const metaDescriptionEl = document.querySelector('meta[name="description"]');
    const metaDescription = metaDescriptionEl?.getAttribute("content") ?? "";
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => ({
      tag: h.tagName.toLowerCase(),
      text: (h.textContent ?? "").trim().slice(0, 120),
    }));
    const h1Count = headings.filter((h) => h.tag === "h1").length;
    const images = Array.from(document.querySelectorAll("img"));
    const imagesMissingAlt = images.filter((img) => !img.getAttribute("alt")).length;
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
    const lang = document.documentElement.getAttribute("lang") ?? null;

    const issues: string[] = [];
    if (!title) issues.push("Missing <title>");
    if (!metaDescription) issues.push("Missing meta description");
    else if (metaDescription.length < 50 || metaDescription.length > 160)
      issues.push("Meta description length outside 50-160 chars");
    if (h1Count === 0) issues.push("No H1 found");
    if (h1Count > 1) issues.push("Multiple H1s found");
    if (imagesMissingAlt > 0) issues.push(`${imagesMissingAlt} image(s) missing alt text`);
    if (!canonical) issues.push("Missing canonical link");
    if (!lang) issues.push("Missing html lang attribute");

    result.onPageBasics = {
      status: issues.length === 0 ? "pass" : issues.length <= 2 ? "warn" : "fail",
      details: issues.length === 0 ? "No on-page issues found." : issues.join("; "),
      data: {
        title,
        metaDescription,
        metaDescriptionLength: metaDescription.length,
        headingOutline: headings,
        h1Count,
        totalImages: images.length,
        imagesMissingAlt,
        canonical,
        robotsMeta,
        lang,
      },
    };
  }

  if (checks.includes("structured_data")) {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const types: string[] = [];
    let parseErrors = 0;

    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent ?? "");
        const collect = (node: any) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            node.forEach(collect);
            return;
          }
          if (node["@type"]) {
            const t = node["@type"];
            (Array.isArray(t) ? t : [t]).forEach((x: string) => types.push(x));
          }
          if (node["@graph"]) collect(node["@graph"]);
        };
        collect(json);
      } catch {
        parseErrors++;
      }
    }

    result.structuredData = {
      status: scripts.length === 0 ? "warn" : parseErrors > 0 ? "fail" : "pass",
      details:
        scripts.length === 0
          ? "No JSON-LD structured data found."
          : parseErrors > 0
          ? `${parseErrors} JSON-LD block(s) failed to parse.`
          : `Found ${scripts.length} JSON-LD block(s): ${[...new Set(types)].join(", ") || "no @type"}.`,
      data: { blockCount: scripts.length, types: [...new Set(types)], parseErrors },
    };
  }

  if (checks.includes("link_analysis")) {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const host = window.location.hostname;
    let internal = 0;
    let external = 0;
    let genericText = 0;
    const genericPhrases = ["click here", "read more", "here", "link"];

    for (const a of anchors) {
      let isInternal = true;
      try {
        const url = new URL(a.getAttribute("href") ?? "", window.location.href);
        isInternal = url.hostname === host;
      } catch {
        isInternal = true;
      }
      if (isInternal) internal++;
      else external++;

      const text = (a.textContent ?? "").trim().toLowerCase();
      if (!text || genericPhrases.includes(text)) genericText++;
    }

    result.linkAnalysis = {
      status: genericText > 5 ? "warn" : "pass",
      details: `${internal} internal, ${external} external link(s); ${genericText} with empty/generic anchor text.`,
      data: { internal, external, total: anchors.length, genericTextCount: genericText },
    };
  }

  if (checks.includes("core_web_vitals")) {
    const vitals: Record<string, number | null> = { lcp: null, cls: null, inp: null };

    await new Promise<void>((resolve) => {
      try {
        let clsScore = 0;
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as any;
          if (last) vitals.lcp = last.startTime;
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true } as any);

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) clsScore += entry.value;
          }
          vitals.cls = clsScore;
        });
        clsObserver.observe({ type: "layout-shift", buffered: true } as any);

        const eventObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (vitals.inp === null || entry.duration > vitals.inp) vitals.inp = entry.duration;
          }
        });
        eventObserver.observe({ type: "event", buffered: true, durationThreshold: 16 } as any);

        setTimeout(() => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          eventObserver.disconnect();
          resolve();
        }, 400);
      } catch {
        resolve();
      }
    });

    const issues: string[] = [];
    if (vitals.lcp !== null && vitals.lcp > 2500) issues.push("LCP above 2.5s");
    if (vitals.cls !== null && vitals.cls > 0.1) issues.push("CLS above 0.1");
    if (vitals.inp !== null && vitals.inp > 200) issues.push("INP above 200ms");

    result.coreWebVitals = {
      status: issues.length === 0 ? "pass" : "warn",
      details:
        issues.length === 0
          ? "Core Web Vitals look healthy (values captured so far)."
          : issues.join("; "),
      data: vitals,
    };
  }

  return result as SeoScanResult;
}

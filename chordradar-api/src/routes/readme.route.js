import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import hljs from 'highlight.js';
import GithubSlugger from 'github-slugger';

const slugger = new GithubSlugger();

// GitHub‑compatible Markdown configuration
marked.use({
  gfm: true,
  breaks: false,
  mangle: false,   // REQUIRED for slug accuracy
  headerIds: true // REQUIRED for anchor links
});

// GitHub-style heading IDs (# links)
const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  const slug = slugger.slug(text);
  return `
    <h${level} id="${slug}">
      <a class="anchor" href="#${slug}" aria-hidden="true"></a>
      ${text}
    </h${level}>
  `;
};

marked.setOptions({
  renderer,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// Cache README at startup
const README_HTML = marked(fs.readFileSync(path.join(process.cwd(), './docs/README.md'), 'utf8'));

export default function registerReadmeRoute(app) {
  app.get('/readme', (_, res) => {
    res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>README</title>

  <!-- GitHub Markdown Dark -->
  <link rel="stylesheet" href="https://unpkg.com/github-markdown-css@5/github-markdown-dark.css">

  <!-- Syntax Highlight -->
  <link rel="stylesheet" href="https://unpkg.com/highlight.js@11.9.0/styles/github-dark.css">

  <style>
    body {
      background-color: #0d1117;
      margin: 0;
    }

    .markdown-body {
      max-width: 980px;
      margin: 48px auto;
      padding: 0 24px;
    }

    .markdown-body pre {
      background-color: #161b22;
    }

    /* Optional: visible anchor icon like GitHub */
    .markdown-body .anchor {
      float: left;
      margin-left: -20px;
      padding-right: 4px;
    }
  </style>
</head>

<body>
  <article class="markdown-body">
    ${README_HTML}
  </article>
</body>
</html>
    `);
  });
}
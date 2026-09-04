/**
 * MarkdownBuilder — a tiny, dependency-free fluent builder for generating
 * Markdown (with embeddable raw HTML) suitable for Jekyll posts/pages.
 *
 * Usage:
 *   const MarkdownBuilder = require('./markdown-builder');
 *
 *   const md = new MarkdownBuilder()
 *     .frontMatter({ title: 'Hello World', date: '2026-08-27 10:00:00 +0200', tags: ['jekyll', 'demo'] })
 *     .h1('Hello World')
 *     .p(`This is a paragraph with ${MarkdownBuilder.bold('bold')} and ${MarkdownBuilder.link('a link', 'https://example.com')}.`)
 *     .html('<div class="note" markdown="1">\n**This bold text renders** because of markdown="1".\n</div>')
 *     .codeBlock("const x = 1;\nconsole.log(x);", 'js')
 *     .list(['one', 'two', 'three'])
 *     .table(['Name', 'Type'], [['title', 'string'], ['tags', 'array']])
 *     .hr()
 *     .build();
 *
 *   fs.writeFileSync('_posts/2026-08-27-hello-world.md', md);
 */
export class MarkdownBuilder {
  constructor() {
    this._parts = [];
    this._frontMatter = null;
  }

  // ---- Front matter (Jekyll YAML header) ----
  frontMatter(data) {
    this._frontMatter = data;
    return this;
  }

  _yaml(obj, indent = 0) {
    const pad = "  ".repeat(indent);
    return Object.entries(obj)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length === 0) return `${pad}${key}: []`;
          return (
            `${pad}${key}:\n` +
            value.map((v) => `${pad}  - ${this._yamlScalar(v)}`).join("\n")
          );
        } else if (value && (typeof value === "object")) {
          return `${pad}${key}:\n${this._yaml(value, indent + 1)}`;
        }
        return `${pad}${key}: ${this._yamlScalar(value)}`;
      })
      .join("\n");
  }

  _yamlScalar(v) {
    if (typeof v === "string") {
      // Quote if it contains YAML-special characters or leading/trailing whitespace.
      if (/[:#[\]{}|>*&!%@`"']/.test(v) || (v.trim() !== v)) {
        return `"${v.replace(/"/g, "\\\"")}"`;
      }
      return v;
    }
    return String(v);
  }

  // ---- Headings ----
  h1(text) { return this._push(`# ${text}`); }
  h2(text) { return this._push(`## ${text}`); }
  h3(text) { return this._push(`### ${text}`); }
  h4(text) { return this._push(`#### ${text}`); }
  heading(level, text) {
    const lvl = Math.min(Math.max(level, 1), 6);
    return this._push(`${"#".repeat(lvl)} ${text}`);
  }

  customHeading(level, text, classes) {
    return this._push(`<h${level} id="${text.toLowerCase()}" class="${classes}">${text}</h${level}>`);
  }

  // ---- Text blocks ----
  p(text) { return this._push(text); }

  blockquote(text) {
    const quoted = text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    return this._push(quoted);
  }

  // ---- Inline emphasis helpers (return strings, don't push) ----
  static bold(text) { return `**${text}**`; }
  static italic(text) { return `*${text}*`; }
  static code(text) { return `\`${text}\``; }
  static link(text, url) { return `[${text}](${url})`; }
  static image(alt, url, title) {
    return title ? `![${alt}](${url} "${title}")` : `![${alt}](${url})`;
  }

  // ---- Images ----
  img(alt, url, title, className) {
    let markdown = MarkdownBuilder.image(alt, url, title);
    if (className) {
      markdown += `{: .${className} }`;
    }
    return this._push(markdown);
  }

  // ---- Lists ----
  list(items, ordered = false) {
    const lines = items.map((item, i) =>
      ordered ? `${i + 1}. ${item}` : `- ${item}`,
    );
    return this._push(lines.join("\n"));
  }

  taskList(items) {
    // items: [{ text, done }]
    const lines = items.map((i) => `- [${i.done ? "x" : " "}] ${i.text}`);
    return this._push(lines.join("\n"));
  }

  // ---- Code blocks ----
  codeBlock(code, lang = "") {
    return this._push(`\`\`\`${lang}\n${code}\n\`\`\``);
  }

  // ---- Tables ----
  table(headers, rows) {
    const headerLine = `| ${headers.join(" | ")} |`;
    const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
    const rowLines = rows.map((r) => `| ${r.join(" | ")} |`);
    return this._push([headerLine, sepLine, ...rowLines].join("\n"));
  }

  // ---- Raw HTML passthrough ----
  // Remember: Kramdown needs a blank line before/after block-level HTML,
  // and add markdown="1" on the tag if you want Markdown to render inside it.
  html(rawHtml) {
    return this._push(rawHtml);
  }

  lines(lines) {
    for (const line of lines) {
      this._push(line);
    }
    return this;
  }

  // ---- Layout: side-by-side row ----
  // Wraps multiple items in a flexbox row, each in its own column div.
  // Each item's content can be Markdown or raw HTML - it's wrapped with
  // markdown="1" so Kramdown will still render Markdown syntax inside it.
  //
  //   .row(['**Left** column', '<img src="/a.png">', 'Right column'])
  //
  // Optional second arg lets you tweak gap/alignment/column widths:
  //   .row(items, { gap: '2rem', align: 'flex-start', widths: ['1fr', '2fr', '1fr'] })
  row(items, className = "") {
    const columns = items
      .map((item) => `  <div markdown="1">\n\n${item}\n\n  </div>`)
      .join("\n");

    const rowHtml =
      `<div class="${className}">\n\n` + `${columns}\n\n` + "</div>";

    return this._push(rowHtml);
  }

  // ---- Misc ----
  hr() { return this._push("---"); }
  raw(text) { return this._push(text); }

  // ---- Internal ----
  _push(block) {
    this._parts.push(block);
    return this;
  }

  build() {
    const body = this._parts.join("\n\n");
    if (this._frontMatter) {
      return `---\n${this._yaml(this._frontMatter)}\n---\n\n${body}\n`;
    }
    return `${body}\n`;
  }
}

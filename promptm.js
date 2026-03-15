#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

const program = new Command();

program
  .name('ccprompt')
  .description('AI coding prompts as Claude Code slash commands')
  .version('2.0.0');

// --- Helper functions ---

function getTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function installWithFrontmatter(srcPath, destPath) {
  let content = fs.readFileSync(srcPath, 'utf-8');
  if (!content.startsWith('---')) {
    const whenLine = content.split('\n').find(l => l.includes('When to use:'));
    const desc = whenLine
      ? whenLine.replace('**When to use:**', '').replace(/\*\*/g, '').trim()
      : 'Prompt managed by ccprompt';
    content = `---\ndescription: "${desc.replace(/"/g, '\\"')}"\n---\n\n${content}`;
  }
  fs.writeFileSync(destPath, content);
}

function validateName(name) {
  if (!name || /[/\\:*?"<>|]/.test(name) || name.includes('..') || name.startsWith('.')) {
    console.error(`Invalid name: "${name}". Avoid special characters, "..", and leading dots.`);
    process.exit(1);
  }
  return name;
}

// --- Commands ---

program
  .command('templates')
  .description('List all available prompt templates')
  .action(() => {
    const templates = getTemplates();
    if (templates.length === 0) {
      console.log('No templates found.');
      return;
    }
    console.log(`\nAvailable templates (${templates.length}):\n`);
    for (const t of templates) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, `${t}.md`), 'utf-8');
      const firstLine = content.split('\n').find(l => l.startsWith('# '));
      const whenLine = content.split('\n').find(l => l.includes('When to use:'));
      console.log(`  ${t}`);
      if (firstLine) console.log(`    ${firstLine.replace('# ', '')}`);
      if (whenLine) console.log(`    ${whenLine.replace('**When to use:**', '').trim()}`);
      console.log();
    }
  });

program
  .command('install [projectPath]')
  .description('Install templates as slash commands in your project')
  .action((projectPath) => {
    const templates = getTemplates();
    if (templates.length === 0) {
      console.error('No templates found. Package may be corrupted.');
      process.exit(1);
    }

    const resolvedPath = path.resolve(projectPath || '.');
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    const commandsDir = path.join(resolvedPath, '.claude', 'commands');
    ensureDir(commandsDir);

    let installed = 0;
    for (const templateName of templates) {
      const src = path.join(TEMPLATES_DIR, `${templateName}.md`);
      if (!fs.existsSync(src)) continue;
      installWithFrontmatter(src, path.join(commandsDir, `${templateName}.md`));
      installed++;
    }

    console.log(`\n${installed} slash commands installed to ${resolvedPath}/.claude/commands/`);
    console.log('\nAvailable commands in Claude Code:');
    for (const t of templates) {
      console.log(`  /${t}`);
    }
  });

program
  .command('show <template>')
  .description('Display a template in the terminal')
  .action((template) => {
    const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
    if (!fs.existsSync(templatePath)) {
      console.error(`Template "${template}" not found. Use 'ccprompt templates' to see available.`);
      process.exit(1);
    }
    console.log(fs.readFileSync(templatePath, 'utf-8'));
  });

program
  .command('copy <template>')
  .description('Copy a template to clipboard')
  .action((template) => {
    const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
    if (!fs.existsSync(templatePath)) {
      console.error(`Template "${template}" not found. Use 'ccprompt templates' to see available.`);
      process.exit(1);
    }

    const content = fs.readFileSync(templatePath, 'utf-8');
    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        execSync('clip', { input: content });
      } else if (process.platform === 'darwin') {
        execSync('pbcopy', { input: content });
      } else {
        try { execSync('xclip -selection clipboard', { input: content }); }
        catch {
          try { execSync('xsel --clipboard --input', { input: content }); }
          catch { execSync('wl-copy', { input: content }); }
        }
      }
      console.log(`Copied "${template}" to clipboard.`);
    } catch {
      console.error('Could not copy to clipboard. Use "ccprompt show" instead.');
      process.exit(1);
    }
  });

program
  .command('new-template <name>')
  .description('Create a new prompt template')
  .option('-t, --title <title>', 'Template title')
  .option('-w, --when <when>', 'When to use this template')
  .option('-r, --role <role>', 'Role description for the AI')
  .action((name, opts) => {
    validateName(name);
    const templatePath = path.join(TEMPLATES_DIR, `${name}.md`);
    if (fs.existsSync(templatePath)) {
      console.error(`Template "${name}" already exists. Edit it directly: templates/${name}.md`);
      process.exit(1);
    }

    const title = opts.title || name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const when = opts.when || 'Describe when to use this template.';
    const role = opts.role || 'You are an expert assistant focused on this task.';

    const content = `# ${title}

**When to use:** ${when}

**Role:** ${role}

---

**Task:** $ARGUMENTS

## Step 1: [First Step]

[What to do first]

## Step 2: [Second Step]

[What to do next]

## Step 3: [Third Step]

[Continue the protocol]

## Output Format

\`\`\`
[Define expected output structure]
\`\`\`

## Success Criteria

- [How do we know this worked?]
- [What does "done" look like?]
`;

    fs.writeFileSync(templatePath, content);
    console.log(`\nTemplate "${name}" created at: templates/${name}.md`);
    console.log('Edit it, then run: ccprompt install');
  });

program.parse();

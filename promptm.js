#!/usr/bin/env node

const { Command } = require('commander');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Load .env from multiple locations: project dir, home dir (~/.ccprompt/.env)
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (!process.env.ANTHROPIC_API_KEY) {
  require('dotenv').config({ path: path.join(os.homedir(), '.ccprompt', '.env') });
}

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DATA_DIR = path.join(os.homedir(), '.ccprompt');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const DEFAULT_MODEL = process.env.CCPROMPT_MODEL || 'claude-sonnet-4-20250514';

const program = new Command();

program
  .name('ccprompt')
  .description('Individualize general prompts for specific projects')
  .version('1.1.0');

// --- Helper functions ---

function getTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  try {
    return fs.readdirSync(PROJECTS_DIR)
      .filter(f => {
        try { return fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory(); }
        catch { return false; }
      });
  } catch { return []; }
}

function getProjectContext(projectName) {
  const contextPath = path.join(PROJECTS_DIR, projectName, 'context.json');
  if (!fs.existsSync(contextPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
  } catch (err) {
    console.error(`Warning: Could not read context for "${projectName}": ${err.message}`);
    return null;
  }
}

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory "${dir}": ${err.message}`);
    process.exit(1);
  }
}

// claude --print removed — using OAuth tokens from Claude Code subscriptions
// in third-party tools violates Anthropic's Consumer Terms of Service.
// Individualization requires an Anthropic API key.

function validateName(name) {
  if (!name || /[/\\:*?"<>|]/.test(name) || name.includes('..') || name.startsWith('.')) {
    console.error(`Invalid project/template name: "${name}". Avoid special characters, "..", and leading dots.`);
    process.exit(1);
  }
  return name;
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${question} (y/N) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function buildContextString(ctx) {
  const parts = [
    `- Name: ${ctx.name}`,
    `- Description: ${ctx.description}`,
    `- Tech stack: ${ctx.stack}`,
  ];
  if (ctx.projectPath) parts.push(`- Project path: ${ctx.projectPath}`);
  if (ctx.architecture) parts.push(`- Architecture: ${ctx.architecture}`);
  if (ctx.keyFiles && ctx.keyFiles.length > 0) parts.push(`- Key files: ${ctx.keyFiles.join(', ')}`);
  if (ctx.keyDocs && ctx.keyDocs.length > 0) parts.push(`- Key docs: ${ctx.keyDocs.join(', ')}`);
  if (ctx.commands) {
    const cmds = Object.entries(ctx.commands).map(([k, v]) => `${k}: \`${v}\``).join(', ');
    parts.push(`- Commands: ${cmds}`);
  }
  if (ctx.conventions) parts.push(`- Conventions: ${ctx.conventions}`);
  if (ctx.knownIssues) parts.push(`- Known issues: ${ctx.knownIssues}`);
  if (ctx.gitWorkflow) parts.push(`- Git workflow: ${ctx.gitWorkflow}`);
  if (ctx.folderStructure) parts.push(`- Folder structure:\n${ctx.folderStructure}`);

  // Read actual CLAUDE.md content for richer individualization
  if (ctx.projectPath) {
    try {
      const claudeMdPath = path.join(ctx.projectPath, 'CLAUDE.md');
      if (fs.existsSync(claudeMdPath)) {
        const claudeContent = fs.readFileSync(claudeMdPath, 'utf-8');
        const cleaned = claudeContent.replace(/<!-- CCPROMPT:START -->[\s\S]*?<!-- CCPROMPT:END -->/g, '').trim();
        if (cleaned.length > 0) {
          parts.push(`- Project CLAUDE.md (AI instructions):\n${cleaned.substring(0, 3000)}`);
        }
      }
    } catch { /* CLAUDE.md read is best-effort */ }
  }

  return parts.join('\n');
}

function installWithFrontmatter(srcPath, destPath) {
  try {
    let content = fs.readFileSync(srcPath, 'utf-8');
    if (!content.startsWith('---')) {
      const whenLine = content.split('\n').find(l => l.includes('When to use:'));
      const desc = whenLine
        ? whenLine.replace('**When to use:**', '').replace(/\*\*/g, '').trim()
        : 'Prompt managed by ccprompt';
      content = `---\ndescription: "${desc.replace(/"/g, '\\"')}"\n---\n\n${content}`;
    }
    fs.writeFileSync(destPath, content);
  } catch (err) {
    console.error(`  Error installing ${path.basename(srcPath)}: ${err.message}`);
  }
}

// --- Shared detection logic for scan/rescan ---

const STACK_DEPS = [
  ['next', 'Next.js'], ['react', 'React'], ['vue', 'Vue'],
  ['@angular/core', 'Angular'], ['@nestjs/core', 'NestJS'],
  ['express', 'Express'], ['fastify', 'Fastify'],
  ['prisma', 'Prisma'], ['@prisma/client', 'Prisma'],
  ['typeorm', 'TypeORM'], ['drizzle-orm', 'Drizzle'],
  ['tailwindcss', 'Tailwind CSS'], ['typescript', 'TypeScript'],
  ['supabase', 'Supabase'], ['@supabase/supabase-js', 'Supabase'],
  ['stripe', 'Stripe'], ['@stripe/stripe-js', 'Stripe'],
  ['remotion', 'Remotion'], ['jest', 'Jest'], ['vitest', 'Vitest'],
  ['playwright', 'Playwright'], ['@playwright/test', 'Playwright'],
  ['phaser', 'Phaser'], ['three', 'Three.js'], ['socket.io', 'Socket.IO'],
  ['mongoose', 'MongoDB/Mongoose'], ['pg', 'PostgreSQL'],
  ['redis', 'Redis'], ['ioredis', 'Redis'],
  ['@auth/core', 'NextAuth'], ['next-auth', 'NextAuth'],
  ['zod', 'Zod'], ['trpc', 'tRPC'], ['@trpc/server', 'tRPC'],
  ['astro', 'Astro'], ['svelte', 'Svelte'], ['@sveltejs/kit', 'SvelteKit'],
  ['esbuild', 'esbuild'], ['vite', 'Vite'], ['webpack', 'Webpack'],
];

const DOC_FILES = ['CLAUDE.md', 'README.md', 'HANDOVER.md', 'PRINCIPLES.md', 'ARCHITECTURE.md'];

const ENTRY_FILES = [
  'src/main.ts', 'src/index.ts', 'src/app.ts',
  'src/main.tsx', 'src/index.tsx', 'src/App.tsx', 'src/App.jsx',
  'app/layout.tsx', 'app/page.tsx',
  'pages/index.tsx', 'pages/_app.tsx',
  'src/app.module.ts',
  'main.py', 'app.py', 'manage.py',
  'main.go', 'cmd/main.go',
  'src/main.rs', 'src/lib.rs',
  'src/Main.java', 'src/App.java',
  'Program.cs',
];

function detectStackFromDeps(allDeps) {
  const seen = new Set();
  const parts = [];
  for (const [dep, label] of STACK_DEPS) {
    if (allDeps[dep] && !seen.has(label)) {
      seen.add(label);
      parts.push(label);
    }
  }
  return parts;
}

function detectConventions(projectPath) {
  const conventions = [];
  if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) conventions.push('TypeScript');
  if (fs.existsSync(path.join(projectPath, '.eslintrc.js')) ||
      fs.existsSync(path.join(projectPath, '.eslintrc.json')) ||
      fs.existsSync(path.join(projectPath, 'eslint.config.js')) ||
      fs.existsSync(path.join(projectPath, 'eslint.config.mjs'))) conventions.push('ESLint');
  if (fs.existsSync(path.join(projectPath, '.prettierrc')) ||
      fs.existsSync(path.join(projectPath, '.prettierrc.json')) ||
      fs.existsSync(path.join(projectPath, 'prettier.config.js'))) conventions.push('Prettier');
  return conventions;
}

function detectDocs(projectPath) {
  return DOC_FILES.filter(doc => fs.existsSync(path.join(projectPath, doc)));
}

function detectFolderStructure(projectPath) {
  try {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => `  ${e.name}/`)
      .slice(0, 20);
  } catch { return []; }
}

function detectEntryFiles(projectPath) {
  return ENTRY_FILES.filter(ef => fs.existsSync(path.join(projectPath, ef)));
}

function detectDescription(projectPath) {
  // Try README.md
  const readmePath = path.join(projectPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    try {
      const readme = fs.readFileSync(readmePath, 'utf-8');
      const lines = readme.split('\n').filter(l =>
        l.trim() && !l.startsWith('#') && !l.startsWith('```') &&
        !l.startsWith('<!--') && !l.startsWith('|') && !l.startsWith('-') &&
        !l.startsWith('*') && !l.startsWith('[') && l.trim().length > 10
      );
      if (lines.length > 0) return lines[0].trim().substring(0, 200);
    } catch { /* ignore */ }
  }
  // Try CLAUDE.md
  const claudePath = path.join(projectPath, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    try {
      const claude = fs.readFileSync(claudePath, 'utf-8');
      const lines = claude.split('\n').filter(l =>
        l.trim() && !l.startsWith('#') && !l.startsWith('```') &&
        !l.startsWith('-') && l.trim().length > 10
      );
      if (lines.length > 0) return lines[0].trim().substring(0, 200);
    } catch { /* ignore */ }
  }
  return null;
}

function scanProject(resolvedPath, existingCtx) {
  const result = {
    stack: null,
    description: existingCtx ? existingCtx.description : null,
    commands: {},
    keyDocs: [],
    keyFiles: [],
    conventions: null,
    folderStructure: null,
  };

  // Detect package.json
  const pkgPath = path.join(resolvedPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.description && (!existingCtx || pkg.description.length > 5)) {
        result.description = pkg.description;
      }

      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const stackParts = detectStackFromDeps(allDeps);
      result.stack = stackParts.join(', ') || 'Node.js';

      if (pkg.scripts) {
        if (pkg.scripts.dev) result.commands.dev = 'npm run dev';
        if (pkg.scripts.start) result.commands.start = 'npm start';
        if (pkg.scripts.build) result.commands.build = 'npm run build';
        if (pkg.scripts.test) result.commands.test = 'npm test';
        if (pkg.scripts.lint) result.commands.lint = 'npm run lint';
      }
      console.log(`  Found package.json → ${result.stack}`);
    } catch (err) {
      console.log(`  Warning: Could not parse package.json: ${err.message}`);
    }
  }

  // Detect Python project
  const pyprojectPath = path.join(resolvedPath, 'pyproject.toml');
  const requirementsPath = path.join(resolvedPath, 'requirements.txt');
  if (fs.existsSync(pyprojectPath)) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Python';
    result.commands.test = result.commands.test || 'pytest';
    console.log('  Found pyproject.toml → Python');
  } else if (fs.existsSync(requirementsPath)) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Python';
    result.commands.test = result.commands.test || 'pytest';
    console.log('  Found requirements.txt → Python');
  }

  // Detect Go project
  if (fs.existsSync(path.join(resolvedPath, 'go.mod'))) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Go';
    result.commands.build = result.commands.build || 'go build ./...';
    result.commands.test = result.commands.test || 'go test ./...';
    console.log('  Found go.mod → Go');
  }

  // Detect Rust project
  if (fs.existsSync(path.join(resolvedPath, 'Cargo.toml'))) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Rust';
    result.commands.build = result.commands.build || 'cargo build';
    result.commands.test = result.commands.test || 'cargo test';
    console.log('  Found Cargo.toml → Rust');
  }

  // Detect Java project
  if (fs.existsSync(path.join(resolvedPath, 'pom.xml'))) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Java (Maven)';
    result.commands.build = result.commands.build || 'mvn package';
    result.commands.test = result.commands.test || 'mvn test';
    console.log('  Found pom.xml → Java (Maven)');
  } else if (fs.existsSync(path.join(resolvedPath, 'build.gradle')) || fs.existsSync(path.join(resolvedPath, 'build.gradle.kts'))) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Java (Gradle)';
    result.commands.build = result.commands.build || './gradlew build';
    result.commands.test = result.commands.test || './gradlew test';
    console.log('  Found build.gradle → Java (Gradle)');
  }

  // Detect C# / .NET project
  try {
    const csprojFiles = fs.readdirSync(resolvedPath).filter(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    if (csprojFiles.length > 0) {
      result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'C# (.NET)';
      result.commands.build = result.commands.build || 'dotnet build';
      result.commands.test = result.commands.test || 'dotnet test';
      console.log(`  Found ${csprojFiles[0]} → C# (.NET)`);
    }
  } catch { /* skip */ }

  // Detect Docker
  if (fs.existsSync(path.join(resolvedPath, 'Dockerfile')) || fs.existsSync(path.join(resolvedPath, 'docker-compose.yml')) || fs.existsSync(path.join(resolvedPath, 'docker-compose.yaml'))) {
    result.stack = (result.stack || '') + (result.stack ? ', ' : '') + 'Docker';
    console.log('  Found Docker configuration');
  }

  // Detect docs, conventions, structure, entry files
  result.keyDocs = detectDocs(resolvedPath);
  if (result.keyDocs.length > 0) console.log(`  Found docs: ${result.keyDocs.join(', ')}`);

  const conventions = detectConventions(resolvedPath);
  if (conventions.length > 0) {
    result.conventions = conventions.join(', ');
    console.log(`  Detected conventions: ${result.conventions}`);
  }

  const dirs = detectFolderStructure(resolvedPath);
  if (dirs.length > 0) {
    result.folderStructure = dirs.join('\n');
    console.log(`  Folder structure: ${dirs.length} directories detected`);
  }

  result.keyFiles = detectEntryFiles(resolvedPath);
  if (result.keyFiles.length > 0) console.log(`  Key files: ${result.keyFiles.join(', ')}`);

  // Fallback description
  if (!result.description) {
    result.description = detectDescription(resolvedPath);
  }

  return result;
}

// --- CLAUDE.md update helper ---

function updateClaudeMd(projectPath, templates, commandsDir) {
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) return;

  const MARKER_START = '<!-- CCPROMPT:START -->';
  const MARKER_END = '<!-- CCPROMPT:END -->';

  const commandsBlock = `\n## Available Prompt Commands\n\nUse these slash commands for structured AI workflows (managed by ccprompt):\n${templates.map(f => {
    const name = f.replace('.md', '');
    const filePath = path.join(commandsDir, f);
    if (!fs.existsSync(filePath)) return `- \`/${name}\``;
    const content = fs.readFileSync(filePath, 'utf-8');
    const whenLine = content.split('\n').find(l => l.includes('When to use:'));
    const desc = whenLine ? whenLine.replace('**When to use:**', '').trim() : '';
    return `- \`/${name}\` – ${desc}`;
  }).join('\n')}\n`;

  let claudeContent = fs.readFileSync(claudeMdPath, 'utf-8');
  if (claudeContent.includes(MARKER_START)) {
    const regex = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`, 'g');
    claudeContent = claudeContent.replace(regex, `${MARKER_START}\n${commandsBlock}${MARKER_END}`);
  } else {
    claudeContent += `\n${MARKER_START}\n${commandsBlock}${MARKER_END}\n`;
  }
  fs.writeFileSync(claudeMdPath, claudeContent);
}

// --- Generate helper (shared by generate, regenerate-all, refresh) ---

async function generateForProject(project, ctx, opts = {}) {
  const { force = false, templateFilter = null } = opts;

  const templates = templateFilter ? [templateFilter] : getTemplates();
  const projectDir = path.join(PROJECTS_DIR, project);
  ensureDir(projectDir);

  const contextString = buildContextString(ctx);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{CONTEXT}', contextString);

  let succeeded = 0;
  let failed = 0;
  let cached = 0;

  const cacheDir = path.join(projectDir, '.cache');
  ensureDir(cacheDir);

  const toGenerate = [];
  for (const templateName of templates) {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.md`);
    if (!fs.existsSync(templatePath)) {
      console.log(`  ${templateName}... SKIPPED (template not found)`);
      continue;
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const cacheHash = crypto.createHash('md5')
      .update(templateContent + contextString)
      .digest('hex');
    const cacheFile = path.join(cacheDir, `${templateName}.hash`);
    const outputPath = path.join(projectDir, `${templateName}.md`);

    if (!force && fs.existsSync(cacheFile) && fs.existsSync(outputPath)) {
      const existingHash = fs.readFileSync(cacheFile, 'utf-8').trim();
      if (existingHash === cacheHash) {
        console.log(`  ${templateName}... cached (unchanged) ✓`);
        cached++;
        succeeded++;
        continue;
      }
    }

    toGenerate.push({ templateName, templateContent, cacheHash, cacheFile, outputPath });
  }

  if (toGenerate.length > 0) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('No ANTHROPIC_API_KEY set.');
      console.error('Individualization requires an Anthropic API key.');
      console.error('Set it in ~/.ccprompt/.env or use "ccprompt install-generic" for free generic templates.');
      process.exit(1);
    }
    const callFn = callClaude;
    const BATCH_SIZE = 5;
    const mode = 'in parallel';
    console.log(`  Generating ${toGenerate.length} prompt(s) ${mode}...`);

    for (let i = 0; i < toGenerate.length; i += BATCH_SIZE) {
      const batch = toGenerate.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async ({ templateName, templateContent, cacheHash, cacheFile, outputPath }) => {
          const result = await callFn(
            systemPrompt,
            `Individualize this prompt template for the "${ctx.name}" project:\n\n${templateContent}`
          );
          fs.writeFileSync(outputPath, result);
          fs.writeFileSync(cacheFile, cacheHash);
          return templateName;
        })
      );

      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        const name = batch[j].templateName;
        if (r.status === 'fulfilled') {
          console.log(`  ${name}... done ✓`);
          succeeded++;
        } else {
          console.log(`  ${name}... FAILED ✗ ${r.reason.message}`);
          failed++;
        }
      }
    }
  }

  return { succeeded, failed, cached };
}

// --- Install helper (shared by install, install-all, refresh) ---

function installForProject(project, ctx, opts = {}) {
  const { templateFilter = null } = opts;
  const projectDir = path.join(PROJECTS_DIR, project);
  const commandsDir = path.join(ctx.projectPath, '.claude', 'commands');
  ensureDir(commandsDir);

  // Clean up old .claude/prompts/
  const oldPromptsDir = path.join(ctx.projectPath, '.claude', 'prompts');
  if (fs.existsSync(oldPromptsDir)) {
    fs.rmSync(oldPromptsDir, { recursive: true });
    console.log('  Removed old .claude/prompts/ (migrated to .claude/commands/)');
  }

  const templates = templateFilter ? [`${templateFilter}.md`] :
    fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));

  let installed = 0;
  for (const file of templates) {
    const src = path.join(projectDir, file);
    if (!fs.existsSync(src)) continue;
    installWithFrontmatter(src, path.join(commandsDir, file));
    installed++;
  }

  updateClaudeMd(ctx.projectPath, templates, commandsDir);
  return { installed, templates };
}

// --- Rescan helper ---

function rescanProject(project) {
  const ctx = getProjectContext(project);
  if (!ctx) {
    console.error(`Project "${project}" not found.`);
    process.exit(1);
  }
  if (!ctx.projectPath || !fs.existsSync(ctx.projectPath)) {
    console.error(`Project path not found. Use: ccprompt update "${project}" to set a path.`);
    process.exit(1);
  }

  const resolvedPath = ctx.projectPath;
  console.log(`\nRescanning "${resolvedPath}"...\n`);

  const manualFields = {
    architecture: ctx.architecture,
    knownIssues: ctx.knownIssues,
    gitWorkflow: ctx.gitWorkflow,
  };

  const detected = scanProject(resolvedPath, ctx);

  ctx.stack = detected.stack || ctx.stack;
  if (detected.description) ctx.description = detected.description;
  ctx.commands = Object.keys(detected.commands).length > 0 ? detected.commands : ctx.commands;
  ctx.keyDocs = detected.keyDocs;
  ctx.keyFiles = detected.keyFiles;
  if (detected.conventions) ctx.conventions = detected.conventions;
  if (detected.folderStructure) ctx.folderStructure = detected.folderStructure;

  // Restore manual fields
  if (manualFields.architecture) ctx.architecture = manualFields.architecture;
  if (manualFields.knownIssues) ctx.knownIssues = manualFields.knownIssues;
  if (manualFields.gitWorkflow) ctx.gitWorkflow = manualFields.gitWorkflow;

  ctx.updatedAt = new Date().toISOString();

  const projectDir = path.join(PROJECTS_DIR, project);
  fs.writeFileSync(path.join(projectDir, 'context.json'), JSON.stringify(ctx, null, 2));

  console.log(`\nProject "${project}" rescanned. Manual fields preserved.`);
  return ctx;
}

// --- Data migration ---

function migrateFromOldLocation() {
  const oldProjectsDir = path.join(__dirname, 'projects');
  if (!fs.existsSync(oldProjectsDir)) return;
  if (oldProjectsDir === PROJECTS_DIR) return; // Same location, no migration needed

  const entries = fs.readdirSync(oldProjectsDir);
  if (entries.length === 0) return;

  ensureDir(PROJECTS_DIR);
  let migrated = 0;
  for (const entry of entries) {
    const src = path.join(oldProjectsDir, entry);
    const dest = path.join(PROJECTS_DIR, entry);
    try {
      if (fs.statSync(src).isDirectory() && !fs.existsSync(dest)) {
        fs.cpSync(src, dest, { recursive: true });
        migrated++;
      }
    } catch { /* skip problematic entries */ }
  }
  if (migrated > 0) {
    console.log(`Migrated ${migrated} project(s) from local to ~/.ccprompt/projects/`);
    console.log(`You can safely delete the old "projects/" directory.\n`);
  }
}

// Run migration on startup
migrateFromOldLocation();


const SYSTEM_PROMPT_TEMPLATE = `You are an expert prompt engineer specializing in AI coding assistant prompts. Your job is to take a general-purpose prompt template and individualize it for a specific software project.

The project context:
{CONTEXT}

Rules for individualization:
1. Keep the EXACT structure, tone, and urgency of the original template
2. Replace generic instructions with CONCRETE ones for this project:
   - Generic "read the codebase" → Specific "read src/app.module.ts, src/main.ts, and CLAUDE.md"
   - Generic "run tests" → Specific "run npm test" or "run pytest"
   - Generic "check configs" → Specific "check tsconfig.json, .eslintrc, next.config.js"
3. Add project-specific gotchas, known issues, and conventions where relevant
4. Reference actual file paths, commands, and tools this project uses
5. The output must be a complete, ready-to-paste prompt in markdown format
6. Do NOT add generic filler – every line must be actionable for THIS project
7. If you don't have enough context to be specific, keep the original generic instruction rather than guessing
8. PRESERVE all $ARGUMENTS placeholders exactly as-is – they are runtime variables filled by the user`;

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  if (!response.content || !response.content[0] || !response.content[0].text) {
    throw new Error('Unexpected API response format');
  }

  return response.content[0].text;
}

// --- Commands ---

program
  .command('templates')
  .description('List all available prompt templates')
  .action(() => {
    const templates = getTemplates();
    if (templates.length === 0) {
      console.log('No templates found in templates/');
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
  .command('list')
  .description('List all registered projects')
  .action(() => {
    const projects = getProjects();
    if (projects.length === 0) {
      console.log('No projects registered. Use: ccprompt init <name> or ccprompt scan <path>');
      return;
    }
    console.log(`\nRegistered projects (${projects.length}):\n`);
    for (const p of projects) {
      const ctx = getProjectContext(p);
      console.log(`  ${p}`);
      if (ctx) {
        if (ctx.description) console.log(`    ${ctx.description}`);
        if (ctx.stack) console.log(`    Stack: ${ctx.stack}`);
      }
      const projectDir = path.join(PROJECTS_DIR, p);
      try {
        const prompts = fs.readdirSync(projectDir)
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''));
        if (prompts.length > 0) {
          console.log(`    Prompts: ${prompts.join(', ')}`);
        }
      } catch { /* skip */ }
      console.log();
    }
  });

program
  .command('init <name>')
  .description('Register a new project manually')
  .requiredOption('-d, --desc <description>', 'Project description')
  .requiredOption('-s, --stack <stack>', 'Tech stack (comma-separated)')
  .option('-p, --path <path>', 'Project root path')
  .option('-f, --files <files>', 'Key files (comma-separated)')
  .option('-a, --arch <architecture>', 'Architecture pattern (e.g., Clean, MVC, Layered)')
  .option('--conventions <conventions>', 'Code conventions')
  .option('--issues <issues>', 'Known issues or tech debt')
  .action((name, opts) => {
    validateName(name);
    const projectDir = path.join(PROJECTS_DIR, name);
    ensureDir(projectDir);

    const context = {
      name,
      description: opts.desc,
      stack: opts.stack,
      projectPath: opts.path ? path.resolve(opts.path) : null,
      architecture: opts.arch || null,
      keyFiles: opts.files ? opts.files.split(',').map(f => f.trim()) : [],
      keyDocs: [],
      commands: {},
      conventions: opts.conventions || null,
      knownIssues: opts.issues || null,
      gitWorkflow: null,
      folderStructure: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(projectDir, 'context.json'),
      JSON.stringify(context, null, 2)
    );

    console.log(`\nProject "${name}" registered.`);
    console.log(`Context saved to: ~/.ccprompt/projects/${name}/context.json`);
    console.log(`\nTip: Use 'ccprompt scan <project-path> --name "${name}"' for richer auto-detected context.`);
    console.log(`Next: ccprompt generate "${name}" to create individualized prompts.`);
  });

program
  .command('scan <projectPath>')
  .description('Auto-detect project context by scanning actual files')
  .option('-n, --name <name>', 'Project name (defaults to folder name)')
  .action((projectPath, opts) => {
    const resolvedPath = path.resolve(projectPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    const folderName = path.basename(resolvedPath);
    const name = opts.name || folderName;
    validateName(name);
    const projectDir = path.join(PROJECTS_DIR, name);
    ensureDir(projectDir);

    console.log(`\nScanning "${resolvedPath}"...\n`);

    const detected = scanProject(resolvedPath, null);

    const context = {
      name,
      description: detected.description,
      stack: detected.stack,
      projectPath: resolvedPath,
      architecture: null,
      keyFiles: detected.keyFiles,
      keyDocs: detected.keyDocs,
      commands: detected.commands,
      conventions: detected.conventions,
      knownIssues: null,
      gitWorkflow: null,
      folderStructure: detected.folderStructure,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(projectDir, 'context.json'),
      JSON.stringify(context, null, 2)
    );

    console.log(`\nProject "${name}" scanned and registered.`);
    console.log(`Context saved to: ~/.ccprompt/projects/${name}/context.json`);
    console.log(`\nReview and edit context.json to add: description, architecture, knownIssues, gitWorkflow`);
    console.log(`Then: ccprompt generate "${name}"`);
  });

program
  .command('rescan <project>')
  .description('Re-scan a project to update auto-detected context (preserves manual edits)')
  .action((project) => {
    rescanProject(project);
    console.log(`Run: ccprompt generate "${project}" to update individualized prompts.`);
  });

program
  .command('update <project>')
  .description('Update project context fields')
  .option('-d, --desc <description>', 'Project description')
  .option('-s, --stack <stack>', 'Tech stack')
  .option('-a, --arch <architecture>', 'Architecture pattern')
  .option('--conventions <conventions>', 'Code conventions')
  .option('--issues <issues>', 'Known issues')
  .option('--git-workflow <workflow>', 'Git workflow')
  .action((project, opts) => {
    const ctx = getProjectContext(project);
    if (!ctx) {
      console.error(`Project "${project}" not found.`);
      process.exit(1);
    }

    if (opts.desc) ctx.description = opts.desc;
    if (opts.stack) ctx.stack = opts.stack;
    if (opts.arch) ctx.architecture = opts.arch;
    if (opts.conventions) ctx.conventions = opts.conventions;
    if (opts.issues) ctx.knownIssues = opts.issues;
    if (opts.gitWorkflow) ctx.gitWorkflow = opts.gitWorkflow;
    ctx.updatedAt = new Date().toISOString();

    const projectDir = path.join(PROJECTS_DIR, project);
    fs.writeFileSync(
      path.join(projectDir, 'context.json'),
      JSON.stringify(ctx, null, 2)
    );

    console.log(`\nProject "${project}" updated.`);
  });

program
  .command('generate <project>')
  .description('Generate individualized prompts for a project')
  .option('-t, --template <name>', 'Generate only a specific template')
  .option('--dry-run', 'Show what would be sent to the API without making calls')
  .option('--force', 'Regenerate even if cached (ignore cache)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (project, opts) => {
    const ctx = getProjectContext(project);
    if (!ctx) {
      console.error(`Project "${project}" not found. Use: ccprompt init "${project}" or ccprompt scan <path>`);
      process.exit(1);
    }

    const templates = opts.template ? [opts.template] : getTemplates();
    const projectDir = path.join(PROJECTS_DIR, project);

    const contextString = buildContextString(ctx);
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{CONTEXT}', contextString);

    if (opts.dryRun) {
      console.log('\n=== DRY RUN – No API calls will be made ===\n');
      console.log('System prompt:');
      console.log('---');
      console.log(systemPrompt);
      console.log('---\n');
      console.log(`Templates to individualize (${templates.length}):`);
      for (const t of templates) {
        const exists = fs.existsSync(path.join(TEMPLATES_DIR, `${t}.md`));
        console.log(`  ${t} ${exists ? '✓' : '✗ NOT FOUND'}`);
      }
      return;
    }

    // Check for existing prompts that would be overwritten
    const existing = templates.filter(t =>
      fs.existsSync(path.join(projectDir, `${t}.md`))
    );
    if (!opts.yes) {
      if (existing.length > 0) {
        console.log(`\nExisting prompts that will be overwritten: ${existing.join(', ')}`);
      }
      const ok = await confirm(`Generate ${templates.length} prompt(s)?`);
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }

    console.log(`\nGenerating individualized prompts for "${project}"...\n`);

    const { succeeded, failed, cached } = await generateForProject(project, ctx, {
      force: opts.force,
      templateFilter: opts.template,
    });

    console.log(`\nResults: ${succeeded} succeeded${cached > 0 ? ` (${cached} cached)` : ''}, ${failed} failed`);
    console.log(`Prompts saved to: ~/.ccprompt/projects/${project}/`);
    console.log(`Use: ccprompt show "${project}" <template> to view a prompt.`);
    console.log(`Use: ccprompt copy "${project}" <template> to copy to clipboard.`);
  });

program
  .command('show <project> <template>')
  .description('Display an individualized prompt (ready to copy)')
  .option('-o, --original', 'Show the original template instead')
  .action((project, template, opts) => {
    if (opts.original) {
      const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
      if (!fs.existsSync(templatePath)) {
        console.error(`Template "${template}" not found. Use 'ccprompt templates' to see available.`);
        process.exit(1);
      }
      console.log(fs.readFileSync(templatePath, 'utf-8'));
      return;
    }

    const promptPath = path.join(PROJECTS_DIR, project, `${template}.md`);
    if (!fs.existsSync(promptPath)) {
      const templateExists = fs.existsSync(path.join(TEMPLATES_DIR, `${template}.md`));
      if (!templateExists) {
        console.error(`Template "${template}" does not exist. Use 'ccprompt templates' to see available.`);
      } else {
        console.error(`No individualized "${template}" prompt for "${project}".`);
        console.error(`Run: ccprompt generate "${project}" --template ${template}`);
      }
      process.exit(1);
    }
    console.log(fs.readFileSync(promptPath, 'utf-8'));
  });

program
  .command('copy <project> <template>')
  .description('Copy an individualized prompt to clipboard')
  .option('-o, --original', 'Copy the original template instead')
  .action((project, template, opts) => {
    let content;

    if (opts.original) {
      const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
      if (!fs.existsSync(templatePath)) {
        console.error(`Template "${template}" not found.`);
        process.exit(1);
      }
      content = fs.readFileSync(templatePath, 'utf-8');
    } else {
      const promptPath = path.join(PROJECTS_DIR, project, `${template}.md`);
      if (!fs.existsSync(promptPath)) {
        console.error(`No individualized "${template}" prompt for "${project}".`);
        console.error(`Run: ccprompt generate "${project}" --template ${template}`);
        process.exit(1);
      }
      content = fs.readFileSync(promptPath, 'utf-8');
    }

    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        execSync('clip', { input: content });
      } else if (process.platform === 'darwin') {
        execSync('pbcopy', { input: content });
      } else {
        // Try xclip first, fall back to xsel, then wl-copy (Wayland)
        try { execSync('xclip -selection clipboard', { input: content }); }
        catch {
          try { execSync('xsel --clipboard --input', { input: content }); }
          catch { execSync('wl-copy', { input: content }); }
        }
      }
      const label = opts.original ? 'original' : 'individualized';
      console.log(`Copied ${label} "${template}" prompt${opts.original ? '' : ` for "${project}"`} to clipboard.`);
    } catch {
      console.error('Could not copy to clipboard. Install xclip, xsel, or wl-copy (Linux) or use "ccprompt show" instead.');
      process.exit(1);
    }
  });

program
  .command('install <project>')
  .description('Install individualized prompts as slash commands in your project')
  .option('-t, --template <name>', 'Install only a specific template')
  .action((project, opts) => {
    const ctx = getProjectContext(project);
    if (!ctx) {
      console.error(`Project "${project}" not found.`);
      process.exit(1);
    }
    if (!ctx.projectPath) {
      console.error(`Project "${project}" has no projectPath set. Use: ccprompt update "${project}" or ccprompt scan`);
      process.exit(1);
    }
    if (!fs.existsSync(ctx.projectPath)) {
      console.error(`Project path not found: ${ctx.projectPath}`);
      process.exit(1);
    }

    const { installed, templates } = installForProject(project, ctx, { templateFilter: opts.template });

    for (const file of templates) {
      console.log(`  ${file} → .claude/commands/${file}`);
    }
    console.log(`\n${installed} prompt(s) installed as slash commands.`);
    console.log(`Use in Claude Code: /${templates[0] ? templates[0].replace('.md', '') : 'kickoff'}`);
  });

program
  .command('install-all')
  .description('Install individualized prompts into ALL projects that have a projectPath')
  .action(() => {
    const projects = getProjects();
    let totalInstalled = 0;

    for (const project of projects) {
      const ctx = getProjectContext(project);
      if (!ctx || !ctx.projectPath || !fs.existsSync(ctx.projectPath)) continue;

      const { installed } = installForProject(project, ctx);
      if (installed > 0) {
        console.log(`  ${project}: ${installed} slash commands → .claude/commands/`);
        totalInstalled += installed;
      }
    }

    console.log(`\nTotal: ${totalInstalled} prompts installed across ${projects.length} projects.`);
  });

program
  .command('install-generic [projectPath]')
  .description('Install generic templates as slash commands – no API key, no setup needed')
  .action((projectPath) => {
    const resolvedPath = path.resolve(projectPath || '.');
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    const commandsDir = path.join(resolvedPath, '.claude', 'commands');
    ensureDir(commandsDir);

    const templates = getTemplates();
    if (templates.length === 0) {
      console.error('No templates found. Package may be corrupted.');
      process.exit(1);
    }

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
    console.log(`\nThese are generic templates. For project-specific versions:`);
    console.log(`  npm install -g @ccprompt/cli`);
    console.log(`  ccprompt scan "${resolvedPath}"`);
    console.log(`  ccprompt generate <project-name>`);
    console.log(`  ccprompt install <project-name>`);
  });

program
  .command('refresh <project>')
  .description('Rescan + regenerate + install in one step (keeps prompts up to date)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--force', 'Regenerate even if cached')
  .action(async (project, opts) => {
    // Step 1: Rescan
    console.log(`\n=== Step 1: Rescan ===`);
    const ctx = rescanProject(project);

    // Step 2: Generate
    console.log(`\n=== Step 2: Generate ===`);
    if (!opts.yes) {
      const templates = getTemplates();
      const ok = await confirm(`Generate ${templates.length} prompt(s)?`);
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }

    const { succeeded, failed, cached } = await generateForProject(project, ctx, {
      force: opts.force,
    });
    console.log(`  Results: ${succeeded} succeeded${cached > 0 ? ` (${cached} cached)` : ''}, ${failed} failed`);

    // Step 3: Install
    if (!ctx.projectPath || !fs.existsSync(ctx.projectPath)) {
      console.log('\nSkipping install (no project path set).');
    } else {
      console.log(`\n=== Step 3: Install ===`);
      const { installed } = installForProject(project, ctx);
      console.log(`  ${installed} slash commands installed.`);
    }

    console.log(`\n=== Done! "${project}" is fully refreshed. ===`);
  });

program
  .command('regenerate-all')
  .description('Regenerate individualized prompts for ALL projects')
  .option('-t, --template <name>', 'Regenerate only a specific template across all projects')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (opts) => {
    const projects = getProjects();
    if (projects.length === 0) {
      console.log('No projects registered.');
      return;
    }

    const templates = opts.template ? [opts.template] : getTemplates();
    const totalCalls = projects.length * templates.length;

    if (!opts.yes) {
      console.log(`\nThis will regenerate ${templates.length} template(s) for ${projects.length} project(s) (${totalCalls} API calls).`);
      const ok = await confirm('Proceed?');
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }

    let totalSucceeded = 0;
    let totalFailed = 0;

    for (const project of projects) {
      const ctx = getProjectContext(project);
      if (!ctx) continue;

      console.log(`\n${project}:`);

      const { succeeded, failed } = await generateForProject(project, ctx, {
          force: true, // regenerate-all always regenerates
        templateFilter: opts.template,
      });

      totalSucceeded += succeeded;
      totalFailed += failed;
    }

    console.log(`\nTotal: ${totalSucceeded} succeeded, ${totalFailed} failed across ${projects.length} projects.`);
  });

program
  .command('remove <project>')
  .description('Remove a registered project and its individualized prompts')
  .action(async (project) => {
    const projectDir = path.join(PROJECTS_DIR, project);
    if (!fs.existsSync(projectDir)) {
      console.error(`Project "${project}" not found.`);
      process.exit(1);
    }

    const ok = await confirm(`Remove project "${project}" and all its individualized prompts?`);
    if (!ok) {
      console.log('Cancelled.');
      return;
    }

    fs.rmSync(projectDir, { recursive: true });
    console.log(`Project "${project}" removed.`);
  });

program
  .command('new-template <name>')
  .description('Create a new prompt template from scratch')
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

[Your core directive here. Be energetic, directive, specific. This is what the AI reads first.]

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
    console.log('Edit it to add your specific instructions, then:');
    console.log(`  ccprompt regenerate-all --template ${name}  (individualize for all projects)`);
    console.log(`  ccprompt install-all                        (deploy to all projects)`);
  });

program
  .command('stats')
  .description('Show overview stats for all projects and templates')
  .action(() => {
    const templates = getTemplates();
    const projects = getProjects();

    console.log('\n=== CCPROMPT STATS ===\n');
    console.log(`Templates: ${templates.length}`);
    console.log(`Projects:  ${projects.length}`);
    console.log(`Data dir:  ${DATA_DIR}`);

    let totalPrompts = 0;
    let projectsWithPath = 0;
    let projectsInstalled = 0;

    for (const p of projects) {
      const ctx = getProjectContext(p);
      const projectDir = path.join(PROJECTS_DIR, p);
      try {
        const prompts = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));
        totalPrompts += prompts.length;
      } catch { /* skip */ }

      if (ctx && ctx.projectPath && fs.existsSync(ctx.projectPath)) {
        projectsWithPath++;
        const installedDir = path.join(ctx.projectPath, '.claude', 'commands');
        if (fs.existsSync(installedDir)) {
          try {
            const installed = fs.readdirSync(installedDir).filter(f => f.endsWith('.md'));
            if (installed.length > 0) projectsInstalled++;
          } catch { /* skip */ }
        }
      }
    }

    console.log(`Individualized prompts: ${totalPrompts}`);
    console.log(`Projects with path:     ${projectsWithPath}/${projects.length}`);
    console.log(`Projects with install:  ${projectsInstalled}/${projects.length}`);

    console.log('\n--- Templates ---');
    for (const t of templates) {
      console.log(`  ${t}`);
    }

    console.log('\n--- Projects ---');
    for (const p of projects) {
      const ctx = getProjectContext(p);
      const projectDir = path.join(PROJECTS_DIR, p);
      let promptCount = 0;
      try { promptCount = fs.readdirSync(projectDir).filter(f => f.endsWith('.md')).length; }
      catch { /* skip */ }
      const hasPath = ctx && ctx.projectPath ? '✓' : '✗';
      const stack = ctx && ctx.stack ? ctx.stack : 'unknown';
      console.log(`  ${hasPath} ${p} (${promptCount}/${templates.length} prompts) – ${stack}`);
    }
    console.log();
  });

program
  .command('diff <project> <template>')
  .description('Compare original template with individualized version')
  .action((project, template) => {
    const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
    const promptPath = path.join(PROJECTS_DIR, project, `${template}.md`);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template "${template}" not found.`);
      process.exit(1);
    }
    if (!fs.existsSync(promptPath)) {
      console.error(`No individualized "${template}" prompt for "${project}".`);
      console.error(`Run: ccprompt generate "${project}" --template ${template}`);
      process.exit(1);
    }

    const original = fs.readFileSync(templatePath, 'utf-8');
    const individualized = fs.readFileSync(promptPath, 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ORIGINAL TEMPLATE: ${template}`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(original);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  INDIVIDUALIZED FOR: ${project}`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(individualized);

    const origLines = original.split('\n').length;
    const indivLines = individualized.split('\n').length;
    console.log(`\n--- Stats: Original ${origLines} lines → Individualized ${indivLines} lines ---`);
  });

program.parse();

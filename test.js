const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLI = `node "${path.join(__dirname, 'promptm.js')}"`;
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PROJECTS_DIR = path.join(os.homedir(), '.ccprompt', 'projects');
const TEST_PREFIX = '__test_';
const TEMPLATE_FILES = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
const TEMPLATE_COUNT = TEMPLATE_FILES.length;
const TEMPLATE_NAMES = TEMPLATE_FILES.map(f => f.replace('.md', ''));

function run(args) {
  return execSync(`${CLI} ${args}`, { encoding: 'utf-8', timeout: 15000 });
}

function runErr(args) {
  try {
    execSync(`${CLI} ${args}`, { encoding: 'utf-8', timeout: 15000 });
    return '';
  } catch (err) {
    return err.stderr || err.stdout || err.message;
  }
}

// --- CLI basics ---

describe('CLI basics', () => {
  it('shows version', () => {
    const out = run('--version');
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('shows help', () => {
    const out = run('--help');
    assert.ok(out.includes('Individualize general prompts'));
    assert.ok(out.includes('templates'));
    assert.ok(out.includes('generate'));
    assert.ok(out.includes('install'));
  });
});

// --- Templates ---

describe('templates command', () => {
  it(`lists all ${TEMPLATE_COUNT} templates`, () => {
    const out = run('templates');
    assert.match(out, new RegExp(`Available templates \\(${TEMPLATE_COUNT}\\)`));
    for (const t of TEMPLATE_NAMES) {
      assert.ok(out.includes(t), `missing template: ${t}`);
    }
  });

  it('each template has When to use and Role', () => {
    for (const file of TEMPLATE_FILES) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      assert.ok(content.includes('When to use:'), `${file} missing "When to use:"`);
      assert.ok(content.includes('Role:'), `${file} missing "Role:"`);
    }
  });

  it('each template has $ARGUMENTS placeholder', () => {
    for (const file of TEMPLATE_FILES) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      assert.ok(content.includes('$ARGUMENTS'), `${file} missing $ARGUMENTS`);
    }
  });

  it('each template has Success Criteria section', () => {
    for (const file of TEMPLATE_FILES) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      assert.ok(content.includes('## Success Criteria'), `${file} missing Success Criteria`);
    }
  });
});

// --- Scan detection ---

describe('scan detection', () => {
  const tmpBase = path.join(os.tmpdir(), 'ccprompt-test-' + Date.now());

  before(() => {
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  after(() => {
    // Clean up test projects from ~/.ccprompt
    try {
      const entries = fs.readdirSync(PROJECTS_DIR);
      for (const e of entries) {
        if (e.startsWith(TEST_PREFIX)) {
          fs.rmSync(path.join(PROJECTS_DIR, e), { recursive: true });
        }
      }
    } catch { /* ok */ }
    // Clean up temp dirs
    fs.rmSync(tmpBase, { recursive: true, force: true });
  });

  it('detects Node.js project from package.json', () => {
    const dir = path.join(tmpBase, 'node-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'test',
      scripts: { start: 'node index.js', dev: 'nodemon index.js', test: 'jest' },
      dependencies: { express: '^4.0.0' }
    }));
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}node`);
    assert.ok(out.includes('Express'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}node`, 'context.json'), 'utf-8'));
    assert.ok(ctx.stack.includes('Express'));
    assert.equal(ctx.commands.start, 'npm start');
    assert.equal(ctx.commands.dev, 'npm run dev');
    assert.equal(ctx.commands.test, 'npm test');
  });

  it('detects Python project from requirements.txt', () => {
    const dir = path.join(tmpBase, 'py-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'flask==2.0\n');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}python`);
    assert.ok(out.includes('Python'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}python`, 'context.json'), 'utf-8'));
    assert.equal(ctx.stack, 'Python');
    assert.equal(ctx.commands.test, 'pytest');
  });

  it('detects Go project from go.mod', () => {
    const dir = path.join(tmpBase, 'go-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module example.com/test\n');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}go`);
    assert.ok(out.includes('Go'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}go`, 'context.json'), 'utf-8'));
    assert.equal(ctx.stack, 'Go');
    assert.equal(ctx.commands.test, 'go test ./...');
    assert.equal(ctx.commands.build, 'go build ./...');
  });

  it('detects Rust project from Cargo.toml', () => {
    const dir = path.join(tmpBase, 'rust-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'Cargo.toml'), '[package]\nname = "test"\n');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}rust`);
    assert.ok(out.includes('Rust'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}rust`, 'context.json'), 'utf-8'));
    assert.equal(ctx.stack, 'Rust');
    assert.equal(ctx.commands.test, 'cargo test');
  });

  it('detects Java Maven project from pom.xml', () => {
    const dir = path.join(tmpBase, 'java-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'pom.xml'), '<project></project>');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}java`);
    assert.ok(out.includes('Java (Maven)'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}java`, 'context.json'), 'utf-8'));
    assert.ok(ctx.stack.includes('Java (Maven)'));
    assert.equal(ctx.commands.test, 'mvn test');
  });

  it('detects C# project from .csproj', () => {
    const dir = path.join(tmpBase, 'csharp-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'App.csproj'), '<Project></Project>');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}csharp`);
    assert.ok(out.includes('C# (.NET)'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}csharp`, 'context.json'), 'utf-8'));
    assert.ok(ctx.stack.includes('C# (.NET)'));
    assert.equal(ctx.commands.test, 'dotnet test');
  });

  it('detects Docker from Dockerfile', () => {
    const dir = path.join(tmpBase, 'docker-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'Dockerfile'), 'FROM node:18\n');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}docker`);
    assert.ok(out.includes('Docker'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}docker`, 'context.json'), 'utf-8'));
    assert.ok(ctx.stack.includes('Docker'));
  });

  it('detects multiple stacks in same project', () => {
    const dir = path.join(tmpBase, 'multi-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'test', dependencies: { next: '^14', react: '^18', typescript: '^5' }
    }));
    fs.writeFileSync(path.join(dir, 'Dockerfile'), 'FROM node:18\n');
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}multi`);
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}multi`, 'context.json'), 'utf-8'));
    assert.ok(ctx.stack.includes('Next.js'));
    assert.ok(ctx.stack.includes('React'));
    assert.ok(ctx.stack.includes('TypeScript'));
    assert.ok(ctx.stack.includes('Docker'));
    assert.ok(ctx.conventions.includes('TypeScript'));
  });

  it('detects docs (CLAUDE.md, README.md)', () => {
    const dir = path.join(tmpBase, 'docs-proj');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'README.md'), '# My Project\nA cool project.');
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Rules\nDo good.');
    const out = run(`scan "${dir}" --name ${TEST_PREFIX}docs`);
    assert.ok(out.includes('CLAUDE.md'));
    assert.ok(out.includes('README.md'));
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}docs`, 'context.json'), 'utf-8'));
    assert.ok(ctx.keyDocs.includes('CLAUDE.md'));
    assert.ok(ctx.keyDocs.includes('README.md'));
  });

  it('detects entry files', () => {
    const dir = path.join(tmpBase, 'entry-proj');
    fs.mkdirSync(dir);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export default {};');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'test' }));
    run(`scan "${dir}" --name ${TEST_PREFIX}entry`);
    const ctx = JSON.parse(fs.readFileSync(
      path.join(PROJECTS_DIR, `${TEST_PREFIX}entry`, 'context.json'), 'utf-8'));
    assert.ok(ctx.keyFiles.includes('src/index.ts'));
  });
});

// --- Install generic ---

describe('install-generic', () => {
  const tmpDir = path.join(os.tmpdir(), 'ccprompt-install-test-' + Date.now());

  before(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(`installs all ${TEMPLATE_COUNT} templates as slash commands`, () => {
    const out = run(`install-generic "${tmpDir}"`);
    assert.ok(out.includes(`${TEMPLATE_COUNT} slash commands installed`));
    const commandsDir = path.join(tmpDir, '.claude', 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    assert.equal(files.length, TEMPLATE_COUNT);
  });

  it('adds frontmatter to installed templates', () => {
    const commandsDir = path.join(tmpDir, '.claude', 'commands');
    const kickoff = fs.readFileSync(path.join(commandsDir, 'kickoff.md'), 'utf-8');
    assert.ok(kickoff.startsWith('---'));
    assert.ok(kickoff.includes('description:'));
  });
});

// --- Validation ---

describe('validation', () => {
  it('rejects names with special characters', () => {
    const err = runErr(`init "bad:name" -d "test" -s "node"`);
    assert.ok(err.includes('Invalid') || err.includes('special characters'));
  });

  it('rejects names starting with dot', () => {
    const err = runErr(`init ".hidden" -d "test" -s "node"`);
    assert.ok(err.includes('Invalid') || err.includes('special characters'));
  });

  it('rejects names with path traversal', () => {
    const err = runErr(`init "../../etc" -d "test" -s "node"`);
    assert.ok(err.includes('Invalid') || err.includes('special characters'));
  });
});

// --- Stats ---

describe('stats command', () => {
  it('shows template and project counts', () => {
    const out = run('stats');
    assert.ok(out.includes(`Templates: ${TEMPLATE_COUNT}`));
    assert.ok(out.includes('Projects:'));
    assert.ok(out.includes('Data dir:'));
  });
});

// --- Show/diff ---

describe('show and diff', () => {
  it('show --original displays generic template', () => {
    const out = run('show anyproject kickoff --original');
    assert.ok(out.includes('# Session Kickoff'));
    assert.ok(out.includes('$ARGUMENTS'));
  });

  it('show fails for nonexistent project', () => {
    const err = runErr('show nonexistent_xyz kickoff');
    assert.ok(err.includes('not found') || err.includes('No individualized'));
  });

  it('show fails for nonexistent template', () => {
    const err = runErr('show nonexistent_xyz nonexistent_template');
    assert.ok(err.includes('not exist') || err.includes('not found'));
  });
});

// --- Generate dry-run ---

describe('generate --dry-run', () => {
  it('shows system prompt without making API calls', () => {
    // Use a real project for this test
    const projects = fs.readdirSync(PROJECTS_DIR).filter(f => {
      try { return fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory() && !f.startsWith(TEST_PREFIX); }
      catch { return false; }
    });
    if (projects.length === 0) return; // skip if no projects
    const out = run(`generate "${projects[0]}" --dry-run`);
    assert.ok(out.includes('DRY RUN'));
    assert.ok(out.includes('System prompt'));
    assert.ok(out.includes('Templates to individualize'));
  });
});

// --- List ---

describe('list command', () => {
  it('lists registered projects', () => {
    const out = run('list');
    assert.ok(out.includes('Registered projects') || out.includes('No projects'));
  });
});

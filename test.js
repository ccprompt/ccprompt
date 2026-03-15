const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLI = `node "${path.join(__dirname, 'promptm.js')}"`;
const TEMPLATES_DIR = path.join(__dirname, 'templates');
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
    assert.ok(out.includes('install'));
    assert.ok(out.includes('templates'));
    assert.ok(out.includes('show'));
    assert.ok(out.includes('copy'));
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

// --- Install ---

describe('install command', () => {
  const tmpDir = path.join(os.tmpdir(), 'ccprompt-install-test-' + Date.now());

  before(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(`installs all ${TEMPLATE_COUNT} templates as slash commands`, () => {
    const out = run(`install "${tmpDir}"`);
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

// --- Show ---

describe('show command', () => {
  it('displays template content', () => {
    const out = run('show kickoff');
    assert.ok(out.includes('# Session Kickoff'));
    assert.ok(out.includes('$ARGUMENTS'));
  });

  it('fails for nonexistent template', () => {
    const err = runErr('show nonexistent_template_xyz');
    assert.ok(err.includes('not found'));
  });
});

// --- Validation ---

describe('validation', () => {
  it('rejects template names with special characters', () => {
    const err = runErr('new-template "bad:name"');
    assert.ok(err.includes('Invalid'));
  });

  it('rejects template names starting with dot', () => {
    const err = runErr('new-template ".hidden"');
    assert.ok(err.includes('Invalid'));
  });
});

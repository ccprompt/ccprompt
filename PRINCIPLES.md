# Engineering Principles

**Purpose:** Core engineering principles that govern all development in this codebase. These are requirements, not suggestions.

**Audience:** All developers, AI assistants, code reviewers

**Status:** Living document


## Core Philosophy

**"Optimize for clarity, correctness, and adaptability."**

This codebase prioritizes:
- **Correct**: It works and handles edge cases
- **Maintainable**: Easy to understand and change
- **Evolvable**: Adaptable to new requirements
- **Documented**: Clear context for future developers


## Guiding Principles

### 1. KISS: Keep It Simple, Stupid

**Rule:** The simplest solution that works is the best solution.

**In Practice:**
- Favor clarity over cleverness
- Break complex logic into small, understandable pieces
- Avoid over-engineering and premature optimization
- No "clever" code that sacrifices readability

**Example:**
```typescript
// BAD: Clever but hard to understand
const result = data.reduce((acc, x) => ({ ...acc, [x.id]: x }), {});

// GOOD: Clear and explicit
const result: Record<string, Item> = {};
for (const item of data) {
  result[item.id] = item;
}
```


### 2. DRY: Don't Repeat Yourself

**Rule:** Every piece of knowledge should have a single, unambiguous representation.

**In Practice:**
- Extract common logic into reusable functions/modules
- Externalize configuration (don't hardcode)
- Define constants for magic numbers
- Share types/interfaces across modules

**Example:**
```typescript
// BAD: Repeated validation logic
function createUser(email: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
  // ...
}
function updateUser(email: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
  // ...
}

// GOOD: Reusable validation
function validateEmail(email: string): void {
  if (!email.includes('@')) throw new Error('Invalid email');
}

function createUser(email: string) {
  validateEmail(email);
  // ...
}
```

**Note:** DRY applies to *knowledge* and *business logic*, not necessarily code. Sometimes duplication is better than the wrong abstraction.


### 3. YAGNI: You Ain't Gonna Need It

**Rule:** Only implement features you actually need right now.

**In Practice:**
- Don't add functionality "just in case"
- No speculative features or abstractions
- Remove unused code and commented-out blocks
- Avoid over-abstraction

**Example:**
```typescript
// BAD: Building for future features we don't need yet
class UserService {
  async createUser() { /* ... */ }
  async updateUser() { /* ... */ }
  async deleteUser() { /* ... */ }
  async restoreUser() { /* ... */ }  // Not needed yet!
  async archiveUser() { /* ... */ }  // Not needed yet!
  async exportUser() { /* ... */ }   // Not needed yet!
}

// GOOD: Only what we need now
class UserService {
  async createUser() { /* ... */ }
  async updateUser() { /* ... */ }
  async deleteUser() { /* ... */ }
}
// Add other methods when actually needed
```


### 4. SRP: Single Responsibility Principle

**Rule:** Each function/class should have one, and only one, reason to change.

**In Practice:**
- Functions should do one thing and do it well
- Classes should have a single, clear responsibility
- No "god objects" or monolithic functions
- Clear separation of concerns

**Example:**
```typescript
// BAD: Function does too many things
async function handleUserRegistration(email: string, password: string) {
  validateEmail(email);
  validatePassword(password);
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.users.create({ email, password: hashedPassword });
  await emailService.sendWelcomeEmail(email);
  await analyticsService.trackRegistration(user.id);
  await auditLog.log('USER_REGISTERED', user.id);
  return user;
}

// GOOD: Each function has single responsibility
async function createUser(email: string, password: string): Promise<User> {
  const hashedPassword = await hashPassword(password);
  return db.users.create({ email, password: hashedPassword });
}

async function handleUserRegistration(email: string, password: string): Promise<User> {
  validateUserInput(email, password);
  const user = await createUser(email, password);
  await sendWelcomeEmail(user.email);
  await trackRegistration(user.id);
  await logUserCreated(user.id);
  return user;
}
```


### 5. Explicit over Implicit

**Rule:** Be explicit in your code. No magic behavior.

**In Practice:**
- Clear function signatures with types
- Explicit error handling (no silent failures)
- Type annotations everywhere (TypeScript)
- Clear naming conventions

**Example:**
```typescript
// BAD: Implicit, unclear
function process(data: any) {
  // What does this return? When does it throw?
}

// GOOD: Explicit
async function processUserData(
  userId: string
): Promise<ProcessedUser | null> {
  // Clear what it does, returns, and when
}
```


### 6. High Cohesion / Low Coupling

**Rule:** Related functionality should be grouped together; modules should minimize dependencies.

**In Practice:**
- Group related functions/classes in the same module
- Minimize dependencies between modules
- Use clear interfaces/contracts
- Make modules easy to test in isolation
- No circular dependencies

**Example:**
```
src/users/
├── users.service.ts       # User business logic
├── users.controller.ts    # HTTP handlers
├── users.repository.ts    # Database access
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── entities/
    └── user.entity.ts
```


### 7. Composition over Inheritance

**Rule:** Favor composition over inheritance for code reuse.

**In Practice:**
- Use interfaces/types for contracts
- Inject dependencies
- No deep inheritance hierarchies
- Prefer "has-a" over "is-a"

**Example:**
```typescript
// BAD: Deep inheritance hierarchy
class BaseService {
  constructor(protected db: Database) {}
}
class CRUDService extends BaseService {
  create() { /* ... */ }
  read() { /* ... */ }
}
class UserService extends CRUDService {
  /* ... */
}

// GOOD: Composition with dependency injection
interface Repository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
}

class UserService {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly auditLogger: AuditLogger,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(data);
    await this.auditLogger.log('USER_CREATED', user.id);
    return user;
  }
}
```


### 8. Law of Demeter

**Rule:** Objects should only talk to their direct friends.

Don't chain method calls through multiple objects. No "train wrecks" (`a.b().c().d()`). If you need data from deep in an object graph, ask the owner to provide it.

**Example:**
```typescript
// BAD: Law of Demeter violation
const city = user.getAddress().getCity().getName();

// GOOD: Ask the object to do it
const city = user.getCityName();
```


## Architecture Principles

### Clean/Hexagonal Architecture

**Rule:** Business logic should be independent of frameworks, UI, and infrastructure.

**Layers (dependencies flow inward):**
1. **Domain** (Core): Business logic, entities
2. **Application**: Use cases, services
3. **Infrastructure**: Database, external APIs
4. **Presentation**: Controllers, DTOs

**Example:**
```
src/
├── domain/
│   ├── entities/          # Pure business objects
│   └── interfaces/        # Contracts (repositories, etc.)
├── application/
│   └── services/          # Business logic, use cases
├── infrastructure/
│   ├── database/          # Database implementation
│   └── external/          # External API clients
└── presentation/
    └── controllers/       # HTTP handlers
```


## Security Principles

### Input Validation

**Rule:** All user input is hostile until proven otherwise.

Validate at system boundaries. Sanitize input. Whitelist, don't blacklist.

**Example:**
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  @MinLength(12)
  password: string;

  @IsString()
  @Length(2, 50)
  name: string;
}
```


### Error Handling

**Rule:** Detect errors early, fail fast, and make errors actionable.

**In Practice:**
- Validate inputs at boundaries
- No swallowed exceptions
- Throw errors early with context
- Don't return null when you should throw

**Example:**
```typescript
// BAD: Silent failure
function getUser(id: string): User | null {
  try {
    return db.users.findById(id);
  } catch (error) {
    return null; // Swallowed error!
  }
}

// GOOD: Fail fast with actionable error
async function getUser(id: string): Promise<User> {
  const user = await db.users.findById(id);
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}

// BAD: Unclear error
throw new Error('Failed');

// GOOD: Actionable error with context
throw new BadRequestException({
  message: 'Email address is already in use',
  field: 'email',
  suggestion: 'Try logging in or use password reset',
});
```


### No Secrets in Code or Logs

**Rule:** Never hardcode secrets. Never log secrets.

**In Practice:**
- All secrets in environment variables
- Secrets loaded from .env (development) or secret manager (production)
- Sanitize logs (no passwords, tokens, PII)

**Example:**
```typescript
// BAD: Hardcoded secret
const apiKey = 'sk-1234567890abcdef';

// GOOD: Environment variable
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY not configured');
```


### Logging

**Rule:** Log what matters. Never log what's sensitive.

**What to log:** Authentication events, authorization failures, errors and exceptions, external API calls, slow database queries, business-critical actions.

**What NOT to log:** Passwords or secrets, personal data (GDPR), full request/response bodies (unless debug mode).

**Example:**
```typescript
// GOOD: Structured logging
this.logger.log({
  message: 'User created successfully',
  userId: user.id,
  correlationId: context.correlationId,
  // Never log email, password, tokens
});
```


## Testing Principles

### Test Pyramid

**Rule:** More unit tests, fewer integration tests, even fewer E2E tests.

**Coverage Targets:**
- **Unit Tests:** 80%+ for new code
- **Integration Tests:** Key flows
- **E2E Tests:** Critical user journeys

### Test Quality

**Rule:** Tests should be readable, independent, and deterministic.

- Clear test names using arrange/act/assert pattern
- No shared mutable state between tests
- Same input always produces the same output (no flaky tests)
- Unit tests run in milliseconds
- Test data resembles production data

**Example:**
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      // Arrange
      const dto = { email: 'test@example.com', password: 'Test123!@#' };
      const mockRepository = createMockRepository();

      // Act
      const user = await service.createUser(dto);

      // Assert
      expect(user.email).toBe(dto.email);
      expect(user.password).not.toBe(dto.password); // Hashed
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for duplicate email', async () => {
      // Arrange
      const dto = { email: 'existing@example.com', password: 'Test123!@#' };
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.createUser(dto))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});
```


## Documentation Principles

**Rule:** Documentation lives with code and is version controlled.

- JSDoc/TSDoc for public APIs
- README.md for modules
- ADRs for significant decisions
- Keep docs minimal, focused, and up to date
- Delete redundant or outdated files
- Consolidate rather than create new docs


## Performance Principles

**Rule:** Make it work, make it right, make it fast (in that order).

- Optimize only when there's a proven performance problem
- Measure first (profiling, benchmarks)
- Focus on algorithmic complexity (O(n) vs O(n^2))
- Avoid micro-optimizations
- Paginate large datasets
- Index database queries appropriately
- Avoid N+1 queries
- Set timeouts on external calls


## Process

**Consistency over preference:** Follow the project's existing style, even if you prefer another. Use the configured linter and formatter. TypeScript strict mode.

**Self-review before committing:** Verify KISS, DRY, YAGNI, SRP compliance. No debug code or console.logs. Linter and type checker pass. Documentation updated if needed.

**Leave code better than you found it:** When you touch code that's hard to understand or contains duplication, clean it up. When there are no tests for the code you're changing, add tests first.


**Last Updated:** 2026-03-02
**Maintainer:** Konrad Reyhe

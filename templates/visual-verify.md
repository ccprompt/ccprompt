# Visual & Browser Verification

**When to use:** After UI changes, when you need to verify what the user actually sees. When reading code isn't enough and you need to SEE the result.

**Role:** You are a visual QA engineer. Your job is to verify that the application looks and behaves correctly from the user's perspective. Code review misses visual bugs. Screenshots catch them.

---

**Verify visually:** $ARGUMENTS

Describing visual bugs in words introduces "translation loss." A screenshot is always more precise than a description. See the bug, understand the code, fix it, verify it visually. Close the loop.

## Don't

- Don't declare UI changes "done" without visual verification
- Don't rely only on code reading for layout, spacing, or styling changes
- Don't skip responsive checks (mobile, tablet, desktop)
- Don't forget to check the browser console for errors
- Don't test only the happy path visually (check error states, empty states, loading states)

## Step 1: Choose Your Verification Method

Pick the right tool for the situation:

**Chrome Extension (best for interactive testing):**
- Run `claude --chrome` or type `/chrome` in session
- Requires: Claude in Chrome extension v1.0.36+
- Can: navigate, click, read console, take screenshots, share login state

**Playwright MCP (best for automated/repeatable testing):**
- Setup: `claude mcp add playwright npx '@playwright/mcp@latest'`
- Can: navigate, click, type, screenshot, read console, monitor network, generate test files

**Manual DevTools (universal fallback):**
- Open browser, trigger the issue, F12 for DevTools
- Copy console errors and paste into this conversation
- Works with any AI tool, any browser

## Step 2: Start the Dev Server

Make sure the application is running locally:
- Start the dev server (or confirm it's already running)
- Note the URL (localhost:3000, localhost:5173, etc.)
- Confirm the page loads without errors

## Step 3: Visual Inspection

Check the specific changes at multiple viewports:

**Desktop (1440x900):**
- Does the layout match the expected design?
- Are spacing, alignment, and proportions correct?
- Do interactive elements (buttons, links, dropdowns) look right?

**Tablet (768x1024):**
- Does the layout adapt correctly?
- Are there overflow or wrapping issues?
- Is touch target size adequate?

**Mobile (375x667):**
- Is content readable without horizontal scrolling?
- Are navigation elements accessible?
- Do images and media scale properly?

## Step 4: Console & Network Check

Open the browser console and verify:
- No JavaScript errors (filter for errors, not warnings)
- No failed network requests (404s, 500s, CORS errors)
- No unhandled promise rejections
- No deprecation warnings for critical APIs

If using Chrome extension or Playwright MCP, read console messages directly.

## Step 5: Interaction Testing

Test the actual user flow:
- Click every interactive element in the changed area
- Submit forms with valid and invalid data
- Test error states (empty fields, wrong formats, server errors)
- Test loading states (slow network simulation if applicable)
- Test edge cases (very long text, empty content, special characters)

## Step 6: Generate Test Files (Optional)

If using Playwright MCP, generate a test file from the verification session:
- Walk through the critical user flow step by step
- Let Playwright capture selectors against the real UI
- Save the generated test file for CI
- Run the generated test to confirm it passes

## Step 7: Document Results

Take screenshots of:
- The change working correctly at each viewport
- Any issues found
- Console output showing no errors

## Output Format

```
## Visual Verification Report

### Target
[What was verified and at what URL]

### Screenshots Taken
- Desktop (1440x900): [description of what was captured]
- Tablet (768x1024): [description]
- Mobile (375x667): [description]

### Console Check
- Errors: [count]:[details if any]
- Warnings: [count]:[notable ones]
- Network failures: [count]:[details if any]

### Interaction Testing
- [Flow 1]: PASS/FAIL:[details]
- [Flow 2]: PASS/FAIL:[details]
- Error states: PASS/FAIL:[details]
- Edge cases: PASS/FAIL:[details]

### Issues Found
[Exact description with screenshot reference, viewport, and steps to reproduce]

### Visual Verdict: PASS / FAIL
[Overall assessment with reasoning]
```

## Success Criteria

- All viewports checked (desktop, tablet, mobile)
- Browser console shows no errors related to the changes
- Interactive elements work correctly
- Edge cases and error states verified visually
- Screenshots document the verified state
- Any issues found include exact reproduction steps

# Helpful Patterns & Hints

This file contains patterns and concepts to guide your implementation. **You decide the specific implementation approach.**

---

## Validation Concepts

### Validation Structure
Consider creating interfaces for validation errors and results:
- A validation error should identify which field failed and why
- A validation result should indicate if validation passed and list any errors
- Validation functions should return consistent structures

### Validation Rules to Consider
- **Required fields**: Check for empty/whitespace values
- **Minimum length**: Ensure strings meet length requirements
- **Format validation**: Use regex for URLs, alphanumeric patterns, etc.
- **Array validation**: Ensure minimum number of items (e.g., dropdown options, form fields)
- **Conditional validation**: Some fields may only be required based on other field values

---

## Auto-Save Concepts

### Debouncing Pattern
Auto-save should use debouncing to avoid excessive saves:
- Wait for a pause in user activity before saving
- Clear previous timers when new changes occur
- Use `useRef` to track timeout handles
- Clean up timers in useEffect cleanup functions

### Save State Management
Track the save process with states like:
- Idle (no save in progress)
- Saving (save operation in progress)
- Saved (successful save)
- Error (save failed)

### localStorage Integration
- Use `JSON.stringify()` to serialize workflow data
- Use `JSON.parse()` to deserialize saved data
- Handle potential errors (quota exceeded, parse errors)
- Consider storing metadata (version, timestamp)

---

## React Patterns

### Debouncing in useEffect
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    // Your debounced logic here
  }, DEBOUNCE_MS);

  return () => clearTimeout(timeout);
}, [dependencies]);
```

### Validation in Forms
- Validate on change with debouncing for UX
- Display errors inline near the affected fields
- Use Radix UI's `Callout` or colored `Text` for error messages
- Consider when to show errors (immediately, on blur, on submit, etc.)

---

## UI Feedback

### Save Status Indicators
Consider showing:
- Current save status (idle/saving/saved/error)
- Last saved timestamp (formatted as relative time)
- Appropriate icons (spinner, checkmark, error icon)
- Colors to match status (green for saved, red for error, gray for idle)

### Restore Dialog
When loading the app with saved data:
- Prompt user to restore or discard
- Show when the data was saved
- Use Radix UI's `AlertDialog` for the modal
- Handle both user choices (restore or discard)

---

## TypeScript Best Practices

- Define interfaces for all data structures
- Use union types for enums (e.g., `'idle' | 'saving' | 'saved' | 'error'`)
- Export types that other components need
- Avoid `any` types - use proper typing
- Use type guards when narrowing types

---

## Radix UI Components

Available components for this challenge:
- `TextField` - Text inputs
- `Select` - Dropdowns
- `Button` - Action buttons
- `Callout` - Error/warning messages
- `AlertDialog` - Modal dialogs
- `Flex`, `Box` - Layout
- `Text` - Typography with color props
- `Badge` - Status indicators

Radix UI uses color props like `color="red"` or `color="green"` for semantic coloring.

See: https://www.radix-ui.com/themes/docs

---

## Tips

1. **Start simple**: Get basic validation working before adding auto-save
2. **Test incrementally**: Verify each validation rule works before moving to the next
3. **Think about UX**: When should errors appear? How intrusive should they be?
4. **Handle edge cases**: Empty workflows, localStorage full, malformed saved data
5. **Follow existing patterns**: Look at how the codebase currently handles node data

---

Good luck! 🚀

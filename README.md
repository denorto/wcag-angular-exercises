# ModalAccessible

Standalone Angular component for a modal dialog compliant with WCAG guidelines on keyboard focus management.

## Implemented Features

- Reactive open/close via `signal` (`isOpen`), with no external library dependencies.
- Automatic focus on the dialog title when opened, to immediately orient keyboard and screen reader users.
- Focus trap: with `Tab` and `Shift+Tab`, focus stays confined within the dialog and cannot "escape" to the underlying page content.
- Closes on `Escape` key, standard expected behavior for any modal dialog.
- Focus restoration to the button that opened the modal, on close (via `Escape`, clicking the ✕, or any other close trigger).
- Correct ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) for proper semantic announcement by screen readers.
- Visible focus indicator (outline) via `:focus-visible`, ensuring every focused element is visually identifiable during keyboard navigation.
<img width="741" height="546" alt="image" src="https://github.com/user-attachments/assets/6e877da8-cbfd-48f3-a07a-e392f5e82b39" />

## Component Structure
modal-accessible/
├── modal-accessible.ts # logic: signal, effect, focus trap, escape
├── modal-accessible.html # template with ARIA attributes
└── modal-accessible.scss # focus-visible outline styling

## How It Works

### 1. Opening the modal

```typescript
openModal() {
  this.lastFocusedElement = document.activeElement as HTMLElement;
  this.isOpen.set(true);
}
```

Before opening the dialog, the currently focused element (typically the trigger button) is saved, so it can be restored on close.

### 2. Automatic focus on the title

```typescript
constructor() {
  effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.dialogTitle()?.nativeElement.focus();
      }, 0);
    }
  });
}
```

The effect reads `isOpen()` synchronously, so Angular can track it as a reactive dependency and re-run the effect whenever the value changes. The `setTimeout` waits for Angular to finish rendering the `@if` block before looking up the element in the DOM.

The title (`<h2>`) has `tabindex="-1"` in the template: this makes it focusable via JavaScript but not reachable via `Tab`, in line with the ARIA "Dialog (Modal)" pattern.

### 3. Focus trap

```typescript
@HostListener('document:keydown', ['$event'])
handleKeydown(event: KeyboardEvent): void {
  if (!this.isOpen()) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    this.closeModal();
    return;
  }

  if (event.key === 'Tab') {
    this.trapFocus(event);
  }
}
```

When the modal is open, every `Tab` press is intercepted. If focus is on the last focusable element and `Tab` is pressed, focus wraps back to the first one (and vice versa with `Shift+Tab`), preventing the user from leaving the dialog.

Focusable elements are dynamically identified with:
button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

excluding disabled or non-visible elements (`offsetParent !== null`).

### 4. Closing with Escape and focus restoration

```typescript
closeModal() {
  this.isOpen.set(false);
  this.lastFocusedElement?.focus();
}
```

On close (whether via `Escape` or the ✕ button), focus returns exactly to the element that opened the modal.

## WCAG Criteria Covered

| Criterion | Description | How it's satisfied |
|-----------|-------------|---------------------|
| 2.1.2 | No Keyboard Trap (dialog exception) | Intentional trap with an escape route via `Escape` |
| 2.4.3 | Focus Order | Confined and logical tab order within the dialog |
| 2.4.7 / 2.4.11 | Focus Visible | Explicit outline via `:focus-visible` |
| 4.1.2 | Name, Role, Value | `role="dialog"`, `aria-modal`, `aria-labelledby` |

## Testing

### Manual (required)

1. Open the modal via mouse or keyboard (`Enter`/`Space` on the trigger).
2. Verify focus lands on the title, with a visible outline.
3. Press `Tab` repeatedly: focus should stay confined within the dialog and, upon reaching the last element, wrap back to the first.
4. Press `Shift+Tab` from the first element: it should jump to the last one.
5. Press `Escape`: the modal closes and focus returns to the trigger button.
6. (Recommended) Repeat the test with a screen reader (NVDA or VoiceOver) to verify the dialog is announced correctly.

### Note on WAVE

The WAVE tool does not detect focus trap, focus visibility, or `Escape` behavior: these aspects require manual keyboard verification. WAVE is useful for complementary checks (e.g. positive `tabindex` values, DOM element order, presence of a valid `aria-labelledby`).

## Possible Future Extensions

- Handling `aria-hidden`/`inert` on the underlying content when the modal is open.
- Open/close animations respectful of `prefers-reduced-motion`.
- Support for non-modal dialogs (without focus trap).

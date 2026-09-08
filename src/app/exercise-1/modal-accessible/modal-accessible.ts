import { Component , signal, effect, viewChild, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal-accessible',
  standalone: true,
  templateUrl: './modal-accessible.html',
  styleUrl: './modal-accessible.scss',
})

export class ModalAccessible {
  isOpen = signal(false);

  // reference to the title inside the dialog, available only when @if is true
  dialogTitle = viewChild<ElementRef<HTMLElement>>('dialogTitle');

  // reference to the dialog container (needed for the focus trap)
  dialogContainer = viewChild<ElementRef<HTMLElement>>('dialogContainer');

  // where the focus was before opening the modal
  private lastFocusedElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {  // synchronous read → isOpen is now a tracked dependency
        setTimeout(() => {
          this.dialogTitle()?.nativeElement.focus();
        }, 0);
      }
    });  
  }

  openModal() {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
    this.lastFocusedElement?.focus();
  }

  // intercepts Escape and Tab only when the modal is open
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

  // focus trap logic
  private trapFocus(event: KeyboardEvent): void {
    const container = this.dialogContainer()?.nativeElement;
    if (!container) return;

    const focusable = this.getFocusableElements(container);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }
}

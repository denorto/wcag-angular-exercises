# ModalAccessible

Componente Angular standalone per una finestra modale (dialog) conforme alle linee guida WCAG in materia di gestione del focus da tastiera.

## Funzionalità implementate

- **Apertura/chiusura reattiva** tramite `signal` (`isOpen`), senza dipendenze da librerie esterne.
- **Focus automatico sul titolo** del dialog al momento dell'apertura, per orientare subito l'utente da tastiera e screen reader.
- **Focus trap** (intrappolamento del focus): con `Tab` e `Shift+Tab` il focus rimane confinato dentro il dialog e non può "sfuggire" verso il contenuto della pagina sottostante.
- **Chiusura con tasto `Escape`**, comportamento standard atteso in qualsiasi dialog modale.
- **Ripristino del focus** sul bottone che ha aperto il modal, alla chiusura (via `Escape`, click sulla `✕`, o altro trigger di chiusura).
- **Attributi ARIA** corretti (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) per l'annuncio semantico da parte degli screen reader.
- **Indicatore di focus visibile** (`outline`) tramite `:focus-visible`, per garantire che ogni elemento che riceve focus sia visivamente identificabile durante la navigazione da tastiera.

## Struttura del componente

```
modal-accessible/
├── modal-accessible.ts       # logica: signal, effect, focus trap, escape
├── modal-accessible.html     # template con attributi ARIA
└── modal-accessible.scss     # stile outline focus-visible
```

## Come funziona

### 1. Apertura del modal

```typescript
openModal() {
  this.lastFocusedElement = document.activeElement as HTMLElement;
  this.isOpen.set(true);
}
```

Prima di aprire il dialog, viene salvato l'elemento che aveva il focus (tipicamente il bottone trigger), così da poterlo ripristinare alla chiusura.

### 2. Focus automatico sul titolo

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

L'`effect` legge `isOpen()` in modo **sincrono**, così Angular può tracciarlo come dipendenza reattiva e rieseguire l'effect ogni volta che il valore cambia. Il `setTimeout` serve ad aspettare che Angular abbia terminato il render del blocco `@if` prima di cercare l'elemento nel DOM.

Il titolo (`<h2>`) ha `tabindex="-1"` nel template: questo lo rende **focusabile via JavaScript** ma non raggiungibile tramite `Tab`, in linea con il pattern ARIA "Dialog (Modal)".

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

Quando il modal è aperto, ogni pressione di `Tab` viene intercettata. Se il focus è sull'ultimo elemento focusabile e si preme `Tab`, il focus torna al primo (e viceversa con `Shift+Tab`), impedendo di uscire dal dialog.

Gli elementi focusabili vengono individuati dinamicamente con:

```typescript
'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
```

escludendo elementi disabilitati o non visibili (`offsetParent !== null`).

### 4. Chiusura con Escape e ripristino del focus

```typescript
closeModal() {
  this.isOpen.set(false);
  this.lastFocusedElement?.focus();
}
```

Alla chiusura (sia da `Escape` che dal bottone `✕`), il focus torna esattamente sull'elemento che aveva aperto il modal.

## Requisiti WCAG coperti

| Criterio | Descrizione | Come è soddisfatto |
|---|---|---|
| 2.1.2 | No Keyboard Trap (con eccezione dialog) | Trap intenzionale con via d'uscita tramite Escape |
| 2.4.3 | Focus Order | Ordine di tabulazione confinato e logico dentro il dialog |
| 2.4.7 / 2.4.11 | Focus Visible | Outline esplicito via `:focus-visible` |
| 4.1.2 | Name, Role, Value | `role="dialog"`, `aria-modal`, `aria-labelledby` |

## Testing

### Manuale (obbligatorio)

1. Apri il modal via mouse o tastiera (`Invio`/`Spazio` sul trigger).
2. Verifica che il focus vada sul titolo, con outline visibile.
3. Premi `Tab` ripetutamente: il focus deve restare confinato nel dialog e, arrivato all'ultimo elemento, tornare al primo.
4. Premi `Shift+Tab` dal primo elemento: deve saltare all'ultimo.
5. Premi `Escape`: il modal si chiude e il focus torna sul bottone trigger.
6. (Consigliato) Ripeti il test con uno screen reader (NVDA o VoiceOver) per verificare che il dialog venga annunciato correttamente.

### Nota su WAVE

Lo strumento WAVE non rileva focus trap, focus visibile o comportamento di Escape: questi aspetti richiedono verifica manuale da tastiera. WAVE è utile per controlli complementari (es. `tabindex` positivi, ordine degli elementi nel DOM, presenza di `aria-labelledby` valido).

## Possibili estensioni future

- Gestione di `aria-hidden`/`inert` sul contenuto sottostante quando il modal è aperto.
- Animazioni di apertura/chiusura rispettose di `prefers-reduced-motion`.
- Supporto per dialog non modali (senza trap del focus).

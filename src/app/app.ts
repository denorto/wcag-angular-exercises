import { Component, signal } from '@angular/core';
import { ModalAccessible } from './exercise-1/modal-accessible/modal-accessible';


@Component({
  selector: 'app-root',
  imports: [ModalAccessible],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('wcag-angular-exercises');
}

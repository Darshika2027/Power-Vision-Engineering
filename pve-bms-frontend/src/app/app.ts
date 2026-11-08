
import { Component } from '@angular/core';
import { CategoryList } from './components/category-list/category-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CategoryList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';

import { FormsModule } from '@angular/forms';

export const comparableNumberOperators = ['>', '>=', '=', '<=', '<'];

export interface ComparableNumber {
  value?: number;
  operator: '>' | '>=' | '=' | '<=' | '<';
}

@Component({
  selector: 'app-comparable-number-input',
  standalone: true,
  templateUrl: './comparable-number-input.component.html',
  styleUrl: './comparable-number-input.component.scss',
  imports: [CommonModule, FormsModule, DropdownModule, InputNumberModule],
})
export class ComparableNumberInputComponent {
  @Input({ required: false})
  decimals: number = 0;

  @Input({ required: false})
  max: number = 999;

  @Input({ required: false})
  min: number = -999;

  @Input({ required: true })
  comparableNumber!: ComparableNumber;

  @Input({ required: false })
  label?: string;

  @Input({ required: false })
  placeholder?: string;

  @Output()
  onChange = new EventEmitter<ComparableNumber>();

  public comparableNumberOperators = comparableNumberOperators;
}

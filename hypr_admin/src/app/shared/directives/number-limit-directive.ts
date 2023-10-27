import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[numberLimit]'
})
export class NumberLimitDirective {
  @Input() minLength: string;
  @Input() maxLength: string;
  @Output() updateValue:EventEmitter<number> = new EventEmitter();

  constructor(private elementRef: ElementRef) { }

  /**
   * Check for keypress event in input field, allow number only within the range provided
   * @param event 
   */
  @HostListener('keydown', ['$event'])
  onKeyPress (event) {
    this.validateFields(event);
  }

  /**
   * Check for paste event in input field, allow numbers only within the range provided
   * @param event 
   */
  @HostListener('paste', ['$event'])
  blockPaste(event) {
    this.validateFields(event);
  }

  /**
   * Adjust the enter value within the range prodvided
   * @param event 
   */
  validateFields(event) {
    setTimeout(() => {
      if (parseInt(this.elementRef.nativeElement.value) > parseInt(this.maxLength)) {
        this.elementRef.nativeElement.value = parseInt(this.maxLength);
      } else if (parseInt(this.elementRef.nativeElement.value) < parseInt(this.minLength)) {
        this.elementRef.nativeElement.value = parseInt(this.minLength);
      }
      this.updateValue.emit(this.elementRef.nativeElement.value);
    }, 1000);
  }
}

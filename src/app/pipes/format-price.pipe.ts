import { Pipe, PipeTransform } from '@angular/core';
import { formatPrice } from '../utils/formatters';

@Pipe({ name: 'formatPrice', standalone: true })
export class FormatPricePipe implements PipeTransform {
  transform(value: number | undefined): string {
    return formatPrice(value);
  }
}

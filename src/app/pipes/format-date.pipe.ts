import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/formatters';

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    return formatDate(value);
  }
}

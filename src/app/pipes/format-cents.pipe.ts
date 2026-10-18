import { Pipe, PipeTransform } from '@angular/core';
import { formatCents } from '../utils/formatters';

@Pipe({ name: 'formatCents', standalone: true })
export class FormatCentsPipe implements PipeTransform {
  transform(value: number | 'unknown' | undefined): string {
    return formatCents(value);
  }
}

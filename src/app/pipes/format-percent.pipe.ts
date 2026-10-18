import { Pipe, PipeTransform } from '@angular/core';
import { formatPercent } from '../utils/formatters';

@Pipe({ name: 'formatPercent', standalone: true })
export class FormatPercentPipe implements PipeTransform {
  transform(value: number | 'unknown' | undefined): string {
    return formatPercent(value);
  }
}

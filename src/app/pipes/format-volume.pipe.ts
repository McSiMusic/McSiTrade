import { Pipe, PipeTransform } from '@angular/core';
import { formatVolume } from '../utils/formatters';

@Pipe({ name: 'formatVolume', standalone: true })
export class FormatVolumePipe implements PipeTransform {
  transform(value: number | undefined): string {
    return formatVolume(value);
  }
}

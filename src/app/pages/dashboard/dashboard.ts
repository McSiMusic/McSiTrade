import { Component, inject } from '@angular/core';
import { FormatCentsPipe } from '../../pipes/format-cents.pipe';
import { FormatPercentPipe } from '../../pipes/format-percent.pipe';
import { FormatVolumePipe } from '../../pipes/format-volume.pipe';
import { MarketDataService } from '../../services/market-data.service';

@Component({
  imports: [FormatCentsPipe, FormatPercentPipe, FormatVolumePipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly marketService = inject(MarketDataService);
}

import { IsString } from 'class-validator';

export class DownloadQuoteDto {
  @IsString()
  quoteId: string;
}

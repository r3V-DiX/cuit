import { PipeTransform, ArgumentMetadata } from "@nestjs/common";
export declare class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any;
  private sanitizeValue;
  private sanitizeString;
}

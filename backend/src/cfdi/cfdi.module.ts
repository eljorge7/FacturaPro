import { Module } from '@nestjs/common';
import { XmlGeneratorService } from './xml-generator/xml-generator.service';
import { PacService } from './pac/pac.service';

@Module({
  providers: [XmlGeneratorService, PacService],
  exports: [XmlGeneratorService, PacService]
})
export class CfdiModule {}

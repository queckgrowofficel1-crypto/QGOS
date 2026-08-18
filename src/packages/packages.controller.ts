import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PACKAGES } from './packages.constants';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  @Get()
  list() {
    return { packages: PACKAGES };
  }
}

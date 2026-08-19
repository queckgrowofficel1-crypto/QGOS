import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { CreateAutomationDto } from './automation.dto';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get()
  list() {
    return this.automation.list();
  }

  @Post()
  create(@Body() body: CreateAutomationDto) {
    return this.automation.create(body);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.automation.activate(id);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.automation.pause(id);
  }
}

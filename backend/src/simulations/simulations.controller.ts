import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './create-simulation.dto';
import { UpdateSimulationDto } from './update-simulation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private simulationsService: SimulationsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateSimulationDto) {
    return this.simulationsService.create(req.user.id, dto);
  }

  @Get()
  findMine(@Request() req: any) {
    return this.simulationsService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simulationsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSimulationDto, @Request() req: any) {
    return this.simulationsService.update(id, req.user.id, dto);
  }

  @Post(':id/recalculate')
  recalculate(@Param('id') id: string, @Request() req: any) {
    return this.simulationsService.recalculate(id, req.user.id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req: any) {
    return this.simulationsService.submit(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.simulationsService.delete(id, req.user.id);
  }
}

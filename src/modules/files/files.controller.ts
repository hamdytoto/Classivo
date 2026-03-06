import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Files module status endpoint' })
  getStatus(): string {
    return this.filesService.getStatus();
  }
}

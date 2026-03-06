import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type RequestWithActor = Request & {
  user?: AuthenticatedActor;
};

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find/list users' })
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiHeader({
    name: 'x-user-id',
    required: false,
    description:
      'Temporary fallback until auth is implemented. Prefer authenticated request.user.',
  })
  me(@Req() request: RequestWithActor) {
    const actor = request.user;
    const fallbackUserId = this.readHeader(request, 'x-user-id');
    const userId = actor?.id ?? actor?.userId ?? actor?.sub ?? fallbackUserId;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required. Provide a valid access token or x-user-id for local testing.',
      });
    }

    return this.usersService.me(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  private readHeader(req: Request, key: string): string | null {
    const value = req.headers[key.toLowerCase()];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && value[0]) {
      return value[0];
    }

    return null;
  }
}

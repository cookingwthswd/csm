import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/supabase.strategy';
import {
  UsersService,
  type UserStatusActionResponse,
} from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateRoleDto,
  UserQueryDto,
  VALID_ROLES,
} from './dto/user.dto';

/**
 * Users Controller
 *
 * Manages user profiles and authentication-related operations.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users - List users with optional filters
   * Admin and Manager only
   */
  @Get()
  @ApiOperation({ summary: 'List users with optional filters' })
  @ApiQuery({ name: 'role', enum: VALID_ROLES, required: false })
  @ApiQuery({ name: 'storeId', type: Number, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'List of users' })
  @Roles('admin', 'manager')
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/me - Get current user profile
   * All authenticated users
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  findMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user);
  }

  /**
   * GET /users/:id - Get user by ID
   * Admin and Manager only
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin', 'manager')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * POST /users - Create new user
   * Admin only
   */
  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * PUT /users/:id - Update user profile
   * Admin can update any user, users can update themselves
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 403, description: 'Cannot update other users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  /**
   * PUT /users/:id/role - Change user role
   * Admin only
   */
  @Put(':id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto);
  }

  /**
   * DELETE /users/:id - Deactivate user
   * Admin only
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<UserStatusActionResponse> {
    if (user.id === id) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    return this.usersService.deactivate(id);
  }

  /**
   * PUT /users/:id/activate - Reactivate user
   * Admin only
   */
  @Put(':id/activate')
  @ApiOperation({ summary: 'Reactivate user' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User activated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserStatusActionResponse> {
    return this.usersService.activate(id);
  }
}

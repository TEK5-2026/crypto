import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards,
    Delete
  } from '@nestjs/common';
  import { AuthGuard } from './auth.guard';
  import { AuthService } from './auth.service';
  import { ApiTags, ApiOperation,ApiResponse, ApiParam, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';

  
  class AccessTokenResponse {
    @ApiProperty({ example: 'your_access_token_value' })
    access_token: string;
  }

  class RegisterResponse {
    @ApiProperty({ example: 'User registered successfully' })
    message: string;
  
    @ApiProperty({
      example: {
        username: 'TheBg',
        email: 'Bob.Marley@test.com',
        password: '$2b$10$11n6GmLnpNHFNDKoniNWgOFbVer.Ajh1tpvBBqcQYuGO9Wv5/m/Ia',
        id: 13,
      },
    })
    user: {
      username: string;
      email: string;
      password: string;
      id: number;
    };
  }

  class ProfileRespond {
    @ApiProperty({example: 0 })
    sub: number

    @ApiProperty({example: 'bob' })
    username: string

    @ApiProperty({example: 1705000472 })
    iat: number

    @ApiProperty({example: 1708000472 })
    exp: number
  }

  class DeleteRespond {
    @ApiProperty({example: 'User deleted successfully' })
    message: string
  }

  @ApiTags('users')
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Login a user' })
    @ApiParam({ name: 'username', description: 'Username' })
    @ApiParam({ name: 'password', description: 'User password' })
    @ApiResponse({
      status: 200,
      description: 'Give you a access_token response',
      type: AccessTokenResponse,
    })
    async signIn(@Body() signInDto: Record<string, any>) {
      return this.authService.signIn(signInDto.username, signInDto.password);
    }
    
    @HttpCode(HttpStatus.OK)
    @Post('register')
    @ApiOperation({ summary: 'Register a user' })
    @ApiParam({ name: 'username', description: 'Username' })
    @ApiParam({ name: 'email', description: 'User email' })
    @ApiParam({ name: 'password', description: 'User password' })
    @ApiResponse({
      status: 200,
      description: 'Create a user from the info',
      type: RegisterResponse,
    })
    async register(@Body() Data: { username: string, email: string, password: string }) {
      return this.authService.register(Data.username, Data.email, Data.password);
    }
    

    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get the username' })
    @ApiBearerAuth()
    @Get('profile')
    @ApiResponse({
      status: 200,
      description: 'Get the JWToken of the profile',
      type: ProfileRespond,
    })
    getProfile(@Request() req) {
      return req.user;
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Delete a user' })
    @ApiBearerAuth()
    @ApiResponse({
      status: 200,
      description: 'Delete the user login',
      type: DeleteRespond,
    })
    @Delete('delete')
    deleteUser(@Request() req) {
      return this.authService.delete(req.user.username);
    }


  }

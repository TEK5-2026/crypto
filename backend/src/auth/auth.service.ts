
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(username:string, pass:string) {
    let user = await this.usersService.findWithUsername(username);
    
    if (!user) {
      user = await this.usersService.findWithEmail(username);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }
    if (await bcrypt.compare(pass, user.password) == false) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.username };
    return {
      message: 'User logged successfully',
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(username: string, email: string, password: string) {

    const newUser = await this.usersService.createUser(username, email, password)

    return {
        message: 'User registered successfully',
        user: newUser
    }
  }

  async delete(username: string) {
    const user = await this.usersService.findWithUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersService.deleteUser(user.id);
    return {
      message : 'User deleted successfully',
    }
  }

}

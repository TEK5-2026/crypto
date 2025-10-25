import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity'
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findWithUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { username } });
    }
    
    async findWithEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async createUser(username: string, email: string, password: string): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const usernameFind = await this.findWithUsername(username);
        const emailFind = await this.findWithEmail(email);

        if (usernameFind) {throw new NotFoundException('Username already exist');}
        if (emailFind) {throw new NotFoundException('Email already exist');}

        const newUser = this.userRepository.create({
            email,
            password: hashedPassword,
            username,
        });
        return this.userRepository.save(newUser);
    }

    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { LoginDto, RegisterDto } from './auth.dto';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, UserRecord>();

  constructor(private readonly jwt: JwtService) {}

  register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (this.users.has(email)) throw new UnauthorizedException('Email already registered');
    const user: UserRecord = { id: randomUUID(), name: dto.name, email, password: dto.password };
    this.users.set(email, user);
    return this.issue(user);
  }

  login(dto: LoginDto) {
    const user = this.users.get(dto.email.toLowerCase());
    if (!user || user.password !== dto.password) throw new UnauthorizedException('Invalid credentials');
    return this.issue(user);
  }

  private issue(user: UserRecord) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}

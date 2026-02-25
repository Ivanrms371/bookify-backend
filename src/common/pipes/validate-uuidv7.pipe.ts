import { Injectable, ParseUUIDPipe } from '@nestjs/common';

@Injectable()
export class ParseUUIDv7Pipe extends ParseUUIDPipe {
  constructor() {
    super({ version: '7' });
  }
}

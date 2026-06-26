import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocalStorage } from './local.storage';

describe('LocalStorage', () => {
  let uploadRoot: string;
  let storage: LocalStorage;

  beforeEach(() => {
    uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-uploads-'));
    const configService = {
      get: jest.fn((key: string) => {
        const values = {
          'app.baseUrl': 'http://localhost:3000',
          'file.uploadRoot': uploadRoot,
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    storage = new LocalStorage(configService);
  });

  afterEach(() => {
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  });

  it('writes files under uploadRoot and returns a public uploads path', async () => {
    const result = await storage.upload(
      {
        buffer: Buffer.from('hello'),
        originalname: 'song.mp3',
        mimetype: 'audio/mpeg',
        size: 5,
      } as Express.Multer.File,
      'audio',
    );

    expect(result.path).toMatch(/^uploads\/audio\/\d{8}\/[0-9a-f-]{36}\.mp3$/);
    expect(result.url).toBe(`http://localhost:3000/${result.path}`);
    expect(fs.existsSync(path.join(uploadRoot, result.path.slice(8)))).toBe(
      true,
    );
  });
});

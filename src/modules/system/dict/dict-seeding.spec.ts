import { readFileSync } from 'fs';
import { join } from 'path';

describe('dictionary seeding configuration', () => {
  it('defines SystemDict menu in init-admin script and not in DictModule', () => {
    const initAdminScript = readFileSync(
      join(process.cwd(), 'scripts', 'init-admin.ts'),
      'utf8',
    );
    const dictModule = readFileSync(
      join(process.cwd(), 'src', 'modules', 'system', 'dict', 'dict.module.ts'),
      'utf8',
    );

    expect(initAdminScript).toContain("name: 'SystemDict'");
    expect(initAdminScript).toContain("authCode: 'system:dict:list'");
    expect(initAdminScript).toContain("authCode: 'system:dict:create'");
    expect(initAdminScript).toContain("authCode: 'system:dict:update'");
    expect(initAdminScript).toContain("authCode: 'system:dict:delete'");
    expect(dictModule).not.toContain('implements OnModuleInit');
    expect(dictModule).not.toContain('ensureMenu(');
  });
});

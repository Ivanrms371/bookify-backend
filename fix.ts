import { readFileSync, writeFileSync } from 'fs';

let path = 'src/modules/users/users.controller.ts';
let code = readFileSync(path, 'utf8');
code = code.replace("@CurrentTenant('id')", "@CurrentTenant('tenantId')");
writeFileSync(path, code);

path = 'src/modules/users/users.repository.ts';
code = readFileSync(path, 'utf8');
// Remove duplicates and fix relation to "professional: true"
// We will just read lines and construct a new file. Wait, easier to do regex.
code = code.replace(/async findProfileWithProfessional[\s\S]*?async findMeContext/g, 'async findMeContext');
code = code.replace(/async findMeContext/, `async findProfileWithProfessional(userId: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        professional: true,
      }
    });
  }

  async findMeContext`);
writeFileSync(path, code);

import { readFileSync, writeFileSync } from 'fs';

let path = 'src/modules/users/users.repository.ts';
let code = readFileSync(path, 'utf8');

const newMethod = `
  async findProfileWithProfessional(userId: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        professionals: {
          where: {
            tenantId,
            isActive: true,
          }
        }
      }
    });
  }
`;

code = code.replace(
  'async findMeContext(userId: string) {',
  newMethod + '\n  async findMeContext(userId: string) {'
);

writeFileSync(path, code);

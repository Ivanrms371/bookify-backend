import { readFileSync, writeFileSync } from 'fs';

const path = 'src/modules/professionals/professionals.service.ts';
let code = readFileSync(path, 'utf8');

if (!code.includes("async findByUserId(tenantId: string, userId: string)")) {
  const method = `
  async findByUserId(tenantId: string, userId: string) {
    const professional = await this.professionalsRepository.findByUserId(tenantId, userId);
    if (!professional) {
      throw new NotFoundException('Perfil profesional no encontrado para este usuario');
    }
    return professional;
  }
`;
  code = code.replace("async linkToUser", method + "  async linkToUser");
  writeFileSync(path, code);
}

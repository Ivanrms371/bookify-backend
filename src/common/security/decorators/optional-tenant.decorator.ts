import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_TENANT_KEY = 'isOptionalTenant';
export const OptionalTenant = () => SetMetadata(IS_OPTIONAL_TENANT_KEY, true);

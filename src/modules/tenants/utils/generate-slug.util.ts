export const generateSlugTenant = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

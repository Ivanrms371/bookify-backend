export function mapOnboardingStatus() {
  return {
    onboardingStatus: '',
    isCompleted: false,
    savedData: {
      workspaceType: '',
      name: '',
      slug: '',
      type: '',
      logoUrl: '',
      coverUrl: '',
      colorTheme: '',
      workingHours: {},
      services: [],
    },
  };
}

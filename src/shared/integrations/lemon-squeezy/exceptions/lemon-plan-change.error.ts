export class LemonPlanChangeError extends Error {
  constructor(readonly rejected: boolean) {
    super(rejected ? 'Provider rejected the plan change.' : 'Provider plan change result is unconfirmed.');
  }
}

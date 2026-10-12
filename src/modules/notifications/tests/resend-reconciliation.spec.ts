import { EmailGateway } from '../infraestructure/gateways/email.gateway';
const get = jest.fn();
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ get })) }));
const config = { getOrThrow: (name: string) => ({ RESEND_API_KEY: 'test', NODE_ENV: 'test', RESEND_SANDBOX: 'test@example.com' })[name] };
beforeEach(() => get.mockReset());
it.each(['sent', 'delivered', 'bounced', 'failed'])(
  'treats an existing %s email as provider acceptance without refunding quota',
  async (last_event) => {
    get.mockResolvedValue({ data: { id: 'provider', created_at: '2026-10-10T12:00Z', last_event } });
    expect(await new EmailGateway(config as never).getAcceptance('provider')).toEqual({
      id: 'provider',
      acceptedAt: new Date('2026-10-10T12:00Z'),
    });
    expect(get).toHaveBeenCalledWith('/emails/provider', { headers: {}, signal: expect.anything() });
  },
);
it.each([
  { data: null, error: { statusCode: 404 } },
  { data: null, error: { statusCode: 429 } },
  { data: null, error: { statusCode: 500 } },
  { data: { id: 'other' } },
])('does not turn absent or mismatched evidence into non-acceptance', async (response) => {
  get.mockResolvedValue(response);
  expect(await new EmailGateway(config as never).getAcceptance('provider')).toBeNull();
});
it('propagates transport failure for the cron to leave unresolved', async () => {
  get.mockRejectedValue(new Error('timeout'));
  await expect(new EmailGateway(config as never).getAcceptance('provider')).rejects.toThrow('timeout');
});

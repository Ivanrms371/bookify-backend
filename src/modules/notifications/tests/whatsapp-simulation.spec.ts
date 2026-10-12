import { WhatsappGateway } from '../infraestructure/gateways/whatsapp.gateway';
import { SimulatedDeliveryError } from '../errors/simulated-delivery.error';

it('logs the WhatsApp payload and explicitly reports simulation instead of provider acceptance', async () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    const payload = { body: 'Test appointment notice' };
    await expect(new WhatsappGateway().send('+59800000000', payload)).rejects.toBeInstanceOf(SimulatedDeliveryError);
    expect(log).toHaveBeenCalledWith('WhatsApp simulation', { to: '+59800000000', payload });
  } finally {
    log.mockRestore();
  }
});

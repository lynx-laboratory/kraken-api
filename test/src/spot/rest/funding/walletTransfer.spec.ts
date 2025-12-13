import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  walletTransfer,
  type KrakenWalletTransferResult,
} from '../../../../../src/spot/rest/funding/walletTransfer';

describe('walletTransfer', () => {
  it('posts WalletTransfer with amount stringified', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWalletTransferResult = { refid: 'REF123' };
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await walletTransfer(base, {
      asset: 'USDT',
      from: 'Spot Wallet',
      to: 'Futures Wallet',
      amount: 12.34,
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith('/0/private/WalletTransfer', {
      asset: 'USDT',
      from: 'Spot Wallet',
      to: 'Futures Wallet',
      amount: '12.34',
    });
    expect(res).toBe(mocked);
  });

  it('keeps string amount as-is', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;
    (base.privatePost as any).mockResolvedValueOnce({ refid: 'REF999' });

    await walletTransfer(base, {
      asset: 'XBT',
      from: 'Spot Wallet',
      to: 'Futures Wallet',
      amount: '0.01',
    });

    expect(base.privatePost).toHaveBeenCalledWith('/0/private/WalletTransfer', {
      asset: 'XBT',
      from: 'Spot Wallet',
      to: 'Futures Wallet',
      amount: '0.01',
    });
  });
});

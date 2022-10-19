import React from 'react';
import { CandyMachineAccount } from '../../../services/solana/minting/candy-machine';
import { Button } from '@windmill/react-ui';

export const MintButton = ({
  onMint,
  candyMachine,
  isMinting,
  isActive,
}: {
  onMint: () => Promise<void>;
  candyMachine?: CandyMachineAccount;
  isMinting: boolean;
  isActive: boolean;
}) => {
  const getMintButtonContent = () => {
    if (candyMachine?.state.isSoldOut) {
      return 'SOLD OUT';
    } else if (isMinting) {
      return 'Minting ...';
    } else if (
      candyMachine?.state.isPresale ||
      candyMachine?.state.isWhitelistOnly
    ) {
      return 'WHITELIST MINT';
    }

    return 'MINT';
  };

  return (
    <>
      <Button
        onClick={async () => {
          await onMint();
        }}
        disabled={isMinting || !isActive}
      >
        {getMintButtonContent()}
      </Button>

    </>
  );
};

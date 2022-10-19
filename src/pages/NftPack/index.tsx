import React from 'react';

import PageTitle from '../../components/Typography/PageTitle';
import booster from '../../assets/img/booster.jpg';
import CandyMachine from '../../components/Solana/CandyMachine';
import * as gumdrop from './gumdrop.json';
import { MintCountdown } from '../../components/Solana/MintCountdown';

function NftPack() {
  return (
    <>
      <PageTitle>NFT Pack Mint Page</PageTitle>
        <div className="pt-8 grid gap-6 grid-cols-2">
          <div className="flex justify-center">
            <div className="w-1/2">
              <img
                aria-hidden="true"
                className="w-64"
                src={booster}
                alt="NFT Pack"
              />
              <p className='pt-4 text-gray-500 text-center'>
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <CandyMachine
                            candyMachineId="BaDQZbv1pjj4XSun6iizfha1xcRojTtX7gCLEf4XQnur"
                            whitelist={gumdrop}
                            whitelistMint="DqEXaNpbF9cpvKgW6oyezdequozXAFNTn2aJWQVJrC5A"
                            name={'XHEN'}
                        />
                        <MintCountdown date={new Date()}/>
          </div>
        </div>
    </>
  );
};

export default NftPack;

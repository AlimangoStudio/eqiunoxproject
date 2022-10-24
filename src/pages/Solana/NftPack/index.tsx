import React from 'react';

import PageTitle from '../../../components/Typography/PageTitle';
import booster from '../../../assets/img/booster.jpg';
import CandyMachine from '../../../components/Solana/CandyMachine';
import gumdrop from './gumdrop.json';
import { MintCountdown } from '../../../components/Solana/MintCountdown';

function NftPack() {
  return (
    <>
      <PageTitle>NFT Pack Mint Page</PageTitle>
        <div className="pt-8">
          <div className="flex flex-col justify-center items-center">
            <img
              aria-hidden="true"
              className="w-64"
              src={booster}
              alt="NFT Pack"
            />
            <p className='pt-4 text-gray-500 text-center w-64'>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.
            </p>
          </div>
          <div className="pt-8 flex items-center justify-center">
            <CandyMachine
                candyMachineId="7HgTf1XFqYmMhATAzAAbejmCDLbeoJBUDRL8jQH67yXN"
                whitelist={gumdrop}
                whitelistMint="DqEXaNpbF9cpvKgW6oyezdequozXAFNTn2aJWQVJrC5A"
                name={'NFT PACK'}
            />
          </div>
        </div>
    </>
  );
};

export default NftPack;

import React from 'react';

import PageTitle from '../components/Typography/PageTitle';

import booster from '../assets/img/booster.jpg';
import { Button } from '@windmill/react-ui';

function NftPack() {
  return (
    <>
      <PageTitle>NFT Pack Mint Page</PageTitle>
      <div className="pt-8 grid gap-6 grid-cols-2">
        <div className="flex justify-center">
          <div className="w-1/2">
            <img
              aria-hidden="true"
              className="object-cover w-full h-full"
              src={booster}
              alt="NFT Pack"
            />
          </div>
        </div>
        <div className="flex items-center">
          <Button>
            Mint NFT Pack
          </Button>
        </div>
      </div>
    </>
  );
};

export default NftPack;

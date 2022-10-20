import React from 'react'

import PageTitle from '../components/Typography/PageTitle'
import SectionTitle from '../components/Typography/SectionTitle'
import CTA from '../components/CTA'
import InfoCard from '../components/Cards/InfoCard'
import { Card, CardBody } from '@windmill/react-ui'
import { CartIcon, ChatIcon, MoneyIcon, PeopleIcon } from '../icons'
import RoundIcon from '../components/RoundIcon'
import pic from "../assets/img/23.png"
import usdc from "../assets/img/USDC.png"
import { 
  ConnectionProvider, 
  WalletProvider,
} from "@solana/wallet-adapter-react/lib/index.js";
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getLedgerWallet,
  getSolletWallet,
  getSolletExtensionWallet
} from '@solana/wallet-adapter-wallets';
import { 
  WalletModalProvider,
} from "@solana/wallet-adapter-react-ui";
import { 
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {useWallet } from '@solana/wallet-adapter-react';

import '@solana/wallet-adapter-react-ui/styles.css';
const wallets = [
  getPhantomWallet(),
  getSlopeWallet(),
  getSolflareWallet(),
  getLedgerWallet(),
  getSolletWallet(),
  getSolletExtensionWallet()
];

function Staking() {
  return (
    <>
    <PageTitle>Staking</PageTitle>
    <div className="flex justify-center">

      <div className="block rounded-lg text-white shadow-lg bg-blue-800 max-w-lg text-center">
        <div className="py-3 px-6 grid grid-cols-2 gap-1">
          <div className='grid grid-cols-2 gap-1'>
            <img className='rounded-lg' src={pic} alt='image' />
            <div className='flex text-left items-end text-xl font-medium'>
              Solar<br/>Sentry
            </div>
          </div>
          <div className='flex items-center justify-self-center'>
            <button type="button" className=" inline-block rounded-lg px-12 py-4 bg-purple-600 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
              Connect Wallet
            </button>
          </div>
        </div>
        <div className="p-6 m-12 bg-indigo-900">
          <h5 className="text-white text-xl font-medium mb-2">Number of Stakable NFT</h5>
          <p className="text-white text-base mb-4">
            100
          </p>
          <button type="button" className=" inline-block px-12 py-4 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
            STAKE ALl
          </button>
        </div>
        <div className="py-3 px-6 mb-6 grid grid-cols-2 gap-1 text-white">
          <div>EARNINGS :</div>
          <div className='flex'><img className='h-6 w-6 mr-2' src={usdc} /> 0.0123</div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Staking

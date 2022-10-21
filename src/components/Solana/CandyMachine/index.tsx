import * as anchor from '@project-serum/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  createAccountsForMint,
  getCandyMachineState,
  getCollectionPDA,
  mintOneToken,
  SetupState,
} from '../../../services/solana/minting/candy-machine';
import { MintButton } from '../MintButton';
import { MintCountdown } from '../MintCountdown';
import {
  AlertState,
  formatNumber,
  getAtaForMint,
  toDate,
} from '../../../services/solana/minting/utils';
import {
  GUMDROP_DISTRIBUTOR_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '../../../services/solana/minting/ids';
import { MerkleTree } from '../../../services/solana/minting/merkle-tree';
import Gumdrop from '../../../services/solana/minting/gumdrop';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useInterval } from '../../../hooks/useInterval';
import { useAlert } from 'react-alert';

interface WhitelistEntries {
  handle: string;
  amount: number;
  url: string;
}

export interface MachineProps {
  name: string;
  candyMachineId: string;
  whitelist?: WhitelistEntries[];
  whitelistMint?: string;
}

export const DEFAULT_TIMEOUT = 60000;

const getCandyMachineId = (id: string): anchor.web3.PublicKey => {
  try {
    return new anchor.web3.PublicKey(id);
  } catch (e) {
    throw new Error('Failed to construct CandyMachineId');
  }
};

const getCountdownDate = (
  candyMachine: CandyMachineAccount
): Date | undefined => {
  if (
    candyMachine.state.isActive &&
    candyMachine.state.endSettings?.endSettingType.date
  ) {
    return toDate(candyMachine.state.endSettings.number);
  }

  return toDate(
    candyMachine.state.goLiveDate
      ? candyMachine.state.goLiveDate
      : candyMachine.state.isPresale
        ? new anchor.BN(new Date().getTime() / 1000)
        : undefined
  );
};

const Machine = (props: MachineProps) => {
  const [isUserMinting, setIsUserMinting] = useState(false);
  const alert = useAlert();
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();

  const [isActive, setIsActive] = useState(false);
  const [endDate, setEndDate] = useState<Date>();
  const [itemsRemaining, setItemsRemaining] = useState<number>();
  const [itemsAvailable, setItemsAvailable] = useState<number>();
  const [startDate, setStartDate] = useState('');
  const [isPresale, setIsPresale] = useState(false);
  const [isValidBalance, setIsValidBalance] = useState(false);
  const [discountPrice, setDiscountPrice] = useState<anchor.BN>();
  const [needTxnSplit, setNeedTxnSplit] = useState(true);
  const [setupTxn, setSetupTxn] = useState<SetupState>();
  const [mintsLeft, setMintsLeft] = useState(2);
  const [claimToken, setClaimToken] = useState(false);

  const [useWhitelist, setUseWhitelist] = useState(false);

  const wallet = useWallet();
  const connection = useConnection();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const refreshCandyMachineState = useCallback(
    async (commitment: Commitment = 'confirmed') => {
      if (!anchorWallet) {
        return;
      }

      const anchorConnection = new anchor.web3.Connection(
        connection.connection.rpcEndpoint,
        commitment
      );

      const candyMachineId = getCandyMachineId(props.candyMachineId);
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          candyMachineId,
          anchorConnection
        );
        console.log('Candy machine state: ', cndy);

        let active = cndy?.state.goLiveDate
          ? cndy?.state.goLiveDate.toNumber() < new Date().getTime() / 1000
          : false;
        let presale = false;

        setItemsAvailable(cndy.state.itemsAvailable);

        if (cndy.state.goLiveDate) {
          const d = new Date(cndy.state.goLiveDate.toNumber() * 1000);
          const months = [
            'JANUARY',
            'FEBRUARY',
            'MARCH',
            'APRIL',
            'MAY',
            'JUNE',
            'JULY',
            'AUGUST',
            'SEPTEMBER',
            'OCTOBER',
            'NOVEMBER',
            'DECEMBER',
          ];
          let append = '';
          if (d.getDate() === 1) {
            append = 'st';
          } else if (d.getDate() === 2) {
            append = 'nd';
          } else if (d.getDate() === 3) {
            append = 'rd';
          } else {
            append = 'th';
          }

          setStartDate(d.getDate() + append + ' ' + months[d.getMonth()]);
        } else {
          setStartDate('');
        }

        // duplication of state to make sure we have the right values!
        const isWLUser = isWhitelistUser;
        let userPrice = cndy.state.price;

        let useWhitelist = false;
        // whitelist mint?
        if (cndy?.state.whitelistMintSettings) {
          // is it a presale mint?
          if (
            cndy.state.whitelistMintSettings.presale &&
            (!cndy.state.goLiveDate ||
              cndy.state.goLiveDate.toNumber() > new Date().getTime() / 1000)
          ) {
            presale = true;
          }
          // is there a discount?
          if (cndy.state.whitelistMintSettings.discountPrice) {
            setDiscountPrice(cndy.state.whitelistMintSettings.discountPrice);
            userPrice = cndy.state.whitelistMintSettings.discountPrice;
          } else {
            setDiscountPrice(undefined);
            // when presale=false and discountPrice=null, mint is restricted
            // to whitelist users only
            if (!cndy.state.whitelistMintSettings.presale) {
              cndy.state.isWhitelistOnly = true;
            }
          }
          // retrieves the whitelist token
          const mint = new anchor.web3.PublicKey(
            cndy.state.whitelistMintSettings.mint
          );
          useWhitelist = true;
          const token = (await getAtaForMint(mint, anchorWallet.publicKey))[0];

          active = isWLUser && (presale || active);
          try {
            const balance = await anchorConnection.getTokenAccountBalance(
              token
            );
            const claimedToken = parseInt(balance.value.amount) >= 0;
            setMintsLeft(
              Math.min(
                parseInt(balance.value.amount),
                cndy.state.itemsRemaining
              )
            );

            if (cndy.state.isWhitelistOnly) {
              active = parseInt(balance.value.amount) > 0 && active;
            }
            setClaimToken(false);
          } catch (e) {
            setMintsLeft(whitelistClaim?.amount || 0);
            setClaimToken(true);
            console.log('There was a problem fetching whitelist token balance');
            console.log(e);
          }
        }
        setUseWhitelist(useWhitelist);
        userPrice = isWLUser ? userPrice : cndy.state.price;

        if (cndy?.state.tokenMint) {
          // retrieves the SPL token
          const mint = new anchor.web3.PublicKey(cndy.state.tokenMint);
          const token = (await getAtaForMint(mint, anchorWallet.publicKey))[0];
          try {
            const balance = await anchorConnection.getTokenAccountBalance(
              token
            );

            const valid = new anchor.BN(balance.value.amount).gte(userPrice);

            // only allow user to mint if token balance >  the user if the balance > 0
            setIsValidBalance(valid);
            active = active && valid;
          } catch (e) {
            setIsValidBalance(false);
            active = false;
            // no whitelist user, no mint
            console.log('There was a problem fetching SPL token balance');
            console.log(e);
          }
        } else {
          const balance = new anchor.BN(
            await anchorConnection.getBalance(anchorWallet.publicKey)
          );
          const valid = balance.gte(userPrice);
          setIsValidBalance(valid);
          active = active && valid;
        }

        // datetime to stop the mint?
        if (cndy?.state.endSettings?.endSettingType.date) {
          setEndDate(toDate(cndy.state.endSettings.number));
          if (
            cndy.state.endSettings.number.toNumber() <
            new Date().getTime() / 1000
          ) {
            active = false;
          }
        }

        // amount to stop the mint?
        if (cndy?.state.endSettings?.endSettingType.amount) {
          const limit = Math.min(
            cndy.state.endSettings.number.toNumber(),
            cndy.state.itemsAvailable
          );
          if (cndy.state.itemsRedeemed < limit) {
            setItemsRemaining(limit - cndy.state.itemsRedeemed);
          } else {
            setItemsRemaining(0);
            cndy.state.isSoldOut = true;
          }
        } else {
          setItemsRemaining(cndy.state.itemsRemaining);
        }

        if (cndy.state.isSoldOut) {
          active = false;
        }

        const [collectionPDA] = await getCollectionPDA(candyMachineId);
        const collectionPDAAccount = await anchorConnection.getAccountInfo(
          collectionPDA
        );

        setIsActive((cndy.state.isActive = active));
        setIsPresale((cndy.state.isPresale = presale));
        setCandyMachine(cndy);

        const txnEstimate =
          892 +
          (!!collectionPDAAccount && cndy.state.retainAuthority ? 182 : 0) +
          (cndy.state.tokenMint ? 66 : 0) +
          (cndy.state.whitelistMintSettings ? 34 : 0) +
          (cndy.state.whitelistMintSettings?.mode?.burnEveryTime ? 34 : 0) +
          (cndy.state.gatekeeper ? 33 : 0) +
          (cndy.state.gatekeeper?.expireOnUse ? 66 : 0);

        setNeedTxnSplit(txnEstimate > 1230);
      } catch (e) {
        if (e instanceof Error) {
          if (e.message === `Account does not exist ${props.candyMachineId}`) {
            alert.error(`Couldn't fetch candy machine state!`);
          } else if (e.message.startsWith('failed to get info about account')) {
            alert.error(`Couldn't fetch account!`);
          }
        } else {
          alert.error(`${e}`);
        }
        console.log(e);
      }
    },
    [anchorWallet, props.candyMachineId, alert]
  );

  const toggleMintButton = () => {
    let active = !isActive || isPresale;

    if (active) {
      if (candyMachine!.state.isWhitelistOnly && !isWhitelistUser) {
        active = false;
      }
      if (endDate && Date.now() >= endDate.getTime()) {
        active = false;
      }
    }

    if (
      isPresale &&
      candyMachine!.state.goLiveDate &&
      candyMachine!.state.goLiveDate.toNumber() <= new Date().getTime() / 1000
    ) {
      setIsPresale((candyMachine!.state.isPresale = false));
    }

    setIsActive((candyMachine!.state.isActive = active));
  };

  const whitelist = useMemo(
    () => (props.whitelist ? props.whitelist : []),
    [props.whitelist]
  );

  const whitelistClaim = useMemo(() => {
    const f = whitelist.filter(handle => {
      return handle.handle === wallet.publicKey?.toBase58();
    });
    if (f.length === 0) {
      return null;
    }
    return f[0];
  }, [wallet, whitelist]);

  const isWhitelistUser = useMemo(() => {
    return whitelistClaim !== null;
  }, [whitelistClaim]);

  const onMint = async (
    beforeTransactions: Transaction[] = [],
    afterTransactions: Transaction[] = []
  ) => {
    try {
      setIsUserMinting(true);
      const anchorConnection = new anchor.web3.Connection(
        connection.connection.rpcEndpoint,
        'confirmed'
      );

      if (useWhitelist && whitelistClaim && claimToken) {
        let url = whitelistClaim.url;
        url = url.substring('https://gumdrop.metaplex.com//claim?'.length);
        const values = url.split('&');
        const obj: { [key: string]: any } = {};
        values.forEach(v => {
          const [key, value] = v.split('=');
          obj[key] = value;
        });
        alert.info('Please sign claim of whitelist token.');
        const claim = {
          amountStr: obj.amount,
          distributor: obj.distributor,
          handle: obj.handle,
          whitelistMint: props.whitelistMint!,
          indexStr: obj.index,
          proofStr: obj.proof,
          claimMethod: 'candy',
          tokenAcc: obj.tokenAcc,
        };
        try {
          await Gumdrop.onMint(anchorConnection, anchorWallet!, claim, alert);
        } catch (error: any) {
          let message = error.msg || 'Whitelist claim failed!';
          console.log(error);
          alert.error(message);
          return;
        }
      }

      if (
        wallet.connected &&
        candyMachine?.program &&
        wallet.publicKey &&
        anchorWallet
      ) {
        let setupMint: SetupState | undefined;
        if (needTxnSplit && setupTxn === undefined) {
          alert.info('Please sign account setup transaction');
          setupMint = await createAccountsForMint(
            anchorWallet,
            candyMachine,
            wallet.publicKey
          );
          let status: any = { err: true };
          if (setupMint.transaction) {
            status = await awaitTransactionSignatureConfirmation(
              setupMint.transaction,
              DEFAULT_TIMEOUT,
              anchorConnection,
              true
            );
          }
          if (status && !status.err) {
            setSetupTxn(setupMint);
            alert.info(
              'Setup transaction succeeded! Please sign minting transaction'
            );
          } else {
            alert.error('Mint failed! Please try again!');
            setIsUserMinting(false);
            return;
          }
        } else {
          alert.info('Please sign minting transaction');
        }

        const mintResult = await mintOneToken(
          anchorWallet,
          candyMachine,
          wallet.publicKey,
          beforeTransactions,
          afterTransactions,
          setupMint ?? setupTxn
        );

        let status: any = { err: true };
        let metadataStatus = null;
        if (mintResult) {
          status = await awaitTransactionSignatureConfirmation(
            mintResult.mintTxId,
            DEFAULT_TIMEOUT,
            anchorConnection,
            true
          );

          metadataStatus =
            await candyMachine.program.provider.connection.getAccountInfo(
              mintResult.metadataKey,
              'processed'
            );
          console.log('Metadata status: ', !!metadataStatus);
        }

        if (status && !status.err && metadataStatus) {
          // manual update since the refresh might not detect
          // the change immediately
          const remaining = itemsRemaining! - 1;
          setItemsRemaining(remaining);
          setIsActive((candyMachine.state.isActive = remaining > 0));
          candyMachine.state.isSoldOut = remaining === 0;
          setSetupTxn(undefined);
          alert.success('Congratulations! Mint succeeded!');
          refreshCandyMachineState('processed');
        } else if (status && !status.err) {
          alert.error(
            'Mint likely failed! Anti-bot SOL 0.01 fee potentially charged! Check the explorer to confirm the mint failed and if so, make sure you are eligible to mint before trying again.'
          );
          refreshCandyMachineState();
        } else {
          alert.error('Mint failed! Please try again!');
          refreshCandyMachineState();
        }
      }
    } catch (error: any) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction timeout! Please try again.';
        } else if (error.message === 'Failed to sign transaction') {
          message = `Failed to sign transaction`;
        }
      } else {
        if (error.code === 311) {
          console.log(error);
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      alert.error(message);
      // updates the candy machine state to reflect the latest
      // information on chain
      refreshCandyMachineState();
    } finally {
      setIsUserMinting(false);
    }
  };

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    connection,
    refreshCandyMachineState,
  ]);

  useInterval(() => {
    refreshCandyMachineState()
  }, 20000);

  return (
    <>
      {!wallet.connected ? (
        <div className='grid container content-center flex-nowrap'>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          {candyMachine && (
            <>
              <div className='max-w-xs relative'>
                <div className='p-6 bg-gray-800 rounded-md mt-3 flex flex-col w-96'>
                  <div className='grid grid-cols-2 place-content-between text-white'>
                    <div>
                      {startDate}
                    </div>
                    <div className='text-right'>
                      {candyMachine.state.goLiveDate &&
                        new Date(Date.now()) >
                        toDate(candyMachine.state.goLiveDate)! &&
                        (!endDate || Date.now() < endDate.getTime()) && (
                          <span>
                            &bull;
                            Live
                          </span>
                        )}
                      {candyMachine.state.goLiveDate &&
                        new Date(Date.now()) <
                        toDate(candyMachine.state.goLiveDate)! && (
                          <span className='text-gray-400'>
                            &bull;
                            Soon
                          </span>
                        )}
                      {(candyMachine?.state?.isSoldOut ||
                        (endDate && Date.now() > endDate.getTime())) && (
                          <span>
                            &bull;
                            Completed
                          </span>
                        )}
                    </div>
                    <div
                      className='uppercase font-bold text-white my-1 text-lg'
                    >
                      {props.name}
                    </div>
                    <div
                        className='text-right uppercase font-bold my-1 text-lg text-white'
                      >
                        {isWhitelistUser && discountPrice
                          ? ` ${formatNumber.asNumber(discountPrice)} sol`
                          : ` ${formatNumber.asNumber(
                            candyMachine.state.price
                          )} sol`}
                    </div>

                    <div>
                      {candyMachine.state.goLiveDate &&
                        new Date(Date.now()) >
                        toDate(candyMachine.state.goLiveDate)! &&
                        (!endDate || Date.now() < endDate.getTime()) && (
                          <>{itemsAvailable} Supply</>
                        )}
                      {(candyMachine?.state?.isSoldOut ||
                        (endDate && Date.now() > endDate.getTime())) && (
                          <>Finsihed!</>
                        )}
                    </div>
                    <div>
                      {/* <p className='text-right'>
                        {`${(
                          100 -
                          (itemsRemaining! / itemsAvailable!) * 100
                        ).toFixed(0)} % minted`}
                      </p> */}
                    </div>
                  </div>

                  {candyMachine.state.goLiveDate &&
                    new Date(Date.now()) <
                    toDate(candyMachine.state.goLiveDate)! && (
                      <div className='pt-4 flex justify-center'>
                        <MintCountdown
                          key="goLive"
                          date={getCountdownDate(candyMachine)}
                          status={
                            candyMachine?.state?.isSoldOut ||
                              (endDate && Date.now() > endDate.getTime())
                              ? 'COMPLETED'
                              : isPresale
                                ? 'PRESALE'
                                : 'LIVE'
                          }
                          onComplete={toggleMintButton}
                        />
                      </div>
                    )}
                  {isActive && (
                    <div
                      className='container flex flex-col items-center justify-center pt-3'
                    >
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isUserMinting}
                        onMint={onMint}
                        isActive={
                          isActive ||
                          (isPresale && isWhitelistUser && isValidBalance)
                        }
                      />
                    </div>
                  )}
                  {useWhitelist &&
                    (!endDate || Date.now() < endDate.getTime()) && (
                      <>
                        <div
                          className='container mt-4 flex text-xs flex-col items-center justify-center text-gray-400'
                        >
                          {isWhitelistUser && (
                            <div>
                              You are on the whitelist!{' '}
                              {mintsLeft > 0 ? (
                                <>You can still mint up to {mintsLeft} token.</>
                              ) : (
                                <>You cannot mint any token anymore.</>
                              )}
                            </div>
                          )}
                          {!isWhitelistUser && (
                            <div>
                              You are not on the whitelist!
                            </div>
                          )}
                        </div>
                      </>
                    )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Machine;

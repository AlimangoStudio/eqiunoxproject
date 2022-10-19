import {
  Chip,
  Container,
  Grid,
  ListItem,
  Paper,
  Typography,
} from "@material-ui/core";
import * as anchor from "@project-serum/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Commitment, Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  createAccountsForMint,
  getCandyMachineState,
  getCollectionPDA,
  mintOneToken,
  SetupState,
} from "../candy-machine";
import { MintButton } from "../MintButton";
import { MintCountdown } from "../MintCountdown";
import { AlertState, formatNumber, getAtaForMint, toDate } from "../utils";
import Wallet from "../Wallet";
import styled from "styled-components";
import { number } from "prop-types";
import { GUMDROP_DISTRIBUTOR_ID, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../ids";
import { MerkleTree } from "../merkleTree";
import Gumdrop from "../Gumdrop/gumdrop";
import { DragHandle } from "@material-ui/icons";


interface WhitelistEntries {
  handle: string;
  amount: number;
  url: string;
}

export interface MachineProps {
  candyMachineId: string;
  connection: anchor.web3.Connection;
  txTimeout: number;
  rpcHost: string;
  network: WalletAdapterNetwork;
  error?: string;
  who: string;

  whitelist?: WhitelistEntries[];
  whitelistAppend?: { list: WhitelistEntries[]; date: Date };

  setAlertState: Dispatch<SetStateAction<AlertState>>;
}

const getCandyMachineId = (id: string): anchor.web3.PublicKey => {
  try {
    return new anchor.web3.PublicKey(id);
  } catch (e) {
    throw new Error("Failed to construct CandyMachineId");
  }
};

const MintContainer = styled.div``; // add your owns styles here


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
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [isUserMinting, setIsUserMinting] = useState(false);
  const setAlertState = props.setAlertState;

  const [isActive, setIsActive] = useState(false);
  const [endDate, setEndDate] = useState<Date>();
  const [itemsRemaining, setItemsRemaining] = useState<number>();
  const [itemsAvailable, setItemsAvailable] = useState<number>();
  const [startDate, setStartDate] = useState("");
  const [isPresale, setIsPresale] = useState(false);
  const [isValidBalance, setIsValidBalance] = useState(false);
  const [discountPrice, setDiscountPrice] = useState<anchor.BN>();
  const [needTxnSplit, setNeedTxnSplit] = useState(true);
  const [setupTxn, setSetupTxn] = useState<SetupState>();
  const [mintsLeft, setMintsLeft] = useState(2);

  const [time, setTime] = useState(new Date(Date.now()));
  const [appendWhitelist, setAppendWhitelist] = useState(false);
  const [useWhitelist, setUseWhitelist] = useState(false);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const t = new Date(Date.now());
      setTime(t);
      if (props.whitelistAppend) {
        if (t > props.whitelistAppend.date) {
          setAppendWhitelist(true);
        }
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const wallet = useWallet();

  const whitelist = useMemo(() => {
    if (appendWhitelist) {
      return [...props.whitelist!, ...props.whitelistAppend!.list];
    } else {
      return props.whitelist ? props.whitelist : [];
    }
  }, [appendWhitelist]);

  const whitelistClaim = useMemo(() => {
    const f = whitelist.filter((handle) => {
      return handle.handle === wallet.publicKey?.toBase58();
    });
    if (f.length === 0) {
      return null;
    }
    return f[0];
  }, [wallet, whitelist]);

  const isWhitelistUser = useMemo(() => {
    return whitelistClaim !== null
  }, [whitelistClaim]);

  const willBecomeWhitelistUser = useMemo(() => {
    if (props.whitelistAppend) {
      const f = props.whitelistAppend.list.filter((handle) => {
        return handle.handle === wallet.publicKey?.toBase58();
      });
      return f.length > 0;
    }
    return false;
  }, [wallet, props.whitelistAppend]);

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
    async (commitment: Commitment = "confirmed") => {
      if (!anchorWallet) {
        return;
      }
      if (props.error !== undefined) {
        setAlertState({
          open: true,
          message: props.error,
          severity: "error",
          hideDuration: null,
        });
        return;
      }

      const connection = new Connection(props.rpcHost, commitment);

      if (props.candyMachineId) {
        const candyMachineId = getCandyMachineId(props.candyMachineId);
        try {
          const cndy = await getCandyMachineState(
            anchorWallet,
            candyMachineId,
            connection
          );
          console.log("Candy machine state: ", cndy);

          let active = cndy?.state.goLiveDate
            ? cndy?.state.goLiveDate.toNumber() < new Date().getTime() / 1000
            : false;
          let presale = false;

          setItemsAvailable(cndy.state.itemsAvailable);

          if (cndy.state.goLiveDate) {
            const d = new Date(cndy.state.goLiveDate.toNumber() * 1000);
            const months = [
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ];
            let append = "";
            if (d.getDate() === 1) {
              append = "st";
            } else if (d.getDate() === 2) {
              append = "nd";
            } else if (d.getDate() === 3) {
              append = "rd";
            } else {
              append = "th";
            }

            setStartDate(d.getDate() + append + " " + months[d.getMonth()]);
          } else {
            setStartDate("");
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
            const token = (
              await getAtaForMint(mint, anchorWallet.publicKey)
            )[0];

            active = isWLUser && (presale || active);
            try {
              const balance = await connection.getTokenAccountBalance(token);
              const claimedToken = parseInt(balance.value.amount) >= 0;
              setMintsLeft(Math.min(parseInt(balance.value.amount), cndy.state.itemsRemaining));

              if (cndy.state.isWhitelistOnly) {
                active = parseInt(balance.value.amount) > 0 && active;
              }
            } catch (e) {
              setMintsLeft(whitelistClaim?.amount || 0);
              console.log(
                "There was a problem fetching whitelist token balance"
              );
              console.log(e);
            }

          }
          setUseWhitelist(useWhitelist);
          userPrice = isWLUser ? userPrice : cndy.state.price;

          if (cndy?.state.tokenMint) {
            // retrieves the SPL token
            const mint = new anchor.web3.PublicKey(cndy.state.tokenMint);
            const token = (
              await getAtaForMint(mint, anchorWallet.publicKey)
            )[0];
            try {
              const balance = await connection.getTokenAccountBalance(token);

              const valid = new anchor.BN(balance.value.amount).gte(userPrice);

              // only allow user to mint if token balance >  the user if the balance > 0
              setIsValidBalance(valid);
              active = active && valid;
            } catch (e) {
              setIsValidBalance(false);
              active = false;
              // no whitelist user, no mint
              console.log("There was a problem fetching SPL token balance");
              console.log(e);
            }
          } else {
            const balance = new anchor.BN(
              await connection.getBalance(anchorWallet.publicKey)
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
          const collectionPDAAccount = await connection.getAccountInfo(
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
            if (
              e.message === `Account does not exist ${props.candyMachineId}`
            ) {
              setAlertState({
                open: true,
                message: `Couldn't fetch candy machine state from candy machine with address: ${props.candyMachineId}, using rpc: ${props.rpcHost}! You probably typed the REACT_APP_CANDY_MACHINE_ID value in wrong in your .env file, or you are using the wrong RPC!`,
                severity: "error",
                hideDuration: null,
              });
            } else if (
              e.message.startsWith("failed to get info about account")
            ) {
              setAlertState({
                open: true,
                message: `Couldn't fetch candy machine state with rpc: ${props.rpcHost}! This probably means you have an issue with the REACT_APP_SOLANA_RPC_HOST value in your .env file, or you are not using a custom RPC!`,
                severity: "error",
                hideDuration: null,
              });
            }
          } else {
            setAlertState({
              open: true,
              message: `${e}`,
              severity: "error",
              hideDuration: null,
            });
          }
          console.log(e);
        }
      } else {
        setAlertState({
          open: true,
          message: `Your REACT_APP_CANDY_MACHINE_ID value in the .env file doesn't look right! Make sure you enter it in as plain base-58 address!`,
          severity: "error",
          hideDuration: null,
        });
      }
    },
    [
      anchorWallet,
      props.candyMachineId,
      props.error,
      props.rpcHost,
      isWhitelistUser,
    ]
  );

  const onMint = async (
    beforeTransactions: Transaction[] = [],
    afterTransactions: Transaction[] = []
  ) => {
    try {
      setIsUserMinting(true);

      if (useWhitelist && whitelistClaim) {
        let url = whitelistClaim.url;
        url = url.substring("https://gumdrop.metaplex.com//claim?".length);
        const values = url.split("&");
        const obj: { [key: string]: any } = {};
        values.forEach((v) => {
          const [key, value] = v.split("=");
          obj[key] = value;
        });
        const claim = {
          amountStr: obj.amount,
          distributor: obj.distributor,
          handle: obj.handle,
          candyMachine: props.candyMachineId,
          indexStr: obj.index,
          proofStr: obj.proof,
          claimMethod: "candy",
          tokenAcc: obj.tokenAcc,
        }
        await Gumdrop.onMint(props.connection, anchorWallet!, claim, setAlertState);
      } else  if (!useWhitelist && wallet.connected && candyMachine?.program && wallet.publicKey) {
        let setupMint: SetupState | undefined;
        if (needTxnSplit && setupTxn === undefined) {
          setAlertState({
            open: true,
            message: "Please sign account setup transaction",
            severity: "info",
          });
          setupMint = await createAccountsForMint(
            candyMachine,
            wallet.publicKey
          );
          let status: any = { err: true };
          if (setupMint.transaction) {
            status = await awaitTransactionSignatureConfirmation(
              setupMint.transaction,
              props.txTimeout,
              props.connection,
              true
            );
          }
          if (status && !status.err) {
            setSetupTxn(setupMint);
            setAlertState({
              open: true,
              message:
                "Setup transaction succeeded! Please sign minting transaction",
              severity: "info",
            });
          } else {
            setAlertState({
              open: true,
              message: "Mint failed! Please try again!",
              severity: "error",
            });
            setIsUserMinting(false);
            return;
          }
        } else {
          setAlertState({
            open: true,
            message: "Please sign minting transaction",
            severity: "info",
          });
        }

        const mintResult = await mintOneToken(
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
            props.txTimeout,
            props.connection,
            true
          );

          metadataStatus =
            await candyMachine.program.provider.connection.getAccountInfo(
              mintResult.metadataKey,
              "processed"
            );
          console.log("Metadata status: ", !!metadataStatus);
        }

        if (status && !status.err && metadataStatus) {
          // manual update since the refresh might not detect
          // the change immediately
          const remaining = itemsRemaining! - 1;
          setItemsRemaining(remaining);
          setIsActive((candyMachine.state.isActive = remaining > 0));
          candyMachine.state.isSoldOut = remaining === 0;
          setSetupTxn(undefined);
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
            hideDuration: 7000,
          });
          refreshCandyMachineState("processed");
        } else if (status && !status.err) {
          setAlertState({
            open: true,
            message:
              "Mint likely failed! Anti-bot SOL 0.01 fee potentially charged! Check the explorer to confirm the mint failed and if so, make sure you are eligible to mint before trying again.",
            severity: "error",
            hideDuration: 8000,
          });
          refreshCandyMachineState();
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
          refreshCandyMachineState();
        }
      }
    } catch (error: any) {
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (!error.message) {
          message = "Transaction timeout! Please try again.";
        } else if (error.message === "Failed to sign transaction") {
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

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
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
    props.connection,
    refreshCandyMachineState,
  ]);

  useEffect(() => {
    (function loop() {
      setTimeout(() => {
        refreshCandyMachineState();
        loop();
      }, 30000);
    })();
  }, [refreshCandyMachineState]);

  return (
    <>
      {!wallet.connected ? (
        <Grid container direction="row" justifyContent="center" wrap="nowrap">
          <Wallet />
        </Grid>
      ) : (
        <>
          {candyMachine && (
            <>
              <Container maxWidth="xs" style={{ position: "relative" }}>
                <Paper
                  style={{
                    padding: 25,
                    backgroundColor: "#151A1F",
                    borderRadius: 6,
                    marginTop: "10px",
                  }}
                >
                  <Grid
                    item
                    xs={12}
                    md={12}
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <Grid>
                      <Typography variant="body2" align="left">
                        {startDate}
                      </Typography>
                      <Typography
                        variant="h6"
                        align="left"
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                          marginTop: "5px",
                          marginBottom: "5px",
                        }}
                      >
                        {props.who}
                      </Typography>
                      <Typography variant="body2" align="left">
                        {candyMachine.state.goLiveDate &&
                          new Date(Date.now()) >
                          toDate(candyMachine.state.goLiveDate)! &&
                          (!endDate ||
                          Date.now() < endDate.getTime()) && <>{
                            itemsAvailable
                          } Supply
                          </>}
                        {candyMachine.state.goLiveDate &&
                          new Date(Date.now()) <
                          toDate(candyMachine.state.goLiveDate)! && (
                            <MintCountdown
                            key="goLive"
                            date={getCountdownDate(candyMachine)}
                            style={{ justifyContent: "flex-end" }}
                            status={
                              candyMachine?.state?.isSoldOut ||
                              (endDate && Date.now() > endDate.getTime())
                                ? "COMPLETED"
                                : isPresale
                                ? "PRESALE"
                                : "LIVE"
                            }
                            onComplete={toggleMintButton}
                            />
                          )}
                        {(candyMachine?.state?.isSoldOut || (endDate && Date.now() > endDate.getTime())) && (
                          <>Finsihed!</>
                        )}
                      </Typography>
                    </Grid>
                    <Grid>
                      {candyMachine.state.goLiveDate &&
                        new Date(Date.now()) >
                        toDate(candyMachine.state.goLiveDate)! &&
                        (!endDate ||
                        Date.now() < endDate.getTime()) && (
                          <>
                            <ListItem
                              style={{
                                display: "item",
                                textAlign: "right",
                                padding: 0,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  width: "100%",
                                }}
                              >
                                <div style={{ position: "absolute" }}>
                                  <div
                                    style={{
                                      position: "relative",
                                      right: "40px",
                                      bottom: "5px",
                                      fontSize: "3em",
                                      color: "#00B332",
                                    }}
                                  >
                                    &bull;
                                  </div>
                                </div>
                                <span
                                  style={{
                                    height: "20px",
                                    alignSelf: "center",
                                  }}
                                >
                                  Live
                                </span>
                              </div>
                            </ListItem>
                          </>
                        )}
                      {candyMachine.state.goLiveDate &&
                        new Date(Date.now()) <
                        toDate(candyMachine.state.goLiveDate)! && (
                          <>
                            <ListItem
                              style={{
                                display: "item",
                                textAlign: "right",
                                padding: 0,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  width: "100%",
                                }}
                              >
                                <div style={{ position: "absolute" }}>
                                  <div
                                    style={{
                                      position: "relative",
                                      right: "50px",
                                      bottom: "5px",
                                      fontSize: "3em",
                                      color: "white",
                                    }}
                                  >
                                    &bull;
                                  </div>
                                </div>
                                <span
                                  style={{
                                    height: "20px",
                                    alignSelf: "center",
                                  }}
                                >
                                  Soon
                                </span>
                              </div>
                            </ListItem>
                          </>
                        )}
                      {(candyMachine?.state?.isSoldOut || (endDate && Date.now() > endDate.getTime())) && (
                        <>
                          <ListItem
                            style={{
                              display: "item",
                              textAlign: "right",
                              padding: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                width: "100%",
                              }}
                            >
                              <div style={{ position: "absolute" }}>
                                <div
                                  style={{
                                    position: "relative",
                                    right: "93px",
                                    bottom: "5px",
                                    fontSize: "3em",
                                    color: "white",
                                  }}
                                >
                                  &bull;
                                </div>
                              </div>
                              <span
                                style={{ height: "20px", alignSelf: "center" }}
                              >
                                Completed
                              </span>
                            </div>
                          </ListItem>
                        </>
                      )}
                      <Typography
                        variant="h6"
                        align="right"
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                          marginTop: "5px",
                          marginBottom: "5px",
                        }}
                      >
                        {isWhitelistUser && discountPrice
                          ? ` ${formatNumber.asNumber(discountPrice)} sol`
                          : ` ${formatNumber.asNumber(
                            candyMachine.state.price
                          )} sol`}
                      </Typography>
                      <Typography variant="body2" align="right">
                        {`${(100 - (itemsRemaining! / itemsAvailable! * 100)).toFixed(0)} % minted`}
                      </Typography>
                    </Grid>
                  </Grid>
                  {isActive && (
                    <MintContainer>
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isUserMinting}
                        setIsMinting={(val) => setIsUserMinting(val)}
                        onMint={onMint}
                        isActive={
                          isActive ||
                          (isPresale && isWhitelistUser && isValidBalance)
                        }
                      />
                    </MintContainer>
                  )}
                  {useWhitelist && endDate && Date.now() < endDate.getTime() && (
                    <>
                      {isWhitelistUser && <div style={{ fontSize: "0.7em", marginTop: "15px", color: "gray" }}>You are on the whitelist! {mintsLeft > 0 ? <>You can still mint up to {mintsLeft} token.</> : <>You cannot mint any token anymore.</>}</div>}
                      {!isWhitelistUser && willBecomeWhitelistUser && <div style={{ fontSize: "0.7em", marginTop: "15px", color: "gray" }}>You are on the secondary whitelist and can mint soon!</div>}
                      {!isWhitelistUser && !willBecomeWhitelistUser && <div style={{ fontSize: "0.7em", marginTop: "15px", color: "gray" }}>You are not on the whitelist!</div>}
                    </>
                  )}
                </Paper>
              </Container>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Machine;

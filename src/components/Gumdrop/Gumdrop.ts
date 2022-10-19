import { AccountMeta, Connection, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from 'bn.js';
import { CANDY_MACHINE_ID, GUMDROP_DISTRIBUTOR_ID, GUMDROP_TEMPORAL_SIGNER, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../ids';
import * as anchor from '@project-serum/anchor';
import { MerkleTree } from "../merkleTree";
import { MintLayout, Token } from "@solana/spl-token";
import * as bs58 from 'bs58';
import { sendSignedTransaction } from "../connection";
import { Dispatch, SetStateAction } from "react";
import { AlertState } from "../utils";

interface Claim {
    handle: string;
    candyMachine: string;
    distributor: string;
    amountStr: string;
    indexStr: string;
    proofStr: string;
    claimMethod: string;
    tokenAcc: string;
}

interface ProgramAddress {
    gumdrop: anchor.Program;
    candyMachine: anchor.Program
}

type ClaimInstructions = {
    setup: Array<TransactionInstruction> | null;
    claim: Array<TransactionInstruction>;
};
type ClaimTransactions = {
    setup: Transaction | null;
    claim: Transaction;
};

const fetchDistributor = async (
    program: anchor.Program,
    distributorStr: string,
) => {
    let key;
    try {
        key = new PublicKey(distributorStr);
    } catch (err) {
        throw new Error(`Invalid distributor key ${err}`);
    }
    const info = await program.account.merkleDistributor.fetch(key);
    return [key, info];
};

const getCandyMachine = async (
    connection: Connection,
    candyMachineKey: PublicKey,
) => {
    const candyMachineCoder = await fetchCoder(CANDY_MACHINE_ID, connection);
    if (candyMachineCoder === null) {
        throw new Error(`Could not fetch candy machine IDL`);
    }
    const candyMachineAccount = await connection.getAccountInfo(candyMachineKey);
    if (candyMachineAccount === null) {
        throw new Error(`Could not fetch candy machine`);
    }
    return candyMachineCoder.accounts.decode(
        'CandyMachine',
        candyMachineAccount.data,
    );
};

const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

const getEdition = async (mint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from('edition'),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

const fetchCoder = async (
    address: anchor.Address,
    connection: Connection,
): Promise<anchor.Coder | null> => {
    const idl = await anchor.Program.fetchIdl(address, {
        connection: connection,
    } as anchor.Provider);
    if (!idl) return null;
    return new anchor.Coder(idl);
};

const chunk = (arr: Buffer, len: number): Array<Buffer> => {
    const chunks: Array<Buffer> = [];
    const n = arr.length;
    let i = 0;

    while (i < n) {
        chunks.push(arr.slice(i, (i += len)));
    }

    return chunks;
};

const walletKeyOrPda = async (
    walletKey: PublicKey,
    handle: string,
    pin: BN | null,
    seed: PublicKey,
): Promise<[PublicKey, Array<Buffer>]> => {
    if (pin === null) {
        try {
            const key = new PublicKey(handle);
            if (!key.equals(walletKey)) {
                throw new Error(
                    'Claimant wallet handle does not match connected wallet',
                );
            }
            return [key, []];
        } catch (err) {
            throw new Error(`Invalid claimant wallet handle ${err}`);
        }
    } else {
        const seeds = [
            seed.toBuffer(),
            Buffer.from(handle),
            Buffer.from(pin.toArray('le', 4)),
        ];

        const [claimantPda] = await PublicKey.findProgramAddress(
            [seeds[0], ...chunk(seeds[1], 32), seeds[2]],
            GUMDROP_DISTRIBUTOR_ID,
        );
        return [claimantPda, seeds];
    }
};

const getATA = (
    walletKey: PublicKey,
    mintKey: PublicKey,
): Promise<PublicKey> => {
    return Token.getAssociatedTokenAddress(
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintKey,
        walletKey,
        true, // allowOwnerOffCurve aka PDA
    );
};

const createMintAndAccount = async (
    connection: Connection,
    walletKey: PublicKey,
    mint: PublicKey,
    setup: Array<TransactionInstruction>,
) => {
    const walletTokenKey = await getATA(walletKey, mint);

    setup.push(
        SystemProgram.createAccount({
            fromPubkey: walletKey,
            newAccountPubkey: mint,
            space: MintLayout.span,
            lamports: await connection.getMinimumBalanceForRentExemption(
                MintLayout.span,
            ),
            programId: TOKEN_PROGRAM_ID,
        }),
    );

    setup.push(
        Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mint,
            0,
            walletKey,
            walletKey,
        ),
    );

    setup.push(
        Token.createAssociatedTokenAccountInstruction(
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            walletTokenKey,
            walletKey,
            walletKey,
        ),
    );

    setup.push(
        Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint,
            walletTokenKey,
            walletKey,
            [],
            1,
        ),
    );
};

const buildCandyClaim = async (
    program: anchor.Program,
    candyProgram: anchor.Program,
    walletKey: PublicKey,
    distributorKey: PublicKey,
    distributorInfo: any,
    tokenAcc: string,
    candyMachineStr: string,
    proof: Array<Buffer>,
    handle: string,
    amount: number,
    index: number,
    pin: BN | null,
): Promise<[ClaimInstructions, Array<Buffer>, Array<Keypair>]> => {
    let tokenAccKey: PublicKey;
    try {
        tokenAccKey = new PublicKey(tokenAcc);
    } catch (err) {
        throw new Error(`Invalid tokenAcc key ${err}`);
    }

    let candyMachineKey: PublicKey;
    try {
        candyMachineKey = new PublicKey(candyMachineStr);
    } catch (err) {
        throw new Error(`Invalid candy machine key ${err}`);
    }

    const connection = program.provider.connection;
    const candyMachine = await getCandyMachine(connection, candyMachineKey);
    console.log('Candy Machine', candyMachine);

    if (!candyMachine.data.whitelistMintSettings) {
        // soft error?
        throw new Error(
            `Candy machine doesn't seem to have a whitelist mint. You can mint normally!`,
        );
    }
    const whitelistMint = candyMachine.data.whitelistMintSettings.mint;

    const [secret, pdaSeeds] = await walletKeyOrPda(
        walletKey,
        handle,
        pin,
        whitelistMint,
    );

    // TODO: since it's in the PDA do we need it to be in the leaf?
    const leaf = Buffer.from([
        ...new BN(index).toArray('le', 8),
        ...secret.toBuffer(),
        ...whitelistMint.toBuffer(),
        ...new BN(amount).toArray('le', 8),
    ]);

    const matches = MerkleTree.verifyClaim(
        leaf,
        proof,
        Buffer.from(distributorInfo.root),
    );

    if (!matches) {
        throw new Error('Gumdrop merkle proof does not match');
    }

    const [claimStatus, cbump] = await PublicKey.findProgramAddress(
        [
            Buffer.from('ClaimStatus'),
            Buffer.from(new BN(index).toArray('le', 8)),
            distributorKey.toBuffer(),
        ],
        GUMDROP_DISTRIBUTOR_ID,
    );

    // candy machine mints fit in a single transaction
    const merkleClaim: Array<TransactionInstruction> = [];

    if ((await connection.getAccountInfo(claimStatus)) === null) {
        // atm the contract has a special case for when the temporal key is defaulted
        // (aka always passes temporal check)
        // TODO: more flexible
        const temporalSigner =
            distributorInfo.temporal.equals(PublicKey.default) ||
                secret.equals(walletKey)
                ? walletKey
                : distributorInfo.temporal;

        const walletTokenKey = await getATA(walletKey, whitelistMint);
        if ((await connection.getAccountInfo(walletTokenKey)) === null) {
            merkleClaim.push(
                Token.createAssociatedTokenAccountInstruction(
                    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    candyMachine.data.whitelistMintSettings.mint,
                    walletTokenKey,
                    walletKey,
                    walletKey,
                ),
            );
        }

        merkleClaim.push(
            await program.instruction.claim(
                cbump,
                new BN(index),
                new BN(amount),
                secret,
                proof,
                {
                    accounts: {
                        distributor: distributorKey,
                        claimStatus,
                        from: tokenAccKey,
                        to: walletTokenKey,
                        temporal: temporalSigner,
                        payer: walletKey,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                },
            ),
        );
    }

    const candyMachineMint = Keypair.generate();
    const candyMachineMetadata = await getMetadata(candyMachineMint.publicKey);
    const candyMachineMaster = await getEdition(candyMachineMint.publicKey);

    const [candyMachineCreatorKey, candyMachineCreatorBump] =
        await PublicKey.findProgramAddress(
            [Buffer.from('candy_machine'), candyMachineKey.toBuffer()],
            CANDY_MACHINE_ID,
        );

    const remainingAccounts: Array<AccountMeta> = [];

    if (candyMachine.data.whitelistMintSettings) {
        const whitelistATA = await getATA(walletKey, whitelistMint);
        remainingAccounts.push({
            pubkey: whitelistATA,
            isWritable: true,
            isSigner: false,
        });

        if (candyMachine.data.whitelistMintSettings.mode.burnEveryTime) {
            remainingAccounts.push({
                pubkey: whitelistMint,
                isWritable: true,
                isSigner: false,
            });
            remainingAccounts.push({
                pubkey: walletKey,
                isWritable: false,
                isSigner: true,
            });
        }
    }

    if (candyMachine.tokenMint) {
        const tokenMintATA = await getATA(walletKey, candyMachine.tokenMint);

        remainingAccounts.push({
            pubkey: tokenMintATA,
            isWritable: true,
            isSigner: false,
        });
        remainingAccounts.push({
            pubkey: walletKey,
            isWritable: false,
            isSigner: true,
        });
    }

    const candyMachineClaim: Array<TransactionInstruction> = [];
    await createMintAndAccount(
        connection,
        walletKey,
        candyMachineMint.publicKey,
        candyMachineClaim,
    );
    candyMachineClaim.push(
        await candyProgram.instruction.mintNft(candyMachineCreatorBump, {
            accounts: {
                candyMachine: candyMachineKey,
                candyMachineCreator: candyMachineCreatorKey,
                payer: walletKey,
                wallet: candyMachine.wallet,
                metadata: candyMachineMetadata,
                mint: candyMachineMint.publicKey,
                mintAuthority: walletKey,
                updateAuthority: walletKey,
                masterEdition: candyMachineMaster,

                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
                clock: SYSVAR_CLOCK_PUBKEY,
                recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            remainingAccounts,
        }),
    );

    return [
        { setup: merkleClaim, claim: candyMachineClaim },
        pdaSeeds,
        [candyMachineMint],
    ];
};

const createTransaction = async (connection: Connection, wallet: anchor.Wallet, program: ProgramAddress, claim: Claim) => {
    if (!wallet || !program) {
        throw new Error(`Wallet not connected`);
    }

    const index = Number(claim.indexStr);
    const amount = Number(claim.amountStr);
    const pin: BN | null = null;

    if (isNaN(amount)) {
        throw new Error(`Could not parse amount ${claim.amountStr}`);
    }
    if (isNaN(index)) {
        throw new Error(`Could not parse index ${claim.indexStr}`);
    }

    // TODO: use cached?
    const [distributorKey, distributorInfo] = await fetchDistributor(
        program.gumdrop,
        claim.distributor,
    );

    console.log('Distributor', distributorInfo);

    const proof =
        claim.proofStr === ''
            ? []
            : claim.proofStr.split(',').map(b => {
                const ret = Buffer.from(bs58.decode(b));
                if (ret.length !== 32) throw new Error(`Invalid proof hash length`);
                return ret;
            });

    let extraSigners: Array<Keypair>;
    let instructions, pdaSeeds;
    if (claim.claimMethod === 'candy') {
        console.log('Building candy claim');
        [instructions, pdaSeeds, extraSigners] = await buildCandyClaim(
            program.gumdrop,
            program.candyMachine,
            wallet.publicKey,
            distributorKey,
            distributorInfo,
            claim.tokenAcc,
            claim.candyMachine,
            proof,
            claim.handle,
            amount,
            index,
            pin,
        );
    } else {
        throw new Error(`Unknown claim method ${claim.claimMethod}`);
    }

    // NB: if we're claiming through wallets then pdaSeeds should be empty
    // since the secret is the wallet key (which is also a signer)
    if (pin === null && pdaSeeds.length > 0) {
        throw new Error(
            `Internal error: PDA generated when distributing to wallet directly`,
        );
    }

    const signersOf = (instrs: Array<TransactionInstruction>) => {
        const signers = new Set<PublicKey>();
        for (const instr of instrs) {
            for (const key of instr.keys) if (key.isSigner) signers.add(key.pubkey);
        }
        return [...signers];
    };

    const partialSignExtra = (tx: Transaction, expected: Array<PublicKey>) => {
        const matching = extraSigners.filter(kp =>
            expected.find(p => p.equals(kp.publicKey)),
        );
        if (matching.length > 0) {
            tx.partialSign(...matching);
        }
    };

    const recentBlockhash = (
        await connection.getRecentBlockhash('singleGossip')
    ).blockhash;
    let setupTx: Transaction | null = null;
    if (instructions.setup !== null && instructions.setup.length !== 0) {
        setupTx = new Transaction({
            feePayer: wallet.publicKey,
            recentBlockhash,
        });

        const setupInstrs = instructions.setup;
        const setupSigners = signersOf(setupInstrs);
        console.log(
            `Expecting the following setup signers: ${setupSigners.map(s =>
                s.toBase58(),
            )}`,
        );
        setupTx.add(...setupInstrs);
        setupTx.setSigners(...setupSigners);
        partialSignExtra(setupTx, setupSigners);
    }

    const claimTx = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash,
    });

    const claimInstrs = instructions.claim;
    const claimSigners = signersOf(claimInstrs);
    console.log(
        `Expecting the following claim signers: ${claimSigners.map(s =>
            s.toBase58(),
        )}`,
    );
    claimTx.add(...claimInstrs);
    claimTx.setSigners(...claimSigners);
    partialSignExtra(claimTx, claimSigners);

    return {
        setup: setupTx,
        claim: claimTx,
    };
};

const sendTransaction = async (connection: Connection, wallet: anchor.Wallet, program: ProgramAddress, claim: Claim,
    transaction: ClaimTransactions | null, setAlertState: Dispatch<SetStateAction<AlertState>>
) => {
    if (!transaction) {
        throw new Error(`Transaction not available for OTP verification`);
    }

    if (!wallet || !program) {
        throw new Error(`Wallet not connected`);
    }

    let fullySigned;
    try {
        fullySigned = await wallet.signAllTransactions(
            transaction.setup === null
                ? [transaction.claim]
                : [transaction.setup, transaction.claim],
        );
    } catch {
        throw new Error('Failed to sign transaction');
    }

    for (let idx = 0; idx < fullySigned.length; ++idx) {
        const tx = fullySigned[idx];
        const result = await sendSignedTransaction({
            connection,
            signedTransaction: tx,
        });
        console.log(result);
        setAlertState(
            {
                open: true,
                message: `Minting succeeded: ${idx + 1} of ${fullySigned.length}`,
                severity: "success",
              }
        );
    }
  };

const onMint = async (connection: Connection, wallet: anchor.Wallet, claim: Claim, setAlertState: Dispatch<SetStateAction<AlertState>>) => {
    const provider = new anchor.Provider(connection, wallet, {
        preflightCommitment: 'recent',
    });
    const [gumdropIdl, candyIdl] = await Promise.all([
        anchor.Program.fetchIdl(GUMDROP_DISTRIBUTOR_ID, provider),
        anchor.Program.fetchIdl(CANDY_MACHINE_ID, provider),
    ]);
    const claimMethod = 'candy';
    if (!gumdropIdl) throw new Error('Failed to fetch gumdrop IDL');
    if (!candyIdl) throw new Error('Failed to fetch candy machine IDL');

    const program = {
        gumdrop: new anchor.Program(
            gumdropIdl,
            GUMDROP_DISTRIBUTOR_ID,
            provider,
        ),
        candyMachine: new anchor.Program(
            candyIdl,
            CANDY_MACHINE_ID,
            provider,
        ),
    };

    const transaction = await createTransaction(connection, wallet, program, claim);
    await sendTransaction(connection, wallet, program, claim, transaction, setAlertState);
}

const Gumdrop = {onMint}

export default Gumdrop;
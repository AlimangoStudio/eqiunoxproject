import { Button } from '@windmill/react-ui'
import React, { useCallback, useEffect, useState } from 'react'
import Bluebird from 'bluebird'
import { providers, utils } from "near-api-js";
import { BrowserRouter as Router, Switch, Route, useHistory } from 'react-router-dom'
import type {
	AccountView,
	CodeResult,
} from "near-api-js/lib/providers/provider";
import CollectionCard from '../../components/Cards/CollectionCard'
import PageTitle from '../../components/Typography/PageTitle'
import { useWalletSelector, WalletSelectorContextProvider } from '../../context/WalletSelectorContext'
import CollectionDetail from './CollectionDetail'
import ItemDetail from './ItemDetail'
import { MARKET_CONTRACT_ID, NFT_CONTRACT_IDS } from '../../constants/address';
import { NftMetadata } from '../../constants/types';

export type Account = AccountView & {
	account_id: string;
};

const MarketContent: React.FC = () => {

	
	const { selector, modal, accounts, accountId } = useWalletSelector();

	const [account, setAccount] = useState<Account | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [collections, setCollections] = useState<NftMetadata[]>([])

	const history = useHistory()

	const getAccount = useCallback(async (): Promise<Account | null> => {
		if (!accountId) {
			return null;
		}

		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<AccountView>({
				request_type: "view_account",
				finality: "final",
				account_id: accountId,
			})
			.then((data) => ({
				...data,
				account_id: accountId,
			}));
	}, [accountId, selector.options]);

	const showModal = () => {
		modal.show()
	}

	const handleSignOut = async () => {
		const wallet = await selector.wallet();

		wallet.signOut().catch((err) => {
			console.log("Failed to sign out");
			console.error(err);
		});
	};

	// Define Call back functions
	const getCollectionMetadata = useCallback((nft_contract_id) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
	
		return provider
		  .query<CodeResult>({
			request_type: "call_function",
			account_id: nft_contract_id,
			method_name: "nft_metadata",
			args_base64: "",
			finality: "optimistic",
		  })
		  .then((res) => ({ ...JSON.parse(Buffer.from(res.result).toString()), owner_id: nft_contract_id }));
	}, [selector]);

	// UseEffect after loading Wallets
	useEffect(() => {
		if (!accountId) {
			return setAccount(null);
		}

		setLoading(true);

		getAccount().then((nextAccount) => {
			setAccount(nextAccount);
			setLoading(false);
		});

	}, [accountId, getAccount]);

	
	useEffect( () => {
		// Get CollectionMetadatas 
		const getCollectionMetadatas = async () => {
			const collections = await Bluebird.map(NFT_CONTRACT_IDS , (id: string) => getCollectionMetadata(id))
			setCollections(collections)
		}
		getCollectionMetadatas()
		console.log('--- history', history)
	}, [])

	return (
		<div>
			<div className='flex justify-between items-center py-8'>
				<PageTitle>{ history.location.pathname.split('/').length > 3 && <span onClick={() => history.push('/app/market')} className='text-sm cursor-pointer'>{`<< Collection`}</span>}{ accountId && ` Welcome ${accountId}`}</PageTitle>
				<Button className='' onClick={account? handleSignOut : showModal}>{
					!account? <span>Connect Wallet</span> : <span>Disconnect Wallet</span>
				}</Button>
			</div>
			
					<Route exact path="/app/market/:id/:itemId" component={ItemDetail} />
					<Route exact path="/app/market/:id" component={CollectionDetail} />
					<Route exact path='/app/market/' render={() =>
						<div className=''>
							<div className="dark:text-white-300">
								<PageTitle >Explore collections</PageTitle>
							</div>

							<div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
								{
									collections.map(collection => 
										<div>
											<CollectionCard title={collection.name} ownerId={collection.owner_id} price="666" supply="356" maxSupply="10000" imageUri={collection.icon} ></CollectionCard>
										</div> )
								}
								
								<CollectionCard title="EvilDegen" ownerId="Evil Degen NFT" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
								<CollectionCard title="EvilDegen" ownerId="Evil Degen NFT" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
								<CollectionCard title="EvilDegen" ownerId="Evil Degen NFT" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
							</div>
						</div>
					} />
				
		</div>
	)
}

const Market = () => <WalletSelectorContextProvider><MarketContent /></WalletSelectorContextProvider>
export default Market

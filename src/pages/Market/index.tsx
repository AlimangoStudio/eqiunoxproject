import { Button, Input } from '@windmill/react-ui'
import React, { useCallback, useEffect, useState } from 'react'
import Bluebird from 'bluebird'
import { providers, utils } from "near-api-js";
import axios from 'axios'
import { Route, useHistory } from 'react-router-dom'
import type {
	AccountView,
	CodeResult,
} from "near-api-js/lib/providers/provider";
import CollectionCard from '../../components/Cards/CollectionCard'
import PageTitle from '../../components/Typography/PageTitle'
import { useWalletSelector, WalletSelectorContextProvider } from '../../context/WalletSelectorContext'
import CollectionDetail from './CollectionDetail'
import ItemDetail from './ItemDetail'
// import { MARKET_CONTRACT_ID, NFT_CONTRACT_IDS } from '../../constants/address';
import { NftMetadata, ParasCollectionMetadata, ParasCollectionStat } from '../../constants/types';

export type Account = AccountView & {
	account_id: string;
};

const MarketContent: React.FC = () => {

	
	const { selector, modal, accountId } = useWalletSelector();

	const [account, setAccount] = useState<Account | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [collections, setCollections] = useState<NftMetadata[]>([])
	const [listingAddress, setListingAddress] = useState<String>("")
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
		  .then((res) => ({ ...JSON.parse(Buffer.from(res.result).toString()), owner_id: nft_contract_id }))
		  .catch(err => {
			console.log(err)
			return 
		  });
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
			setLoading(true)

			// Get NFT Contract Ids
			let res_ = await axios.get('https://equinoxlabs.space/api/paras/addresses')
			let NFT_CONTRACT_IDS =  res_.data
			// Get NFT Metadata
			let nCollections: NftMetadata[]
			let collections =  await Bluebird.map(NFT_CONTRACT_IDS , (id: string) => getCollectionMetadata(id)) as NftMetadata[]
			collections = collections.filter(collection => collection !== undefined)
			nCollections = collections.map(collection => {
				collection.floor_price = "1700000000000000000000000"
				collection.total_card_sale = 2
				collection.total_card_not_sale = 5
				collection.id = collection.owner_id
				return collection

			})
				
			setCollections([...nCollections])
			let res = await axios.get('https://equinoxlabs.space/api/paras', { params: {}})
			let parasCollections = await Bluebird.map(res.data.data.results, async (collection: ParasCollectionMetadata) => {
				let response = await axios.get("https://equinoxlabs.space/api/paras/stat", {params: {collection_id: collection.collection_id}})
				let stat: ParasCollectionStat = response.data.data.results
				let icon = collection.media? collection.media: collection.previews? collection.previews[0]: collection.cover
				let result: NftMetadata = {
					id: collection.collection_id,
					name: collection.collection,
					symbol: collection.collection,
					owner_id: collection.creator_id,
					icon: icon? "https://".concat(icon.concat('.ipfs.dweb.link')) : "",
					floor_price: stat.floor_price,
					total_card_not_sale: stat.total_card_not_sale,
					total_card_sale: stat.total_card_sale,
					spec: collection.description && collection.description,
					is_paras: true,
					total_owners: stat.total_owners
				} 
				return result
			})
			setCollections([...nCollections, ...parasCollections])
			setLoading(false)
			
			
		}
		getCollectionMetadatas()


	}, [])

	const onChangeAddress = (e: any) => {
		setListingAddress(e.target.value)
	}

	const onList = async () => {
		if (listingAddress == "") {
			return
		}
		await axios.post('/api/paras/add', {address: listingAddress})
		setListingAddress("")
		window.location.reload()

	}

	return (
		<div>
			
			<div className='flex justify-between items-center py-8'>
				<h1 className='text-xl'>{ history.location.pathname.split('/').length > 3 && <span onClick={() => history.push('/app/market')} className='text-sm cursor-pointer'>{`<< Collection`}</span>}{ accountId && ` Welcome ${accountId}`}</h1>
				<PageTitle>NEAR NFT</PageTitle>
				<Button className='' onClick={accountId? handleSignOut : showModal}>{
					!accountId? <span>Connect Wallet</span> : <span>Disconnect Wallet</span>
				}</Button>
			</div>
			
					<Route exact path="/app/market/:id/:itemId" component={ItemDetail} />
					<Route exact path="/app/market/:id" component={CollectionDetail} />
					<Route exact path='/app/market/' render={() =>
						<div className=''>
							<div className="dark:text-white-300">
								<PageTitle >List collections</PageTitle>
								
							</div>
							<div className='flex justify-between w-96'>
								<Input onChange={onChangeAddress} css="" className="mt-1 mr-4" placeholder="xxx.near" />
								<Button onClick={onList} className='w-24'>List</Button>
							</div>
							<div className="dark:text-white-300">
								<PageTitle >Explore collections</PageTitle>
							</div>

							<div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
								{
									loading && <div>Loading...</div>
								}
								{
									collections.map(collection => 
										<div key={collection.name}>
											<CollectionCard isParas={collection.is_paras} id={collection.id} title={collection.name} ownerId={collection.owner_id} price={ collection.floor_price ? utils.format.formatNearAmount(collection.floor_price) : "0"} supply={ collection.total_card_sale.toString()} maxSupply={ ( collection.total_card_sale + collection.total_card_not_sale).toString() } imageUri={collection.icon} ></CollectionCard>
										</div> )
								}
								
							</div>
						</div>
					} />
				
		</div>
	)
}

const Market = () => <WalletSelectorContextProvider><MarketContent /></WalletSelectorContextProvider>
export default Market

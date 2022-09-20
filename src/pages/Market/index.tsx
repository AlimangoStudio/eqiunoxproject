import { Button } from '@windmill/react-ui'
import React, { useCallback, useEffect, useState } from 'react'
import { providers, utils } from "near-api-js";
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import type {
	AccountView,
	CodeResult,
} from "near-api-js/lib/providers/provider";
import CollectionCard from '../../components/Cards/CollectionCard'
import PageTitle from '../../components/Typography/PageTitle'
import { useWalletSelector, WalletSelectorContextProvider } from '../../context/WalletSelectorContext'
import CollectionDetail from './CollectionDetail'
import ItemDetail from './ItemDetail'
import { CONTRACT_ID } from '../../constants/address';

export type Account = AccountView & {
	account_id: string;
};

const MarketContent: React.FC = () => {

	const { selector, modal, accounts, accountId } = useWalletSelector();

	const [account, setAccount] = useState<Account | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

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

	useEffect(() => {
		if(!account) return
		console.log('----------', account)
	}, [account])

	return (
		<div>
			<div className='flex justify-between items-center py-8'>
				<PageTitle>{ accountId && `Welcome ${accountId}`}</PageTitle>
				<Button className='' onClick={account? handleSignOut : showModal}>{
					!account? <span>Connect Wallet</span> : <span>Disconnect Wallet</span>
				}</Button>
			</div>
			<Router>
				<Switch>

					<Route path="/app/market/:id/:itemId" component={ItemDetail} />
					<Route path="/app/market/:id" component={CollectionDetail} />
					<Route path='/app/market/' render={() =>
						<div className=''>
							<div className="dark:text-white-300">
								<PageTitle >Explore collections</PageTitle>
							</div>

							<div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
								<CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
								<CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
								<CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
								<CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
							</div>
						</div>
					} />
				</Switch>
			</Router>
		</div>
	)
}

const Market = () => <WalletSelectorContextProvider><MarketContent /></WalletSelectorContextProvider>
export default Market

import React from 'react'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import CollectionCard from '../../components/Cards/CollectionCard'
import PageTitle from '../../components/Typography/PageTitle'
import CollectionDetail from './CollectionDetail'
import ItemDetail from './ItemDetail'

function Market() {
	return (
		<div>
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

export default Market

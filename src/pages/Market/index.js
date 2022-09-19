import React from 'react'
import CollectionCard from '../../components/Cards/CollectionCard'
import PageTitle from '../../components/Typography/PageTitle'

function Market() {
    return (
        <div className=''>
            <PageTitle className="dark:text-white-300">Explore collections</PageTitle>
            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                <CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
                <CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
                <CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
                <CollectionCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/img/collections/188.png" price="666" supply="356" maxSupply="10000" imageUri={'assets/img/collections/188.png'} ></CollectionCard>
            </div>
        </div>
    )
}

export default Market

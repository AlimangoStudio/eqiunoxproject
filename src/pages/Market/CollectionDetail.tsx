import React, { useEffect, useCallback, useState } from 'react'
import ItemCard from '../../components/Cards/ItemCard'
import PropertyCard from '../../components/Cards/PropertyCard'
import { Card, CardBody } from '@windmill/react-ui'
import { useParams } from 'react-router-dom'
import { useWalletSelector } from '../../context/WalletSelectorContext'
import { providers } from 'near-api-js'
import { CodeResult } from 'near-api-js/lib/providers/provider'
import { DSale, NftMetadata, Sale } from '../../constants/types'
import { MARKET_CONTRACT_ID } from '../../constants/address'
import Bluebird from 'bluebird'

const description = `A private group of 1000 dedicated NFT collectors and artists. Membership to the collective and all of the benefits come from holding the PROOF Collective NFT.
`
const selectedCSS = `inline-block p-4 rounded-t-lg border-b-2 text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-500 border-blue-600 dark:border-blue-500`
const nonSelectedCSS = `inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:border-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700`
type QuizParams = {
    id: string
}

function CollectionDetail() {

    const { selector, accountId } = useWalletSelector();
    let { id } = useParams<QuizParams>()

    const [contract, setContract] = useState<NftMetadata>()
    const [sales, setSales] = useState<DSale[]>([])
    const [isSelected, setIsSelect] = useState<Boolean>(true)
    const [myItems, setMyItems] = useState<DSale[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const nearView = useCallback((argBase, contractId, methodName, ) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<CodeResult>({
				request_type: "call_function",
				account_id: contractId,
				method_name: methodName,
				args_base64: btoa(argBase),
				finality: "optimistic",
			})
			.then((res) => JSON.parse(Buffer.from(res.result).toString()));
	}, [selector])

    useEffect(() => {

       setLoading(true)

        const getSalesDetail = async () => {
            await  nearView("", id, "nft_metadata").then(setContract)
            let sales: [Sale] = await nearView(`{"nft_contract_id": "${id}", "from_index": "0", "limit": 10}`, MARKET_CONTRACT_ID, "get_sales_by_nft_contract_id")
            let dSales = await Bluebird.map(Object.values(sales), (sale: Sale) => nearView(`{"token_id": "${sale['token_id']}"}`, id, "nft_token").then(res => ({ sale_conditions: sale.sale_conditions, ...res })))
            setSales(dSales)

            let sales_: [Sale] = await nearView(`{"nft_contract_id": "${id}", "from_index": "0", "limit": 10}`, MARKET_CONTRACT_ID, "get_sales_by_nft_contract_id") 
            let myItems: [DSale] = await nearView(`{"account_id": "${accountId}", "limit": 10}`, id, "nft_tokens_for_owner" ) 

            myItems.map(item => {
                sales_.map(sale => {
                    if ( item.token_id == sale.token_id )  item.sale_conditions = sale.sale_conditions
                })
                return item
            })
            setMyItems(myItems)

            setLoading(false)
        }
        getSalesDetail()

       
    }, [])

    return (
        <>
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                    <li className="mr-2" role="presentation">
                        <button onClick={() => setIsSelect(true)} style={{ outline: "none" }} className={isSelected ? selectedCSS : nonSelectedCSS} id="profile-tab" data-tabs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="true">Listed Items</button>
                    </li>
                    {
                        accountId &&
                        <li className="mr-2" role="presentation">
                        <button onClick={() => setIsSelect(false)} style={{ outline: "none" }} className={!isSelected ? selectedCSS : nonSelectedCSS} id="dashboard-tab" data-tabs-target="#dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">My Items</button>
                    </li>
                    }
                    

                </ul>
            </div>
            <div id="myTabContent">
                {
                    loading && <div>Loading...</div>
                }
                {
                    isSelected && !loading ?
                        <div className="" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                            <div className='mt-4'>
                                <div className='grid grid-cols-3 gap-1'>
                                    <div className='col-span-1'>
                                        <img src={contract?.icon} className='rounded-sm'></img>
                                    </div>
                                    <div className='ml-4 col-span-2 flex flex-col justify-around'>
                                        <div className='flex flex-col justify-center dark:text-white'>
                                            <h1>{contract?.name}</h1>
                                            <p className='text-sm font-medium'>By <b>{id}</b></p>
                                        </div>
                                        <p className='my-2 text-sm font-medium text-gray-600 dark:text-gray-400'>{description}</p>
                                        <div className='grid md:grid-cols-3 grid-cols-2 gap-1'>
                                            <PropertyCard title='Floor price' value='3.6 N' />
                                            <PropertyCard title='Total volume' value='200k N' />
                                            <PropertyCard title='Owners' value='931' />
                                            <PropertyCard title='Listed' value='10k' />
                                            <PropertyCard title='Total Supply' value='20k' />
                                            <PropertyCard title='Max Supply' value='30k' />
                                        </div>
                                    </div>
                                </div>
                                <Card className='p-2 my-12'>
                                    <CardBody className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1' style={{ padding: '1px' }}>
                                        {
                                            sales.map((sale, i) =>
                                                <div key={'sale_item' + i}>
                                                    <ItemCard contractId={id} title={sale.metadata.title} price={sale.sale_conditions} ownerId={sale.owner_id} tokenId={sale.token_id} imageUri={sale.metadata.media} />
                                                </div>)
                                        }
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                        :
                        <div className="" id="dashboard" role="tabpanel" aria-labelledby="dashboard-tab">
                            <Card className='p-2 my-12'>
                                <CardBody className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1' style={{ padding: '1px' }}>
                                    {
                                        myItems.map((sale, i) =>
                                            <div key={'my_item' + i}>
                                                <ItemCard contractId={id} isMine={true} title={sale.metadata.title} price={sale.sale_conditions} ownerId={sale.owner_id} tokenId={sale.token_id} imageUri={sale.metadata.media} />
                                            </div>)
                                    }
                                </CardBody>
                            </Card>
                        </div>
                }


            </div>
        </>

    )
}

export default CollectionDetail

import React, { useEffect } from 'react'
import { Card, CardBody, Button } from '@windmill/react-ui'
import AtrributeCard from '../../components/Cards/AttributeCard'
import AssetImage from '../../assets/img/23.png'
const title = 'PROOF Collective'
const user = 'PROOF_XYZ'
const description = `A private group of 1000 dedicated NFT collectors and artists. Membership to the collective and all of the benefits come from holding the PROOF Collective NFT.
`
function ItemDetail() {

	useEffect(() => {

	}, [])
	return (
		<div className='mt-12'>
			<div className='grid grid-cols-6 grid-rows-2 md:grid-rows-1 gap-4'>
				<div className='col-span-6 md:col-span-3'>
					<img src={AssetImage} className='rounded-lg'></img>
				</div>
				<div className='col-span-6 md:col-span-3'>
					<div className='flex justify-between'>
						<div className='flex flex-col w-full my-8 justify-center dark:text-white'>
							<p className='text-sm font-medium  text-green-600 dark:text-green-400'><b>{user}</b></p>
							<h4 className='mb-2 text-xl font-medium'>{title}</h4>
						</div>
						{/* Buy Box */}
						<Card className='my-4 w-full'>
							<CardBody className="">
								<div className='flex-col items-center'>
									<p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Current Price</p>
									<p className="text-lg font-semibold text-gray-700 dark:text-gray-200">10 N</p>
									<div className='flex justify-center mt-4'><Button size="large" className="w-full">Buy</Button></div>
								</div>
							</CardBody>
						</Card>
					</div>
					
					<div className='grid md:grid-cols-3 grid-cols-2 gap-1'>
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
						<AtrributeCard property='BACKGROUND' value='Teal' percentage='13' />
					</div>
					
				</div>
			</div>
			{/* <Card className='p-2 my-12'>
                <CardBody className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1'  style={{padding: '1px'}}>
                    {
                        [...Array(48).keys()].map(i =>  <ItemCard key={i} imageUri='collections/23.png'/>)
                    }
                </CardBody>
            </Card> */}
		</div>
	)
}

export default ItemDetail

import React, { useEffect } from 'react'
import ItemCard from '../../components/Cards/ItemCard'
import PropertyCard from '../../components/Cards/PropertyCard'
import { Card, CardBody } from '@windmill/react-ui'

const title = 'PROOF Collective'
const user = 'PROOF_XYZ'
const description = `A private group of 1000 dedicated NFT collectors and artists. Membership to the collective and all of the benefits come from holding the PROOF Collective NFT.
`
function CollectionDetail() {

    useEffect(() => {

    }, [])
    
    return (
        <div className='mt-12'>
            <div className='grid grid-cols-5 gap-1'>
                <div className='col-span-3'>
                    <div className='flex'>
                        <img src='collections/23.png' className='rounded-sm' width={100}></img>
                        <div className='flex flex-col ml-4 justify-center dark:text-white'>
                            <h4>{title}</h4>
                            <p className='text-sm font-medium'>By <b>{user}</b></p>
                        </div>
                    </div>
                    <p className='my-2 text-sm font-medium text-gray-600 dark:text-gray-400'>{description}</p>
                </div>
                <div className='col-span-2'>
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
                <CardBody className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1'  style={{padding: '1px'}}>
                    {
                        [1, 2, 3, 4, 5, 6, 7, 8 ,9, 0, 1, 2, 3, 4, 5, 6, 7, 8 ,9, 0, 1, 2, 3, 4, 5, 6, 7, 8 ,9, 0, 1, 2, 3, 4, 5, 6, 7, 8 ,9, 0].map(i =>  <ItemCard key={i} imageUri='collections/23.png'/>)
                    }
                </CardBody>
            </Card>
        </div>
    )
}

export default CollectionDetail

import React, { ReactSVGElement} from 'react'
import { Card, CardBody } from '@windmill/react-ui'
import { useHistory } from 'react-router-dom'
import { NFT_CONTRACT_IDS } from '../../constants/address'

interface ICollectionCard{
  id: string
  imageUri: string
  title: string
  ownerId: string
  price: string
  maxSupply: string
  supply: string
  isParas: boolean
  children?: ReactSVGElement
}

function CollectionCard({ id, imageUri, isParas, title, ownerId, price, maxSupply, supply, children: icon }: ICollectionCard) {

  const history = useHistory()
  const onNavigate = () => {
   
   isParas? history.push(`/app/market/${id}?isParas=true`) : history.push(`/app/market/${id}`)

  }

  return (
    <Card className="evil-card cursor-pointer" onClick={onNavigate}>
      <CardBody className="">
        <div className=''>
          <img src={imageUri}/>
        </div>
        <div className='flex justify-between my-2 my-4 dark:text-white'>
          <div className=''>{title}</div>
          <div className='w-18'>{price}<img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></div>
        </div>
        <div className='flex justify-between my-4 dark:text-white'>
            <div className='text-xs truncate'>{ownerId}</div>
          <div className='text-sm w-12'><b className='float-right'>{supply}/{maxSupply}</b></div>
        </div>
      </CardBody>
    </Card>
  )
}

export default CollectionCard

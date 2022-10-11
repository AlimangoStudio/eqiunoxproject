import React, { ReactSVGElement} from 'react'
import { Card, CardBody } from '@windmill/react-ui'
import { useHistory } from 'react-router-dom'

interface ICollectionCard{
  imageUri: string
  title: string
  ownerId: string
  price: string
  maxSupply: string
  supply: string
  children?: ReactSVGElement
}

function CollectionCard({ imageUri, title, ownerId, price, maxSupply, supply, children: icon }: ICollectionCard) {

  const history = useHistory()
  const onNavigate = () => {
    history.push(`/app/market/${ownerId}`)
  }

  return (
    <Card className="evil-card cursor-pointer" onClick={onNavigate}>
      <CardBody className="">
        <div className=''>
          <img src={imageUri}/>
        </div>
        <div className='flex justify-between my-2 =my-4 dark:text-white'>
          <div className=''>{title}</div>
          <div className=''>{price}<img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></div>
        </div>
        <div className='flex justify-between my-4 dark:text-white'>
          <div className='text-xs'>
            <div className=''>{ownerId}</div>
          </div>
          <div className='text-sm'><b>{supply}/{maxSupply}</b></div>
        </div>
      </CardBody>
    </Card>
  )
}

export default CollectionCard

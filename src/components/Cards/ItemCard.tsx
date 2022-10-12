import React, { ReactSVGElement } from 'react'
import { Card, CardBody } from '@windmill/react-ui'
import { useHistory } from 'react-router-dom'
import { utils } from 'near-api-js'

interface IItemCard{
  contractId: string
  isMine?: boolean
  imageUri: string
  ownerId?: string
  title: string
  price: string
  tokenId: string
  children?: ReactSVGElement
}

function ItemCard({ contractId, isMine = false, imageUri, price, ownerId, title, tokenId, children: icon }: IItemCard ) {

  const history = useHistory()
  const onNavigate = () => {
    history.push(`/app/market/${contractId}/${tokenId}`)
  }

  return (
    <Card className="evil-card cursor-pointer" onClick={onNavigate}>
      <CardBody className="">
        <div className=''>
          <img src={imageUri}/>
        </div>
        <div className='flex items-end justify-between my-2 my-4 dark:text-white'>
          <div className='text-sm'>{title}</div>
          <div className='text-xs'>{isMine && price && `Listed as `}<b className='text-sm'>{isMine && price && <div>{`${utils.format.formatNearAmount(price)} `}<img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></div>}</b></div>
        </div>
        {
          !isMine &&
          <div className='flex justify-between my-4 dark:text-white'>
          <div className='text-sm'>
            {utils.format.formatNearAmount(price)} <img src='/assets/near.png' className='w-6 h-6 inline mb-1'/>
          </div>
          <div className='text-sm'>{ownerId}</div>
        </div>
        }
       
      </CardBody>
    </Card>
    
  )
}

export default ItemCard

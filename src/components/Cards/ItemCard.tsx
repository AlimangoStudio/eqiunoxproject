import React, { ReactSVGElement } from 'react'
import { Card, CardBody } from '@windmill/react-ui'
import { useHistory } from 'react-router-dom'

interface IItemCard{
  key: string
  imageUri: string
  title: string
  avatar: string
  user: string
  price: string
  maxSupply: string
  supply: string
  children?: ReactSVGElement
}

function ItemCard({ key, imageUri, title, avatar, user, price, maxSupply, supply, children: icon }: IItemCard ) {

  const history = useHistory()
  const onNavigate = () => {
    history.push('/app/market/1/1')
  }

  return (
    <div key={key}>
        <Card className="cursor-pointer" onClick={onNavigate}>
        <CardBody className="m-0" style={{padding: 0}}>
          <div className=''>
            <img src={imageUri}/>
          </div>
          {/* <div className='my-2 grid grid-flow-col gap-1 my-4 dark:text-white'>
            <div className='col-span-3'>{title}</div>
            <div className=''>{price}N</div>
          </div>
          <div className='grid grid-flow-col gap-1 my-4 dark:text-white'>
            <div className='col-span-3 text-xs'>
              <img  src={avatar} width={20} className="float-left mr-2"/>
            </div>
            <div className='text-sm'><b>{supply}/{maxSupply}</b></div>
          </div> */}
        </CardBody>
      </Card>
    </div>
    
  )
}

export default ItemCard

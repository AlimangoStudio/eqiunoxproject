import React, { ReactSVGElement} from 'react'
import { Card, CardBody } from '@windmill/react-ui'
import { useHistory } from 'react-router-dom'

interface ICollectionCard{
  imageUri: string
  title: string
  avatar: string
  user: string
  price: string
  maxSupply: string
  supply: string
  children?: ReactSVGElement
}

function CollectionCard({ imageUri, title, avatar, user, price, maxSupply, supply, children: icon }: ICollectionCard) {

  const history = useHistory()
  const onNavigate = () => {
    history.push('/app/market/1')
  }

  return (
    <Card className="evil-card cursor-pointer" onClick={onNavigate}>
      <CardBody className="">
        <div className=''>
          <img src={imageUri}/>
        </div>
        <div className='flex justify-between my-2 =my-4 dark:text-white'>
          <div className=''>{title}</div>
          <div className=''>{price}N</div>
        </div>
        <div className='flex justify-between my-4 dark:text-white'>
          <div className='text-xs'>
            <img  src={avatar} width={20} className="float-left mr-2"/>
          </div>
          <div className='text-sm'><b>{supply}/{maxSupply}</b></div>
        </div>
      </CardBody>
    </Card>
  )
}

export default CollectionCard

import React , { ReactSVGElement } from 'react'
import { Card, CardBody } from '@windmill/react-ui'

interface IEvilCard{
  images: string[]
  title: string
  avatar: string
  user: string
  price: string
  supply: string
  children?: ReactSVGElement
}

function EvilCard({ images, title, avatar, user, price, supply, children: icon }: IEvilCard) {
  return (
    <Card className="evil-card">
      <CardBody className="">
        
        <div className='grid grid-rows-3 grid-flow-col gap-1'>
          <div className='row-span-3 col-span-3'>
            <img src={images[0]}/>
          </div>
          <div>
            <img src={images[1]}/>
          </div>
          <div>
            <img src={images[2]}/>
          </div>
          <div>
            <img src={images[3]}/>
          </div>
        </div>
        <div className='my-2 grid grid-flow-col gap-1 my-4 dark:text-white'>
          <div className='col-span-3'>{title}</div>
          <div className=''><img className='float-left' src='assets/img/SolanaIcon.svg' width={25}/>{price}</div>
        </div>
        <div className='grid grid-flow-col gap-1 my-4 dark:text-white'>
          <div className='col-span-3 text-xs'>
            <img  src={avatar} width={20} className="float-left mr-2"/>
            by {user}`
          </div>
          <div className='text-sm'><b>{supply}</b> Items</div>
        </div>
      </CardBody>
    </Card>
  )
}

export default EvilCard

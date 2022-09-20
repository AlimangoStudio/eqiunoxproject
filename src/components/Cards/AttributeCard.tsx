import React, { ReactSVGElement } from 'react'
import { Card, CardBody } from '@windmill/react-ui'

interface IAtrributeCard{
  property: string
  value: string
  percentage: string
  children?: ReactSVGElement
}

function AtrributeCard({ property, percentage, value, children: icon }: IAtrributeCard) {
  return (
    <Card>
      <CardBody className="flex items-center">
        <div>
          <p className="mb-2 text-xs font-medium text-green-600 dark:text-green-400">{property}</p>
          <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{value}</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{percentage}% have this trait</p>
        </div>
      </CardBody>
    </Card>
  )
}

export default AtrributeCard

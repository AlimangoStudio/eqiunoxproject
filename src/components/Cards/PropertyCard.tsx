import React, { ReactSVGElement } from 'react'
import { Card, CardBody } from '@windmill/react-ui'

interface IPropertyCard{
  title: string
  value: string
  children?: ReactSVGElement
}

function PropertyCard({ title, value, children: icon }: IPropertyCard) {
  return (
    <Card>
      <CardBody className="flex items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}

export default PropertyCard

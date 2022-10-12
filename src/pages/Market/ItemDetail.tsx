import React, { useEffect, useCallback, useState } from 'react'
import { Card, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input } from '@windmill/react-ui'
import AtrributeCard from '../../components/Cards/AttributeCard'
import { useWalletSelector } from '../../context/WalletSelectorContext'
import { providers, utils } from 'near-api-js'
import { useParams } from 'react-router-dom'
import { CodeResult } from 'near-api-js/lib/providers/provider'
import { DSale, Sale } from '../../constants/types'
import { MARKET_CONTRACT_ID } from '../../constants/address'

type QuizParams = {
	id: string
	itemId: string
}

function ItemDetail() {

	const { selector, accountId } = useWalletSelector();
	let { id, itemId } = useParams<QuizParams>()
	const [item, setItem] = useState<DSale>()
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [newPrice, setNewPrice] = useState("")
	const [newListPrice, setNewListPrice] = useState("")
	const [deposit, setDeposit] = useState("")
	const [storageBalance, setStorageBalance] = useState("")

	const openModal = () => {
		setIsModalOpen(true);
	}

	const openListModal = () => {
		setIsListModalOpen(true)
	}
	const closeModal = () => {
		setIsModalOpen(false);
		setIsListModalOpen(false)
	}

	const nearCall = useCallback(
		async (args: Object, methodName: string, donation: string, receiverId?: string) => {

			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					receiverId: receiverId? receiverId : MARKET_CONTRACT_ID,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: methodName,
								args: { ...args },
								gas: BOATLOAD_OF_GAS,
								deposit: donation!,
							},
						},
					],
				})
				.catch((err) => {
					console.log("error:", err)
				});

		},
		[selector, accountId]
	);
	
	const nearView = useCallback((argBase, contractId, methodName, ) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<CodeResult>({
				request_type: "call_function",
				account_id: contractId,
				method_name: methodName,
				args_base64: btoa(argBase),
				finality: "optimistic",
			})
			.then((res) => JSON.parse(Buffer.from(res.result).toString()));
	}, [selector])
	
	const onUpdatePrice = async () => {
		nearCall({nft_contract_id: id, token_id: itemId, price: utils.format.parseNearAmount(newPrice)}, "update_price", "1")
	}
	const onRemoveSale = async () => {
		nearCall({nft_contract_id: id, token_id: itemId}, "remove_sale", "1")
	}
	
	const onOffer = async () => {
		nearCall({ nft_contract_id: id, token_id: itemId, price: item?.sale_conditions }, "offer", item?.sale_conditions!)
	}

	const onList = async () => {
		nearCall({ token_id: itemId, account_id: MARKET_CONTRACT_ID, msg: `{ "sale_conditions": "${utils.format.parseNearAmount(newListPrice)}"}` }, "nft_approve", utils.format.parseNearAmount("0.001")!, id )
	}

	const onDeposit = async () => {
		nearCall({account_id: accountId}, "stroage_deposit", utils.format.parseNearAmount(deposit)!)
	}

	const onChangePrice = (e: any) => {
		setNewPrice(e.target.value)
	}

	const onChangeListPrice = (e: any) => {
		setNewListPrice(e.target.value)
	}

	const onChangeDeposit = (e: any) => {
		setDeposit(e.target.value)
	}

	useEffect(() => {

		const getItemDetail = async () => {
			let item: DSale = await nearView(`{"token_id": "${itemId}"}`, id, "nft_token" )
			let itemSale: Sale = await nearView(`{"nft_contract_token": "${id}.${itemId}"}`, MARKET_CONTRACT_ID, "get_sale") 
			if ( itemSale ) {
				item.sale_conditions = itemSale.sale_conditions
				setNewPrice( utils.format.formatNearAmount(itemSale.sale_conditions))
			}
			
			setItem(item)
		}

		const getStorageBalance = async () => {
			let storage_balance = await nearView(`{"account_id": "${accountId}"}`, MARKET_CONTRACT_ID, "storage_balance_of") 
			setStorageBalance(storage_balance)
		}
		getItemDetail()
		getStorageBalance()

	}, [])

	return (
		
		<div className='mt-12'>
			{
				!item && <div>Loading...</div>
			}
			{ item &&

			<div className='grid grid-cols-5 grid-rows-2 md:grid-rows-1 gap-4'>
				<div className='col-span-6 md:col-span-2'>
					<img src={item?.metadata.media} className='rounded-lg'></img>
				</div>
				<div className='col-span-6 md:col-span-3'>
					<div className='flex justify-between'>
						<div className='flex flex-col w-full my-8 justify-center dark:text-white'>
							<p className='text-sm font-medium  text-green-600 dark:text-green-400'><b>{item?.owner_id}</b></p>
							<h4 className='mb-2 text-xl font-medium'>{item?.metadata.title}</h4>
						</div>
						{/* Buy Box */}
						<Card className='my-4 w-full'>
							<CardBody className="">
								<div className='flex-col items-center'>

									{
										item?.owner_id == accountId ?
											<div>
												{
													item?.sale_conditions ?
														<div>
															<p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200 ">Current Price</p>
															<div className='flex justify-between items-center'>
																<p className="text-sm font-medium text-gray-700 dark:text-gray-200">{utils.format.formatNearAmount(item.sale_conditions)} <img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></p>
																<div className='flex justify-center'><Button disabled={!accountId} onClick={() => openModal()} size="small" className="w-full">Update Price</Button></div>
																{/* Modal */}
																<Modal isOpen={isModalOpen} onClose={closeModal}>
																	<ModalHeader>Update Price</ModalHeader>
																	<ModalBody>
																		 	<Label>
																			<span>New Price</span>
																			<Input value={newPrice} onChange={ e =>  onChangePrice(e)} css="" className="mt-1" placeholder="" />
																		</Label>
																	</ModalBody>
																	<ModalFooter>
																		<div className="hidden sm:block">
																			<Button layout="outline" onClick={closeModal}>
																				Cancel
																			</Button>
																		</div>
																		<div className="hidden sm:block">
																			<Button onClick={onUpdatePrice} >Accept</Button>
																		</div>
																		<div className="block w-full sm:hidden">
																			<Button block size="large" layout="outline" onClick={closeModal}>
																				Cancel
																			</Button>
																		</div>
																		<div className="block w-full sm:hidden">
																			<Button onClick={onUpdatePrice} block size="large">
																				Accept
																			</Button>
																		</div>
																	</ModalFooter>
																</Modal>
																{/* Modal end */}
															</div>
															<div className='flex justify-center mt-4'><Button disabled={!accountId} onClick={() => onRemoveSale()} size="large" className="w-full">Remove Sale</Button></div>
														</div>
														:
														<div>
															<p className="mb-2 text-md font-medium text-gray-600 dark:text-gray-400">Please list item on marketplace</p>
															<Label>
																<span>Storage Balance (0.01 Near per 1 sale)</span>
																<p className='text-sm font-medium text-gray-800 dark:text-gray-200'>{ utils.format.formatNearAmount(storageBalance)} <img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></p>
																
															</Label>
															{
																Number(storageBalance) > 0.1 &&
																<div className='flex justify-between items-center'>
																	
																	<Input value={deposit} onChange={ e =>  onChangeDeposit(e)} css="" className="w-12 mr-4" placeholder="" />
																	<Button disabled={!accountId} onClick={() => onDeposit()} size="large" className="w-full">Deposit</Button>
																</div>
															}
															<div className='flex justify-center mt-4'><Button disabled={!accountId} onClick={() => openListModal()} size="large" className="w-full">List</Button></div>
															{/* Modal */}
															<Modal isOpen={isListModalOpen} onClose={closeModal}>
																	<ModalHeader>List Item</ModalHeader>
																	<ModalBody>
																		 	<Label>
																			<span>Price</span>
																			<Input value={newListPrice} onChange={ e =>  onChangeListPrice(e)} css="" className="mt-1" placeholder="" />
																		</Label>
																	</ModalBody>
																	<ModalFooter>
																		<div className="hidden sm:block">
																			<Button layout="outline" onClick={closeModal}>
																				Cancel
																			</Button>
																		</div>
																		<div className="hidden sm:block">
																			<Button onClick={onList} >Accept</Button>
																		</div>
																		<div className="block w-full sm:hidden">
																			<Button block size="large" layout="outline" onClick={closeModal}>
																				Cancel
																			</Button>
																		</div>
																		<div className="block w-full sm:hidden">
																			<Button onClick={onList} block size="large">
																				Accept
																			</Button>
																		</div>
																	</ModalFooter>
																</Modal>
																{/* Modal end */}
														</div>
												}
											</div>
											:
											<div>
												<p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">Current Price</p>
												<p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{item && utils.format.formatNearAmount(item.sale_conditions)} <img src='/assets/near.png' className='w-6 h-6 inline mb-1'/></p>
												<div className='flex justify-center mt-4'><Button disabled={!accountId} onClick={() => onOffer()} size="large" className="w-full">Buy</Button></div>
											</div>
									}

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
			}
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

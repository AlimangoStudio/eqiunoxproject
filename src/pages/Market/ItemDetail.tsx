import React, { useEffect, useCallback, useState } from 'react'
import { Card, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input } from '@windmill/react-ui'
import AtrributeCard from '../../components/Cards/AttributeCard'
import AssetImage from '../../assets/img/23.png'
import { useWalletSelector } from '../../context/WalletSelectorContext'
import { providers, utils } from 'near-api-js'
import { useParams } from 'react-router-dom'
import { CodeResult } from 'near-api-js/lib/providers/provider'
import { DSale, Sale } from '../../constants/types'
import { MARKET_CONTRACT_ID } from '../../constants/address'
const title = 'PROOF Collective'
const user = 'PROOF_XYZ'
const description = `A private group of 1000 dedicated NFT collectors and artists. Membership to the collective and all of the benefits come from holding the PROOF Collective NFT.
`

type QuizParams = {
	id: string
	itemId: string
}

function ItemDetail() {

	const { selector, modal, accounts, accountId } = useWalletSelector();
	let { id, itemId } = useParams<QuizParams>()
	const [item, setItem] = useState<DSale>()
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [newPrice, setNewPrice] = useState("")
	const [newListPrice, setNewListPrice] = useState("")
	const [deposit, setDeposit] = useState("")
	const [storageBalance, setStorageBalance] = useState("")

	function openModal() {
		setIsModalOpen(true);
	}

	function openListModal () {
		setIsListModalOpen(true)
	}
	function closeModal() {
		setIsModalOpen(false);
		setIsListModalOpen(false)
	}

	const offer = useCallback(
		async (nftContractId: string, donation: string, tokenId: string) => {

			const { contract } = selector.store.getState();
			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			console.log(BOATLOAD_OF_GAS)
			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: "offer",
								args: { nft_contract_id: nftContractId, token_id: tokenId, price: donation },
								gas: BOATLOAD_OF_GAS,
								deposit: donation!,
							},
						},
					],
					callbackUrl: `/app/market/${nftContractId}`
				})
				.catch((err) => {
					console.log("Failed to add message", err);
					throw err;
				});

		},
		[selector, accountId]
	);

	const updatePrice = useCallback(
		async (nftContractId: string, tokenId: string, price: string, donation: string,  ) => {

			const { contract } = selector.store.getState();
			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			console.log(BOATLOAD_OF_GAS)
			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: "update_price",
								args: { nft_contract_id: nftContractId, token_id: tokenId, price: utils.format.parseNearAmount(price) },
								gas: BOATLOAD_OF_GAS,
								deposit: donation!,
							},
						},
					],
				})
				.catch((err) => {
					console.log("Failed to add message", err);
					throw err;
				});

		},
		[selector, accountId]
	);

	const removeSale = useCallback(
		async (nftContractId: string, tokenId: string, donation: string) => {

			const { contract } = selector.store.getState();
			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			console.log(BOATLOAD_OF_GAS)
			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: "remove_sale",
								args: { nft_contract_id: nftContractId, token_id: tokenId },
								gas: BOATLOAD_OF_GAS,
								deposit: donation!,
							},
						},
					],
					callbackUrl: `/app/market/${nftContractId}`
				})
				.catch((err) => {
					console.log("Failed to add message", err);
					throw err;
				});
		},
		[selector, accountId]
	);

	const storageDeposit = useCallback(
		async (donation: string) => {

			console.log('-- donation', donation)
			const { contract } = selector.store.getState();
			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			console.log(BOATLOAD_OF_GAS)
			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: "storage_deposit",
								args: { account_id: accountId},
								gas: BOATLOAD_OF_GAS,
								deposit: utils.format.parseNearAmount(donation)!,
							},
						},
					],
				})
				.catch((err) => {
					console.log("Failed to deposit", err);
					throw err;
				});

		},
		[selector, accountId]
	);

	const nftApprove = useCallback(
		async (nftContractId: string, tokenId: string, sale_conditions, donation: string) => {

			const { contract } = selector.store.getState();
			const wallet = await selector.wallet();
			const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.0000000003")!;

			console.log("listing price", sale_conditions)
			return wallet
				.signAndSendTransaction({
					signerId: accountId!,
					receiverId: nftContractId,
					actions: [
						{
							type: "FunctionCall",
							params: {
								methodName: "nft_approve",
								args: { token_id: tokenId, account_id: contract?.contractId, msg: `{ "sale_conditions": "${utils.format.parseNearAmount(sale_conditions)}"}` },
								gas: BOATLOAD_OF_GAS,
								deposit: utils.format.parseNearAmount(donation)!,
							},
						},
					],
				})
				.catch((err) => {
					console.log("Failed to approve nft on marketplace", err);
					throw err;
				});

		},
		[selector, accountId]
	);

	const getSaleByTokenId = useCallback((marketContractId, nftContractId, tokenId) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<CodeResult>({
				request_type: "call_function",
				account_id: marketContractId,
				method_name: "get_sale",
				args_base64: btoa(`{"nft_contract_token": "${nftContractId}.${tokenId}"}`),
				finality: "optimistic",
			})
			.then((res) => JSON.parse(Buffer.from(res.result).toString()));
	}, [selector])

	const getStorageBalanceOf = useCallback((marketContractId) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<CodeResult>({
				request_type: "call_function",
				account_id: marketContractId,
				method_name: "storage_balance_of",
				args_base64: btoa(`{"account_id": "${accountId}"}`),
				finality: "optimistic",
			})
			.then((res) => JSON.parse(Buffer.from(res.result).toString()));
	}, [selector, accountId])

	const getNFTByTokenId = useCallback((nftContractId, tokenId) => {
		const { network } = selector.options;
		const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

		return provider
			.query<CodeResult>({
				request_type: "call_function",
				account_id: nftContractId,
				method_name: "nft_token",
				args_base64: btoa(`{"token_id": "${tokenId}"}`),
				finality: "optimistic",
			})
			.then((res) => ({ ...JSON.parse(Buffer.from(res.result).toString()) }));
	}, [selector])

	useEffect(() => {

		const getItemDetail = async () => {
			let item: DSale = await getNFTByTokenId(id, itemId)
			let itemSale: Sale = await getSaleByTokenId(MARKET_CONTRACT_ID, id, itemId)
			if ( itemSale ) {
				item.sale_conditions = itemSale.sale_conditions
				console.log('--- sale condition', item.sale_conditions)
				setNewPrice( utils.format.formatNearAmount(itemSale.sale_conditions))
			}
			
			setItem(item)
		}

		const getStorageBalance = async () => {
			let storage_balance = await getStorageBalanceOf(MARKET_CONTRACT_ID)
			setStorageBalance(storage_balance)
		}
		getItemDetail()
		getStorageBalance()

	}, [])

	const onOffer = async () => {
		let res = item && await offer(id, item?.sale_conditions, itemId)
		console.log('---- offer response ', res)
	}

	const onList = async () => {
		let res = await nftApprove(id,  itemId, newListPrice, "0.001",)
		console.log('---- list response ', res)
	}

	const onRemoveSale = async () => {
		let res = await removeSale(id, itemId, "1")
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

	const onUpdatePrice = async () => {
		let res = await updatePrice(id, itemId, newPrice.toString(), "1")
	}

	const onDeposit = async () => {
		let res = await storageDeposit(deposit)
	}
	return (
		<div className='mt-12'>
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
																<p className="text-sm font-medium text-gray-700 dark:text-gray-200">{utils.format.formatNearAmount(item.sale_conditions)} N</p>
																<div className='flex justify-center'><Button onClick={() => openModal()} size="small" className="w-full">Update Price</Button></div>
																{/* Modal */}
																<Modal isOpen={isModalOpen} onClose={closeModal}>
																	<ModalHeader>Update Price</ModalHeader>
																	<ModalBody>
																		 	<Label>
																			<span>New Price</span>
																			<Input value={newPrice} onChange={ e =>  onChangePrice(e)} css="" className="mt-1" placeholder="Jane Doe" />
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
															<div className='flex justify-center mt-4'><Button onClick={() => onRemoveSale()} size="large" className="w-full">Remove Sale</Button></div>
														</div>
														:
														<div>
															<p className="mb-2 text-md font-medium text-gray-600 dark:text-gray-400">Please list item on marketplace</p>
															<Label>
																<span>Storage Balance (0.01 Near per 1 sale)</span>
																<p className='text-sm font-medium text-gray-800 dark:text-gray-200'>{ utils.format.formatNearAmount(storageBalance)}</p>
																
															</Label>
															{
																Number(storageBalance) > 0.1 &&
																<div className='flex justify-between items-center'>
																	
																	<Input value={deposit} onChange={ e =>  onChangeDeposit(e)} css="" className="w-12 mr-4" placeholder="Jane Doe" />
																	<Button onClick={() => onDeposit()} size="large" className="w-full">Deposit</Button>
																</div>
															}
															<div className='flex justify-center mt-4'><Button onClick={() => openListModal()} size="large" className="w-full">List</Button></div>
															{/* Modal */}
															<Modal isOpen={isListModalOpen} onClose={closeModal}>
																	<ModalHeader>List Item</ModalHeader>
																	<ModalBody>
																		 	<Label>
																			<span>Price</span>
																			<Input value={newListPrice} onChange={ e =>  onChangeListPrice(e)} css="" className="mt-1" placeholder="Jane Doe" />
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
												<p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{Number(item?.sale_conditions) / 10 ** 24} N</p>
												<div className='flex justify-center mt-4'><Button onClick={() => onOffer()} size="large" className="w-full">Buy</Button></div>
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

# Near Market Place

# Deploy
near deploy --wasmFile out/main.wasm --accountId $NFT_CONTRACT_ID
# Initialization
near call chedera.testnet new_default_meta '{"owner_id": "chedera.testnet"}' --accountId chedera.testnet
near call $MARKET_CONTRACT_ID new '{"owner_id": "'$MARKET_CONTRACT_ID'"}' --accountId $MARKET_CONTRACT_ID
# NFT collection metadata
near view chedera.testnet nft_metadata
# Return items from NFT collection
near view chedera.testnet nft_tokens '{"from_index": "0", "limit": 50}'
near view chedera.testnet nft_token '{"token_id": "token-1"}'
near view shedera.testnet nft_tokens_for_owner '{"account_id": "uhedera.testnet", "limit": 5}'

# Minting
export $NFT_CONTRACT_ID="shedera.testnet"

near call chedera.testnet nft_mint '{"token_id": "DZ4", "metadata": {"title": "Deserted Zebra #4", "description": "Deserted Zebra Iceland  :)", "media": "https://gateway.pinata.cloud/ipfs/QmWs8fenVwAecbxMKtLnXDRT7JgVYq1hHjE8veNzU1vjze/Zebra4.png"}, "receiver_id": "uhedera.testnet"}' --accountId uhedera.testnet --amount 0.1

# Storage Deposit
near call mhedera.testnet storage_deposit  --accountId bhedera.testnet --deposit 0.1
# Approve
## without msg which include sale_conditions
near call $NFT_CONTRACT_ID nft_approve '{"token_id": "token-2", "account_id": "mhedera.testnet"}' --accountId uhedera.testnet --deposit 0.1

near view shedera.testnet nft_tokens_for_owner '{"account_id": "uhedera.testnet", "limit": 10}'

# Listing
near call chedera.testnet nft_approve '{"token_id": "DZ2", "account_id": "mhedera.testnet", "msg": "{\"sale_conditions\": \"1000000000000000000000000\"}"}' --accountId bhedera.testnet --deposit 0.1

# Total supply listed on marketplace by specific owner
near view mhedera.testnet get_supply_sales
near view mhedera.testnet get_supply_by_owner_id '{"account_id": "uhedera.testnet"}'
near view mhedera.testnet get_sale '{"nft_contract_token": "chedera.testnet.DZ1"}'
near view mhedera.testnet get_sales_by_nft_contract_id '{"nft_contract_id": "chedera.testnet"}'
# Update Price
near call mhedera.testnet update_price '{"nft_contract_id": "shedera.testnet", "token_id": "token-2", "price": "1000"}' --accountId uhedera.testnet --deposit 0.000000000000000000000001

# Purchase NFT 
near call mhedera.testnet offer '{"nft_contract_id": "shedera.testnet", "token_id": "token-2", "price": "1000"}' --accountId uhedera.testnet --deposit 1 --gas=300000000000000

# Remove Sale
near call mhedera.testnet remove_sale  '{"nft_contract_id": "chedera.testnet", "token_id": "token-2"}' --accountId uhedera.testnet 

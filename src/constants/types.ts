export type NftMetadata = {
    base_uri: string
    icon: string
    name: string
    symbol: string
    reference: string
    spec: string
    reference_hash: string
    owner_id: string
}


export type Sale = {
    approval_id: number
    nft_contract_id: string
    owner_id: string
    sale_conditions: string
    token_id: string
}

export type TokenMetadata = {
    copies: string
    description: string
    extra: string
    media: string
    media_hash: string
    reference: string
    reference_hash: string
    title: string
    issued_at: string
    updated_at: string
    starts_at: string
}

export type DSale = {
    approved_accounts_ids: []
    owner_id: string
    metadata: TokenMetadata
    royalty: object
    sale_conditions: string
    token_id: string
}
import React from 'react'
import EvilCard from '../../components/Cards/EvilCard'
import PageTitle from '../../components/Typography/PageTitle'

function LaunchPad() {
  return (
    <div>
      <div className="dark:text-white-300">
        <PageTitle >Explore Launchpad</PageTitle>
      </div>


      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <EvilCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/188.png" price="666" supply="10000" images={["assets/188.png", "assets/23.png", "assets/32.png", "assets/145.png"]}></EvilCard>
        <EvilCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/188.png" price="666" supply="10000" images={["assets/188.png", "assets/23.png", "assets/32.png", "assets/145.png"]}></EvilCard>
        <EvilCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/188.png" price="666" supply="10000" images={["assets/188.png", "assets/23.png", "assets/32.png", "assets/145.png"]}></EvilCard>
        <EvilCard title="EvilDegen" user="Evil Degen NFT" avatar="assets/188.png" price="666" supply="10000" images={["assets/188.png", "assets/23.png", "assets/32.png", "assets/145.png"]}></EvilCard>
      </div>
    </div>
  )
}

export default LaunchPad

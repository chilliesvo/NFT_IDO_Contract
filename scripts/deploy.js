const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
  //Loading accounts
  // const accounts = await ethers.getSigners();
  // const addresses = accounts.map((item) => item.address.toString());

  // Loading contract factory.
  const IDO = await ethers.getContractFactory("IDO");

  // Deploy contracts
  const ido = await IDO.deploy("IDO_TOKEN", "TTK");
  await ido.deployed();
  console.log("IDO  deployed to ==> ", ido.address);
  
  const contractAddresses = {
    ido: ido.address,
  };

  await fs.writeFileSync(
    "scripts/contracts.json",
    JSON.stringify(contractAddresses)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

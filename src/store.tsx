import { useEffect } from "react";
import { create } from "zustand";
import { EVMWallet } from "@catalogfi/wallets";
import { BrowserProvider } from "ethers";
import { GardenJS } from "@gardenfi/core";
import { Orderbook, Chains } from "@gardenfi/orderbook";
import {
  BitcoinNetwork,
  BitcoinOTA,
  BitcoinProvider,
} from "@catalogfi/wallets";

type EvmWalletState = {
  metaMaskIsConnected: boolean;
  evmProvider: BrowserProvider | null;
};

type EvmWalletAction = {
  connectMetaMask: () => Promise<void>;
};

const networkConfig = {
  chainId: "0x7A69",
  chainName: "ethereum localnet",
  rpcUrls: ["http://localhost:8545"],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

const sepoliaNetworkConfig = {
  chainId: "0xaa36a7", // Sepolia testnet chain ID
  chainName: "sepolia",
  rpcUrls: ["https://sepolia.infura.io/v3/"], // Replace with a reliable Sepolia RPC URL
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

const useMetaMaskStore = create<EvmWalletState & EvmWalletAction>((set) => ({
  metaMaskIsConnected: false,
  evmProvider: null,
  connectMetaMask: async () => {
    if (window.ethereum !== null) {
      let provider = new BrowserProvider(window.ethereum);
      let network = await provider.getNetwork();
      if (network.chainId !== BigInt(sepoliaNetworkConfig.chainId)) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [sepoliaNetworkConfig],
        });
        provider = new BrowserProvider(window.ethereum);
      }
      set(() => ({
        evmProvider: provider,
        metaMaskIsConnected: true,
      }));
    } else {
      throw new Error("MetaMask not Found");
    }
  },
}));

type GardenStore = {
  garden: GardenJS | null;
  bitcoin: BitcoinOTA | null;
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => void;
};

const gardenStore = create<GardenStore>((set) => ({
  garden: null,
  bitcoin: null,
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => {
    set(() => ({
      garden,
      bitcoin,
    }));
  },
}));

type SignStore = {
  isMMPopupOpen: boolean;
  isSigned: boolean;
  setIsMMPopupOpen: (isMMPopupOpen: boolean) => void;
  setIsSigned: (isSigned: boolean) => void;
};

const useSignStore = create<SignStore>((set) => ({
  isMMPopupOpen: false,
  isSigned: false,
  setIsMMPopupOpen: (isMMPopupOpen: boolean) => {
    set(() => {
      return { isMMPopupOpen };
    });
  },
  setIsSigned: (isSigned: boolean) => {
    set(() => {
      return { isSigned };
    });
  },
}));

const useGarden = () => ({
  garden: gardenStore((state) => state.garden),
  bitcoin: gardenStore((state) => state.bitcoin),
});

/* Only to be used once at the root level*/
const useGardenSetup = () => {
  const { evmProvider } = useMetaMaskStore();
  const { setGarden } = gardenStore();

  useEffect(() => {
    (async () => {
      if (!evmProvider) return;
      const signer = await evmProvider.getSigner();

      const bitcoinProvider = new BitcoinProvider(
        BitcoinNetwork.Regtest,
        "http://localhost:30000"
      );

      const orderbook = await Orderbook.init({
        url: "https://orderbook-testnet.garden.finance/",
        signer: signer,
        opts: {
          domain: window.location.host,
          store: localStorage,
        },
      });

      const wallets = {
        [Chains.bitcoin_regtest]: new BitcoinOTA(bitcoinProvider, signer),
        [Chains.ethereum_sepolia]: new EVMWallet(signer), // Change this line
      };

      const garden = new GardenJS(orderbook, wallets);

      setGarden(garden, wallets[Chains.bitcoin_regtest]);
    })();
  }, [evmProvider, setGarden]);
};

export { useMetaMaskStore, useGarden, useGardenSetup, useSignStore };

import { Web3Auth } from '@web3auth/modal';
import { Web3AuthConnector as WagmiWeb3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { LOGIN_MODAL_EVENTS } from '@web3auth/ui';

class Connector extends WagmiWeb3AuthConnector {
    closeModal() {
        (
            this.web3AuthInstance
        )?.loginModal?.closeModal();
    }

    async connect() {
        let error;

        const value = await new Promise(async (resolve, reject) => {
            this.web3AuthInstance.on(
                LOGIN_MODAL_EVENTS.MODAL_VISIBILITY,
                async (isVisible) => {
                    /**
                     * If the web3auth session is expired => the modal opens automatically.
                     *
                     * If the web3auth session is expired and the user calls `connect`
                     * (usually during eager connection),
                     * web3auth will open the modal => every time we refresh the page,
                     * this modal will be opened => not the desired behavior.
                     *
                     * To prevent this, let's kill the wagmi connection.
                     */
                    const ls = localStorage.getItem('wagmi.connected');
                    const isWagmiConnected = ls ? JSON.parse(ls) : ls;
                    if (isVisible && isWagmiConnected) {
                        this.closeModal();
                        await this.disconnect();
                    }
                }
            );

            try {
                const result = await super.connect();
                // Make additional requests here if needed eg authenticate with a backend

                this.closeModal();

                resolve(result);
            } catch (error) {
                reject(error);
            }
        }).catch((err) => {
            error = err;
        });

        if (!error) return value;

        throw error;
    }
}

export const web3AuthConnector = (chains) => {
    const web3AuthInstance = new Web3Auth({
        clientId:
            'BKfeYPuAvJ8FLsk3fWbJm4YtC6FOgJX_7Lerg7Pe-B5JgBHgiDbdwdUpi8OLGbMB3OTPiRlTw3fj1L-CKd9zNAI', // Should be in an .env file, but I won't do that for this example since I'm not going to use this key for anything else
        web3AuthNetwork: 'testnet', // Should change according to environment
        chainConfig: {
            chainNamespace: 'eip155',
            chainId: `0x${chains[0].id.toString(16)}`,
        },
        uiConfig: {
            theme: 'dark',
            loginMethodsOrder: ['google', 'discord', 'github', 'twitter', 'twitch'],
            appLogo: 'https://web3auth.io/images/w3a-L-Favicon-1.svg',
        },
        enableLogging: false,
        sessionTime: 86400, // 24 hours
    });

    return new Connector({
        options: {
            web3AuthInstance,
        },
        chains: [
            {
                id: chains[0].id,
                name: chains[0].name,
                rpcUrls: {
                    default: {
                        http: [chains[0].rpcUrls.default.http[0]],
                    },
                    public: {
                        http: [chains[0].rpcUrls.public.http[0]],
                    },
                },
                nativeCurrency: {
                    name: chains[0].nativeCurrency.name,
                    symbol: chains[0].nativeCurrency.symbol,
                    decimals: chains[0].nativeCurrency.decimals,
                },
                network: chains[0].network,
            },
        ],
    });
};
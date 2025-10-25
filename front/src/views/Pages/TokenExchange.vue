<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">Token Exchange (MetaMask)</h1>

    <div class="mb-4 flex items-center gap-3">
      <button
        class="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300"
        :disabled="connecting"
        @click="connectWallet"
      >
        {{ account ? 'Connecté' : 'Connecter MetaMask' }}
      </button>
      <span v-if="account" class="text-gray-700">{{ accountShort }}</span>
      <span v-if="chainName" class="text-gray-500">Réseau: {{ chainName }}</span>
    </div>

    <div class="mb-6">
      <p class="text-gray-600">Lecture du prix depuis l'oracle on-chain</p>
      <div class="mt-2 flex items-center gap-3">
        <button
          class="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300"
          :disabled="loading || !oracleReady"
          @click="fetchPrice"
        >
          Rafraîchir le prix
        </button>
        <span v-if="loading" class="text-gray-500">Chargement…</span>
        <span v-else class="text-gray-800">Prix actuel: <strong>{{ priceDisplay }}</strong></span>
      </div>
      <p v-if="!oracleReady" class="text-orange-500 mt-2">Configurez VITE_ORACLE_CONTRACT_ADDRESS dans front/.env</p>
      <p v-if="error" class="text-error-500 mt-2">{{ error }}</p>
    </div>

    <div class="mt-8 border rounded-lg p-4 bg-white">
      <h2 class="text-lg font-medium mb-3">Mettre à jour le prix (on-chain)</h2>
      <div class="flex items-center gap-3">
        <input type="number" class="border rounded-md px-3 py-2 w-40" v-model.number="newPrice" placeholder="prix en cents" />
        <button
          class="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300"
          :disabled="updating || !validNewPrice || !account"
          @click="updatePrice"
        >
          Mettre à jour
        </button>
      </div>
      <p v-if="updateMessage" class="text-success-600 mt-2">{{ updateMessage }}</p>
      <p v-if="updateError" class="text-error-500 mt-2">{{ updateError }}</p>
      <p v-if="!account" class="text-orange-500 mt-2">Connectez MetaMask pour activer la mise à jour (le backend effectuera l'update)</p>
    </div>

    <div class="mt-10 border rounded-lg p-4 bg-white">
      <h2 class="text-lg font-medium mb-3">Swap</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium mb-2">Acheter des CTK avec ETH</h3>
          <input type="text" class="border rounded-md px-3 py-2 w-48" v-model="ethToSpend" placeholder="ETH à dépenser" />
          <button
            class="ml-3 px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300"
            :disabled="!dexReady || !signerReady || buying"
            @click="buyTokens"
          >Acheter</button>
          <p v-if="!dexReady" class="text-orange-500 mt-2">Configurez VITE_DEX_ADDRESS dans front/.env</p>
        </div>
        <div>
          <h3 class="font-medium mb-2">Vendre des CTK contre ETH</h3>
          <input type="text" class="border rounded-md px-3 py-2 w-48" v-model="tokensToSell" placeholder="CTK à vendre" />
          <button
            class="ml-3 px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300"
            :disabled="!dexReady || !tokenReady || !signerReady || selling"
            @click="sellTokens"
          >Vendre</button>
          <p v-if="!tokenReady" class="text-orange-500 mt-2">Configurez VITE_TOKEN_ADDRESS dans front/.env</p>
        </div>
      </div>
      <p v-if="swapError" class="text-error-500 mt-2">{{ swapError }}</p>
      <p v-if="swapMessage" class="text-success-600 mt-2">{{ swapMessage }}</p>
    </div>

    <div class="mt-10 text-gray-500">
      <p>Variables requises côté front: VITE_RPC_URL, VITE_ORACLE_CONTRACT_ADDRESS, VITE_DEX_ADDRESS, VITE_TOKEN_ADDRESS.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// using global ethers from CDN
const ethers = (window as any).ethers as any

const rpcUrl = import.meta.env.VITE_RPC_URL
const ORACLE_ADDR = import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS
const DEX_ADDR = import.meta.env.VITE_DEX_ADDRESS
const TOKEN_ADDR = import.meta.env.VITE_TOKEN_ADDRESS

const getHasMetaMask = () => typeof (window as any).ethereum !== 'undefined'
// Choisit le provider injecté : préfère MetaMask si plusieurs providers sont présents
function getInjectedProvider(): any {
  const eth = (window as any).ethereum
  if (!eth) return null
  // some wallets (Coinbase Wallet) expose ethereum.providers array
  if (Array.isArray((eth as any).providers)) {
    const providers = (eth as any).providers
    const meta = providers.find((p: any) => p.isMetaMask)
    if (meta) return meta
    const coin = providers.find((p: any) => p.isCoinbaseWallet)
    if (coin) return coin
    return providers[0]
  }
  return eth
}

// Vérifie si le wallet est déjà autorisé (pas de prompt)
async function checkConnection(): Promise<boolean> {
  const injected = getInjectedProvider()
  if (!injected) return false
  try {
    const accounts = await injected.request({ method: 'eth_accounts' })
    if (Array.isArray(accounts) && accounts.length > 0) {
      // s'assurer que provider/signature sont prêts
      await initProvider().catch(() => null)
      if (provider) {
        try {
          signer = await provider.getSigner()
          account.value = accounts[0]
          const network = await provider.getNetwork()
          chainName.value = network?.name ?? null
        } catch (e) {
          // ignore signer errors
        }
      } else {
        account.value = accounts[0]
      }
      return true
    }
  } catch (e) {
    console.warn('checkConnection error', e)
  }
  return false
}

// Écoute les changements côté extension (compte / réseau)
function attachWalletListeners() {
  const injected = getInjectedProvider()
  if (!injected || typeof injected.on !== 'function') return
  try {
    injected.on('accountsChanged', async (accounts: string[]) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        account.value = accounts[0]
        await initProvider().catch(() => null)
        if (provider) signer = await provider.getSigner().catch(() => null)
      } else {
        account.value = null
        signer = null
      }
    })
    injected.on('chainChanged', async (_chainId: string) => {
      // re-init provider pour refléter le changement de réseau
      await initProvider().catch(() => null)
      if (provider) {
        const net = await provider.getNetwork().catch(() => null)
        chainName.value = net ? net.name : null
        if (account.value) signer = await provider.getSigner().catch(() => null)
      }
    })
  } catch (e) {
    console.warn('attachWalletListeners:', e)
  }
}

const account = ref<string | null>(null)
const connecting = ref(false)
const chainName = ref<string | null>(null)

let provider: any = null
let signer: any | null = null
let oracle: any | null = null
let dex: any | null = null
let token: any | null = null

const loading = ref(false)
const price = ref<number | null>(null)
const error = ref<string | null>(null)
const newPrice = ref<number | null>(null)
const updating = ref(false)
const updateMessage = ref<string | null>(null)
const updateError = ref<string | null>(null)
const ethToSpend = ref<string>('')
const tokensToSell = ref<string>('')
const buying = ref(false)
const selling = ref(false)
const swapError = ref<string | null>(null)
const swapMessage = ref<string | null>(null)

const accountShort = computed(() => account.value ? `${account.value.slice(0,6)}...${account.value.slice(-4)}` : '')
const priceDisplay = computed(() => (price.value !== null ? `${price.value} cents` : '—'))
const validNewPrice = computed(() => typeof newPrice.value === 'number' && newPrice.value >= 0)
const signerReady = computed(() => !!signer)
const oracleReady = computed(() => !!ORACLE_ADDR)
const dexReady = computed(() => !!DEX_ADDR)
const tokenReady = computed(() => !!TOKEN_ADDR)

const OracleABI = [
  { inputs: [], name: 'getPrice', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_newPrice', type: 'uint256' }], name: 'updatePrice', outputs: [], stateMutability: 'nonpayable', type: 'function' }
]

const SimpleDEXABI = [
  { inputs: [], name: 'buy', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'tokenAmount', type: 'uint256' }], name: 'sell', outputs: [], stateMutability: 'nonpayable', type: 'function' }
]

const ERC20ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' }
]

// Charger ethers dynamiquement avec timeout pour éviter les attentes infinies
function loadEthersIfNeeded(timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = (window as any).ethers
    if (existing) return resolve(existing)

    let settled = false
    const settleResolve = (eth: any) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(eth)
      }
    }
    const settleReject = (err: any) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(err)
      }
    }

    const timer = setTimeout(() => {
      settleReject(new Error('Timeout de chargement du CDN ethers'))
    }, timeoutMs)

    const already = document.querySelector('script[data-ethers-cdn]') as HTMLScriptElement | null
    if (already) {
      let tries = 0
      const maxTries = Math.ceil(timeoutMs / 100)
      const check = () => {
        const eth = (window as any).ethers
        if (eth) return settleResolve(eth)
        if (tries++ >= maxTries) return settleReject(new Error('Timeout en attente d\'ethers'))
        setTimeout(check, 100)
      }
      check()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.min.js'
    script.async = true
    script.setAttribute('data-ethers-cdn', 'true')
    script.onload = () => settleResolve((window as any).ethers)
    script.onerror = () => settleReject(new Error('Échec du chargement du CDN ethers'))
    document.head.appendChild(script)
  })
}

async function initProvider() {
  const eth = await loadEthersIfNeeded().catch(() => null)
  if (!eth) {
    console.error('Ethers.js non chargé depuis le CDN')
    provider = null
    return
  }
  const injected = getInjectedProvider()
  if (injected) {
    provider = new eth.BrowserProvider(injected)
  } else if (rpcUrl) {
    provider = new eth.JsonRpcProvider(rpcUrl)
  } else {
    provider = null
  }
}

async function connectWallet() {
  if (connecting.value) {
    console.log('Connexion déjà en cours...')
    return
  }

  try {
    connecting.value = true
    error.value = null

    const injected = getInjectedProvider()
    if (!injected) {
      throw new Error('MetaMask non détecté')
    }

    // si déjà autorisé, pas besoin d'ouvrir le prompt
    const accounts = await injected.request({ method: 'eth_accounts' }).catch(() => null)
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      try {
        await injected.request({ method: 'eth_requestAccounts' })
      } catch (e: any) {
        if (e?.code === -32002) {
          error.value = 'Une demande de connexion est déjà en attente dans MetaMask. Veuillez vérifier votre extension.'
          return
        }
        throw e
      }
    } else {
      // already connected: set account immediately
      account.value = accounts[0]
    }

    const eth = await loadEthersIfNeeded()
    if (!eth) throw new Error('Ethers non chargé')

    await initProvider()
    signer = await provider.getSigner()
    account.value = await signer.getAddress()
    const network = await provider.getNetwork()
    chainName.value = network.name

  } catch (e: any) {
    console.error('Erreur connexion:', e)
    error.value = e?.message || 'Erreur de connexion'
  } finally {
    connecting.value = false
  }
}

async function fetchPrice() {
  loading.value = true
  error.value = null
  try {
    console.log('Début fetch...')
    const response = await fetch('http://localhost:3000/oracle/price', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
      credentials: 'same-origin',
      mode: 'cors'
    })

    console.log('Réponse:', response)
    const text = await response.text()
    console.log('Contenu:', text)

    price.value = Number(text.replace('%', ''))
  } catch (e: any) {
    console.error('Erreur détaillée:', e)
    error.value = 'Erreur lors de la lecture du prix'
  } finally {
    loading.value = false
  }
}

async function updatePrice() {
  if (!validNewPrice.value) return
  updateError.value = null
  updateMessage.value = null
  updating.value = true
  try {
    const apiUrl = import.meta.env.VITE_ORACLE_UPDATE_URL ?? 'http://localhost:3000/oracle/update'
    const body = { price: Number(newPrice.value) }
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors'
    })
    if (!res.ok) throw new Error(`API update failed: ${res.status}`)
    // backend renvoie peut-être JSON { price: number } ou texte ; gérer les deux
    let parsed: any = null
    try { parsed = await res.json() } catch { parsed = await res.text().catch(() => null) }
    updateMessage.value = parsed?.price ? `Prix mis à jour via API: ${parsed.price}` : `Prix mis à jour via API`
    await fetchPrice()
  } catch (e: any) {
    updateError.value = e?.message || 'Erreur lors de la mise à jour du prix'
  } finally {
    updating.value = false
  }
}

async function buyTokens() {
  swapError.value = null
  swapMessage.value = null
  try {
    if (!signer || !DEX_ADDR) throw new Error('Signer/DEX non prêt')
    const eth = (window as any).ethers
    const value = eth.parseEther(ethToSpend.value || '0')
    if (value === 0n) throw new Error('Montant ETH invalide')
    const dx = new eth.Contract(DEX_ADDR, SimpleDEXABI, signer)
    const tx = await dx.buy({ value })
    await tx.wait()
    swapMessage.value = `Achat effectué. Tx: ${tx.hash}`
  } catch (e: any) {
    swapError.value = e?.message || 'Erreur achat'
  }
}

async function sellTokens() {
  swapError.value = null
  swapMessage.value = null
  try {
    if (!signer || !DEX_ADDR || !TOKEN_ADDR) throw new Error('Signer/DEX/TOKEN non prêt')
    const eth = (window as any).ethers
    const dx = new eth.Contract(DEX_ADDR, SimpleDEXABI, signer)
    const tk = new eth.Contract(TOKEN_ADDR, ERC20ABI, signer)
    const decimals: number = Number(await tk.decimals())
    const amountWei = eth.parseUnits(tokensToSell.value || '0', decimals)
    if (amountWei === 0n) throw new Error('Montant CTK invalide')
    const txApprove = await tk.approve(DEX_ADDR, amountWei)
    await txApprove.wait()
    const txSell = await dx.sell(amountWei)
    await txSell.wait()
    swapMessage.value = `Vente effectuée. Tx: ${txSell.hash}`
  } catch (e: any) {
    swapError.value = e?.message || 'Erreur vente'
  }
}

onMounted(() => {
  ;(async () => {
    try {
      await loadEthersIfNeeded()
      await initProvider()
      await checkConnection()
      attachWalletListeners()
      await fetchPrice()
    } catch (err: any) {
      error.value = err?.message || 'Ethers non chargé (CDN). Vérifiez votre connexion.'
    }
  })()
})
</script>

<style scoped>
</style>

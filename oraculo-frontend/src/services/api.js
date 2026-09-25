import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Ponto 1A: resolve no PRIMEIRO endpoint que responder com sucesso, em paralelo,
// em vez de aguardar o timeout de cada tentativa em sequencia (padrao N+1).
// Ponto 2A: aceita { signal, timeout } repassados a cada requisicao.
export const fetchFirstAvailable = async (endpoints, config = {}) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    throw new Error('fetchFirstAvailable: lista de endpoints vazia')
  }

  const attempts = endpoints.map((endpoint) =>
    api.get(endpoint, config).then((response) => ({ endpoint, data: response.data }))
  )

  // Promise.any resolve no primeiro fulfilled e so rejeita se TODOS falharem.
  return Promise.any(attempts)
}

export default api

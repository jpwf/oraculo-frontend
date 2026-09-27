import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fetchFirstAvailable = async (endpoints, config = {}) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    throw new Error('fetchFirstAvailable: lista de endpoints vazia')
  }

  const attempts = endpoints.map((endpoint) =>
    api.get(endpoint, config).then((response) => ({ endpoint, data: response.data }))
  )

  return Promise.any(attempts)
}

export default api

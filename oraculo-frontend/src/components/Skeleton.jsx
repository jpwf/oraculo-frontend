// Pequeno placeholder de loading (shimmer) para campos dependentes de request.
// Uso: <Skeleton loading={isLoading} width={60}>{valor}</Skeleton>
// Quando loading=true mostra o shimmer; senao renderiza o conteudo real.
export default function Skeleton({ loading, children, width = 48, height = '1em', inline = true }) {
  if (!loading) return children ?? null

  return (
    <span
      className="skeleton-shimmer"
      aria-busy="true"
      aria-live="polite"
      style={{
        display: inline ? 'inline-block' : 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        verticalAlign: 'middle',
      }}
    />
  )
}

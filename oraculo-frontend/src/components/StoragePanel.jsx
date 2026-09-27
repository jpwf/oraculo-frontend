import BatteryGauge from './BatteryGauge'
import Skeleton from './Skeleton'

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

// Painel "Estado de Armazenamento (BESS)" (foto 1, coluna direita).
// Usa a bateria vertical SVG + metricas de absorcao/recuperado/recarga.
export default function StoragePanel({ storage, loading = false }) {
  const s = storage || {}

  return (
    <aside className="storage-panel">
      <div className="storage-header">
        <div className="storage-title-wrap">
          <span className="storage-bullet" />
          <span className="storage-title">ESTADO DE ARMAZENAMENTO (BESS)</span>
        </div>
        <span className="storage-region-tag">{s.regiaoTag || 'Nordeste (NE)'}</span>
      </div>

      <div className="storage-sub">
        <span className="storage-sub-loc">{s.subestacao}</span>
        <span className="storage-avail">{s.disponibilidade}</span>
      </div>

      <div className="storage-capacity">
        <span>Capacidade Total:</span>
        <strong>
          <Skeleton loading={loading} width={70}>{Number(s.capacidadeTotal || 0).toLocaleString('pt-BR')} MWh</Skeleton>
        </strong>
      </div>

      <div className="storage-battery-block">
        <div className="storage-battery-info">
          <span className="storage-battery-label">NÍVEL DE CARGA DO BANCO DE BATERIAS</span>
          <div className="storage-battery-stats">
            <span className="storage-soc">
              <Skeleton loading={loading} width={40}>{s.nivelCarga}%</Skeleton>
            </span>
            <span className="storage-absorb">(+{s.absorcao} MWh)</span>
          </div>
        </div>

        <div className="storage-battery-svg">
          <BatteryGauge level={s.nivelCarga} allocation={s.alocacaoPotencial} />
        </div>

        <div className="storage-battery-legend">
          <span><i className="dot-charge" /> Carga Atual: {s.cargaAtual} MWh</span>
          <span><i className="dot-absorb" /> Absorção: +{s.absorcao} MWh</span>
        </div>
      </div>

      <div className="storage-metrics">
        <div className="storage-metric-row">
          <span className="storage-metric-label"><i className="m-dot green" /> Volume Esperado de Absorção<small>Mitigação de Curtailment</small></span>
          <strong className="storage-metric-value">
            <Skeleton loading={loading} width={90}>{s.volumeEsperadoLabel}</Skeleton>
          </strong>
        </div>
        <div className="storage-metric-row">
          <span className="storage-metric-label"><i className="m-dot green" /> Valor Econômico Recuperado<small>Arbitragem / Custo Sombra</small></span>
          <strong className="storage-metric-value money">
            <Skeleton loading={loading} width={110}>{formatBRL(s.valorRecuperado)}</Skeleton>
          </strong>
        </div>
        <div className="storage-metric-row">
          <span className="storage-metric-label"><i className="m-dot amber" /> Próxima Janela de Recarga</span>
          <strong className="storage-metric-value">
            <Skeleton loading={loading} width={140}>{s.proximaRecarga}</Skeleton>
          </strong>
        </div>
        <div className="storage-metric-row">
          <span className="storage-metric-label"><i className="m-dot" /> Taxa C-Rate & Ciclos</span>
          <strong className="storage-metric-value">
            <Skeleton loading={loading} width={130}>{s.cRate}</Skeleton>
          </strong>
        </div>
      </div>

      <div className="storage-footer">
        <span className="storage-ready">Prontidão VPP: <strong>{s.prontidaoVpp}</strong></span>
        <button type="button" className="storage-dispatch-btn">DESPACHAR BESS</button>
      </div>
    </aside>
  )
}

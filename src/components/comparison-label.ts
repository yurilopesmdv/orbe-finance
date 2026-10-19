import type { ComparisonReason } from '../domain/comparison.ts';
export function percentageLabel(basisPoints: number | null, hidden: boolean): string {
  if (hidden) return 'Percentual oculto';
  if (basisPoints === null) return 'Percentual indisponível';
  if (!Number.isSafeInteger(basisPoints)) return 'Percentual indisponível';
  const value = BigInt(basisPoints), magnitude = value < 0n ? -value : value;
  const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(magnitude / 100n));
  return `${value < 0n ? '-' : ''}${whole},${(magnitude % 100n).toString().padStart(2, '0')}%`;
}
export const comparisonReasons: Record<ComparisonReason, string> = {
  missing_observation: 'Não há histórico para um dos meses neste cenário. Não estamos tratando ausência como zero.',
  missing_value: 'Um dos meses não tem valor conhecido para esta seleção.',
  undated_period: 'A data de observação não é conhecida para os dois meses.',
  open_period: 'Um dos meses ainda estava em andamento na data da observação. O percentual fica indisponível.',
  partial_period: 'A cobertura de um dos meses é parcial. Não é possível comparar percentuais com segurança.',
  base_non_positive: 'A base anterior é zero ou negativa. O percentual fica indisponível.',
  negative_current: 'O consumo líquido atual é negativo, por exemplo por estornos. Não o apresentamos como uma redução percentual comum.',
  out_of_range: 'O resultado excede a faixa de precisão disponível para esta comparação.',
};

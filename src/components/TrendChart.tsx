import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { DashboardData } from '../services/webhookService';

interface Props {
  data: DashboardData[];
  threshold?: number;
}

function getScore(answer?: string | number): number {
  if (!answer) return 0;
  const ans = String(answer).toLowerCase().replace(/\./g, '').trim();
  if (ans.includes('casi todos los días')) return 3;
  if (ans.includes('más de la mitad')) return 2;
  if (ans.includes('algunos días')) return 1;
  return 0;
}

export const TrendChart: React.FC<Props> = ({ data, threshold = 2 }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar las barras de 0 a 1 en 1 segundo
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const stats = useMemo(() => {
    const groups: Record<string, { total: number, A: number, B: number, C: number }> = {
      'Total': { total: 0, A: 0, B: 0, C: 0 },
      'Escolar': { total: 0, A: 0, B: 0, C: 0 },
      'Universitario': { total: 0, A: 0, B: 0, C: 0 },
    };

    data.forEach(item => {
      const animo = getScore(item.q1) + getScore(item.q2);
      const ansiedad = getScore(item.q3) + getScore(item.q4);
      const sobrecarga = getScore(item.q5) + getScore(item.q6);

      const hasA = animo >= threshold;
      const hasB = ansiedad >= threshold;
      const hasC = sobrecarga >= threshold;

      const groupName = item.target.toLowerCase() === 'escolar' ? 'Escolar' : 
                        item.target.toLowerCase() === 'universitario' ? 'Universitario' : null;

      if (groupName) {
        groups[groupName].total++;
        if (hasA) groups[groupName].A++;
        if (hasB) groups[groupName].B++;
        if (hasC) groups[groupName].C++;
      }

      groups['Total'].total++;
      if (hasA) groups['Total'].A++;
      if (hasB) groups['Total'].B++;
      if (hasC) groups['Total'].C++;
    });

    const results = [
      {
        label: 'Total',
        pA: groups['Total'].total ? groups['Total'].A / groups['Total'].total : 0,
        pB: groups['Total'].total ? groups['Total'].B / groups['Total'].total : 0,
        pC: groups['Total'].total ? groups['Total'].C / groups['Total'].total : 0,
      },
      {
        label: 'Escolar',
        pA: groups['Escolar'].total ? groups['Escolar'].A / groups['Escolar'].total : 0,
        pB: groups['Escolar'].total ? groups['Escolar'].B / groups['Escolar'].total : 0,
        pC: groups['Escolar'].total ? groups['Escolar'].C / groups['Escolar'].total : 0,
      },
      {
        label: 'Universitario',
        pA: groups['Universitario'].total ? groups['Universitario'].A / groups['Universitario'].total : 0,
        pB: groups['Universitario'].total ? groups['Universitario'].B / groups['Universitario'].total : 0,
        pC: groups['Universitario'].total ? groups['Universitario'].C / groups['Universitario'].total : 0,
      }
    ];

    // Calcular conclusiones automáticas
    let maxDiffText = "";
    let highlightTitle = "";
    let highlightSubtitle = "";

    const escolarStress = results.find(r => r.label === 'Escolar')?.pC || 0;
    const uniStress = results.find(r => r.label === 'Universitario')?.pC || 0;

    if (Math.abs(escolarStress - uniStress) > 0.05) {
      const higher = escolarStress > uniStress ? 'escolares' : 'universitarios';
      const maxVal = Math.max(escolarStress, uniStress);
      const minVal = Math.min(escolarStress, uniStress);
      highlightTitle = `${Math.round(minVal * 100)}% → ${Math.round(maxVal * 100)}%`;
      highlightSubtitle = `El estrés es significativamente mayor en ${higher}.`;
      maxDiffText = `Diferencia de +${Math.round((maxVal - minVal) * 100)} pp entre grupos en el nivel de estrés.`;
    } else {
      const totalAnxiety = results.find(r => r.label === 'Total')?.pB || 0;
      highlightTitle = `${Math.round(totalAnxiety * 100)}%`;
      highlightSubtitle = `Ansiedad global promedio en la muestra.`;
      maxDiffText = "Los niveles se mantienen relativamente estables entre escolares y universitarios.";
    }

    return { results, highlightTitle, highlightSubtitle, maxDiffText };
  }, [data, threshold]);

  const MAX_HEIGHT = 200; // altura maxima de la barra en px

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Los indicadores varían por grupo; análisis automático</Text>
      
      <View style={styles.row}>
        {/* Gráfico de Barras */}
        <View style={styles.chartContainer}>
          {/* Lineas de fondo (Grid) */}
          <View style={styles.gridContainer}>
            {[40, 30, 20, 10, 0].map(val => (
              <View key={val} style={styles.gridLine}>
                <Text style={styles.gridLabel}>{val}%</Text>
                <View style={styles.gridDash} />
              </View>
            ))}
          </View>

          {/* Barras */}
          <View style={styles.barsArea}>
            {stats.results.map(group => (
              <View key={group.label} style={styles.groupContainer}>
                <View style={styles.barWrapper}>
                  {/* Depresión */}
                  <View style={styles.singleBarContainer}>
                    <Animated.Text style={[styles.barValueText, { opacity: animValue }]}>
                      {group.pA > 0 ? (group.pA).toFixed(2).replace(/^0+/, '') : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#ef4444', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pA * 2 * MAX_HEIGHT] // multiplicamos por 2 asumiendo un max 50% = 100% de altura
                    }) }]} />
                  </View>
                  
                  {/* Ansiedad */}
                  <View style={styles.singleBarContainer}>
                    <Animated.Text style={[styles.barValueText, { opacity: animValue }]}>
                      {group.pB > 0 ? (group.pB).toFixed(2).replace(/^0+/, '') : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#3b82f6', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pB * 2 * MAX_HEIGHT]
                    }) }]} />
                  </View>

                  {/* Estrés */}
                  <View style={styles.singleBarContainer}>
                    <Animated.Text style={[styles.barValueText, { opacity: animValue }]}>
                      {group.pC > 0 ? (group.pC).toFixed(2).replace(/^0+/, '') : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#10b981', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pC * 2 * MAX_HEIGHT]
                    }) }]} />
                  </View>
                </View>
                <Text style={styles.groupLabel}>{group.label}</Text>
              </View>
            ))}
          </View>

          {/* Leyenda */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Depresión</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} /><Text style={styles.legendText}>Ansiedad</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#10b981' }]} /><Text style={styles.legendText}>Estrés</Text></View>
          </View>
        </View>

        {/* Panel de Lectura */}
        <View style={styles.insightContainer}>
          <Text style={styles.insightTitle}>Lectura por grupo</Text>
          
          <Text style={styles.insightHighlight}>{stats.highlightTitle}</Text>
          <Text style={styles.insightDesc}>{stats.highlightSubtitle}</Text>

          <Text style={styles.insightSubHighlight}>Dato Clave</Text>
          <Text style={styles.insightDesc}>{stats.maxDiffText}</Text>
          
          <Text style={styles.insightFootnote}>
            La tendencia se calcula automáticamente en base a los datos actuales recolectados.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
  },
  row: {
    flexDirection: Dimensions.get('window').width > 800 ? 'row' : 'column',
    gap: 30,
  },
  chartContainer: {
    flex: 2,
    position: 'relative',
    height: 280,
  },
  gridContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    width: 30,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
    marginRight: 8,
  },
  gridDash: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  barsArea: {
    flexDirection: 'row',
    marginLeft: 38,
    marginRight: 10,
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  groupContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 200,
  },
  singleBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 25,
  },
  barValueText: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 4,
    fontWeight: '600',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  groupLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  insightContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  insightHighlight: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10b981',
    marginBottom: 8,
  },
  insightSubHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3b82f6',
    marginTop: 24,
    marginBottom: 8,
  },
  insightDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  insightFootnote: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 'auto',
    paddingTop: 20,
  }
});

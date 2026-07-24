import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { DashboardData } from '../services/webhookService';

interface Props {
  data: DashboardData[];
  threshold?: number;
}

function getScore(answer?: string | number): number {
  if (answer === undefined || answer === null || answer === '') return 0;
  const ansStr = String(answer).toLowerCase().replace(/\./g, '').trim();
  
  if (ansStr === '3' || ansStr.includes('casi todos los días')) return 3;
  if (ansStr === '2' || ansStr.includes('más de la mitad')) return 2;
  if (ansStr === '1' || ansStr.includes('algunos días')) return 1;
  return 0;
}

export const TrendChart: React.FC<Props> = ({ data, threshold = 2 }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [groupBy, setGroupBy] = useState<'target'|'sexo'|'edad'|'curso'|'comuna'>('target');

  useEffect(() => {
    // Animar las barras de 0 a 1 en 1 segundo
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [groupBy]);

  const stats = useMemo(() => {
    const groups: Record<string, { total: number, A: number, B: number, C: number }> = {
      'Total': { total: 0, A: 0, B: 0, C: 0 },
    };

    data.forEach(item => {
      const animo = getScore(item.q1) + getScore(item.q2);
      const ansiedad = getScore(item.q3) + getScore(item.q4);
      const sobrecarga = getScore(item.q5) + getScore(item.q6);

      const hasA = animo >= threshold;
      const hasB = ansiedad >= threshold;
      const hasC = sobrecarga >= threshold;

      let groupName = (item.target || 'N/A').toString();
      if (groupBy === 'sexo') groupName = String(item.sexo || 'N/A').trim() || 'N/A';
      else if (groupBy === 'edad') groupName = String(item.edad || 'N/A').trim() || 'N/A';
      else if (groupBy === 'curso') groupName = String(item.curso || 'N/A').trim() || 'N/A';
      else if (groupBy === 'comuna') groupName = String(item.comuna || 'N/A').trim() || 'N/A';
      
      if (groupBy === 'target') groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase();

      if (!groups[groupName]) {
        groups[groupName] = { total: 0, A: 0, B: 0, C: 0 };
      }

      groups[groupName].total++;
      if (hasA) groups[groupName].A++;
      if (hasB) groups[groupName].B++;
      if (hasC) groups[groupName].C++;

      groups['Total'].total++;
      if (hasA) groups['Total'].A++;
      if (hasB) groups['Total'].B++;
      if (hasC) groups['Total'].C++;
    });

    const results = Object.keys(groups)
      // Ordenar: Total primero, luego el resto alfabéticamente
      .sort((a, b) => a === 'Total' ? -1 : b === 'Total' ? 1 : a.localeCompare(b))
      .map(k => ({
        label: k,
        pA: groups[k].total ? groups[k].A / groups[k].total : 0,
        pB: groups[k].total ? groups[k].B / groups[k].total : 0,
        pC: groups[k].total ? groups[k].C / groups[k].total : 0,
    }));

    // Calcular conclusiones automáticas
    let maxDiffText = "";
    let highlightTitle = "";
    let highlightSubtitle = "";

    // Simplemente buscamos el máximo de C (Estrés) excluyendo "Total" para hacer un comentario
    const others = results.filter(r => r.label !== 'Total');
    if (others.length > 1) {
      const maxStressGroup = others.reduce((prev, current) => (prev.pC > current.pC) ? prev : current);
      const minStressGroup = others.reduce((prev, current) => (prev.pC < current.pC) ? prev : current);

      if (maxStressGroup.pC - minStressGroup.pC > 0.05) {
        highlightTitle = `${Math.round(minStressGroup.pC * 100)}% → ${Math.round(maxStressGroup.pC * 100)}%`;
        highlightSubtitle = `El estrés es significativamente mayor en el grupo "${maxStressGroup.label}".`;
        maxDiffText = `Diferencia de +${Math.round((maxStressGroup.pC - minStressGroup.pC) * 100)} pp entre grupos en el nivel de estrés.`;
      } else {
        const totalAnxiety = results.find(r => r.label === 'Total')?.pB || 0;
        highlightTitle = `${Math.round(totalAnxiety * 100)}%`;
        highlightSubtitle = `Ansiedad global promedio en la muestra.`;
        maxDiffText = "Los niveles se mantienen estables en los distintos subgrupos.";
      }
    } else {
      highlightTitle = "—";
      highlightSubtitle = "Sin datos suficientes";
      maxDiffText = "";
    }

    return { results, highlightTitle, highlightSubtitle, maxDiffText };
  }, [data, threshold, groupBy]);

  const MAX_HEIGHT = 200; // altura maxima de la barra en px

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Los indicadores varían por grupo; análisis automático</Text>

      <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 8, flexWrap: 'wrap'}}>
        {[
          { id: 'target', label: 'Público' },
          { id: 'sexo', label: 'Sexo' },
          { id: 'edad', label: 'Edad' },
          { id: 'curso', label: 'Curso' },
          { id: 'comuna', label: 'Comuna' }
        ].map(opt => (
          <TouchableOpacity 
            key={opt.id}
            onPress={() => setGroupBy(opt.id as any)} 
            style={{
              paddingVertical: 6, paddingHorizontal: 12, 
              backgroundColor: groupBy === opt.id ? '#3b82f6' : '#f1f5f9', 
              borderRadius: 20
            }}>
            <Text style={{fontWeight: '600', fontSize: 13, color: groupBy === opt.id ? '#fff' : '#475569'}}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.row}>
        {/* Gráfico de Barras */}
        <View style={styles.chartContainer}>
          {/* Lineas de fondo (Grid) */}
          <View style={styles.gridContainer}>
            {[100, 80, 60, 40, 20, 0].map(val => (
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
                      {group.pA > 0 ? `${Math.round(group.pA * 100)}%` : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#ef4444', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pA * MAX_HEIGHT] // Max 1.0 (100%) = MAX_HEIGHT
                    }) }]} />
                  </View>
                  
                  {/* Ansiedad */}
                  <View style={styles.singleBarContainer}>
                    <Animated.Text style={[styles.barValueText, { opacity: animValue }]}>
                      {group.pB > 0 ? `${Math.round(group.pB * 100)}%` : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#3b82f6', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pB * MAX_HEIGHT]
                    }) }]} />
                  </View>

                  {/* Estrés */}
                  <View style={styles.singleBarContainer}>
                    <Animated.Text style={[styles.barValueText, { opacity: animValue }]}>
                      {group.pC > 0 ? `${Math.round(group.pC * 100)}%` : ''}
                    </Animated.Text>
                    <Animated.View style={[styles.bar, { backgroundColor: '#10b981', height: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, group.pC * MAX_HEIGHT]
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

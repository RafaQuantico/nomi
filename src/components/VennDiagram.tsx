import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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

export const VennDiagram: React.FC<Props> = ({ data, threshold = 2 }) => {
  const [hoveredCircle, setHoveredCircle] = useState<string | null>(null);
  const [visualizarSexo, setVisualizarSexo] = useState(false);

  const { stats, percentages, totalValid } = useMemo(() => {
    const createStats = () => ({ total: 0, sexo: {} as Record<string, number>, curso: {} as Record<string, number> });
    
    const s = {
      A: createStats(), B: createStats(), C: createStats(),
      AB: createStats(), AC: createStats(), BC: createStats(),
      ABC: createStats(), none: createStats(),
      totalA: createStats(), totalB: createStats(), totalC: createStats()
    };

    const addStat = (statObj: any, item: DashboardData) => {
      statObj.total++;
      const sVal = (item.sexo || 'N/A').toString().trim() || 'N/A';
      const cVal = (item.curso || 'N/A').toString().trim() || 'N/A';
      statObj.sexo[sVal] = (statObj.sexo[sVal] || 0) + 1;
      statObj.curso[cVal] = (statObj.curso[cVal] || 0) + 1;
    };

    data.forEach(item => {
      const animo = getScore(item.q1) + getScore(item.q2);
      const ansiedad = getScore(item.q3) + getScore(item.q4);
      const sobrecarga = getScore(item.q5) + getScore(item.q6);

      const hasA = animo >= threshold;
      const hasB = ansiedad >= threshold;
      const hasC = sobrecarga >= threshold;

      if (hasA) addStat(s.totalA, item);
      if (hasB) addStat(s.totalB, item);
      if (hasC) addStat(s.totalC, item);

      if (hasA && hasB && hasC) addStat(s.ABC, item);
      else if (hasA && hasB) addStat(s.AB, item);
      else if (hasA && hasC) addStat(s.AC, item);
      else if (hasB && hasC) addStat(s.BC, item);
      else if (hasA) addStat(s.A, item);
      else if (hasB) addStat(s.B, item);
      else if (hasC) addStat(s.C, item);
      else addStat(s.none, item);
    });

    const total = data.length;
    const percentages = {
      A: total > 0 ? Math.round((s.totalA.total / total) * 100) : 0,
      B: total > 0 ? Math.round((s.totalB.total / total) * 100) : 0,
      C: total > 0 ? Math.round((s.totalC.total / total) * 100) : 0,
      none: total > 0 ? Math.round((s.none.total / total) * 100) : 0,
    };

    return { stats: s, percentages, totalValid: total };
  }, [data, threshold]);

  const renderDescription = () => {
    const formatBreakdown = (sObj: any) => {
      if (!sObj || sObj.total === 0) return '';
      const cursos = Object.entries(sObj.curso).map(([c, n]) => `${c}: ${n}`).join(', ');
      return cursos ? `\n\nDesglose por Curso:\n${cursos}` : '';
    };

    switch (hoveredCircle) {
      case 'A':
        return `Depresión: ${stats.totalA.total} estudiantes reportan síntomas frecuentes de desánimo o tristeza.${formatBreakdown(stats.totalA)}`;
      case 'B':
        return `Ansiedad: ${stats.totalB.total} estudiantes reportan nerviosismo o preocupación recurrente.${formatBreakdown(stats.totalB)}`;
      case 'C':
        return `Estrés: ${stats.totalC.total} estudiantes reportan alta sobrecarga o dificultad para relajarse.${formatBreakdown(stats.totalC)}`;
      case 'ABC':
        return `Malestar Emocional: ${stats.ABC.total} estudiantes presentan las 3 dimensiones de riesgo simultáneamente. Requieren atención prioritaria.${formatBreakdown(stats.ABC)}`;
      default:
        return 'Pasa el cursor sobre los círculos para ver más detalles.';
    }
  };

  const renderCount = (sObj: any) => {
    if (!sObj || sObj.total === 0) return '';
    if (!visualizarSexo) return sObj.total.toString();
    
    // Si estamos visualizando por sexo, devolvemos un string con saltos de línea (H: 2 \n M: 3)
    return Object.entries(sObj.sexo)
      .filter(([_, v]) => (v as number) > 0)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() || '?'}: ${v}`)
      .join('\n');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Salud mental en usuarios</Text>
      <Text style={styles.subtitle}>Superposición de dimensiones de riesgo</Text>

      <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 20}}>
        <Pressable 
          onPress={() => setVisualizarSexo(!visualizarSexo)} 
          style={{paddingVertical: 6, paddingHorizontal: 16, backgroundColor: visualizarSexo ? '#3b82f6' : '#f1f5f9', borderRadius: 20}}>
          <Text style={{fontWeight: '600', fontSize: 13, color: visualizarSexo ? '#fff' : '#475569'}}>
            {visualizarSexo ? '✓ Desglose por Sexo' : 'Ver desglose por Sexo'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.contentRow}>
        {/* Lado Izquierdo: Diagrama de Venn (Valores Absolutos) */}
        <View style={styles.diagramSection}>
          <Text style={styles.diagramTitle}>Casos Totales</Text>
          <View style={styles.diagramContainer}>
            {/* Círculos Interactivos */}
            <Pressable 
              style={[styles.circle, styles.circleA, hoveredCircle === 'A' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('A')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelA]} pointerEvents="none">DEPRESIÓN</Text>
            
            <Pressable 
              style={[styles.circle, styles.circleB, hoveredCircle === 'B' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('B')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelB]} pointerEvents="none">ANSIEDAD</Text>
            
            <Pressable 
              style={[styles.circle, styles.circleC, hoveredCircle === 'C' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('C')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelC]} pointerEvents="none">ESTRÉS</Text>

            {/* Conteos puros */}
            <Text style={[styles.count, styles.countA, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.A)}</Text>
            <Text style={[styles.count, styles.countB, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.B)}</Text>
            <Text style={[styles.count, styles.countC, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.C)}</Text>
            
            {/* Intersecciones de a 2 */}
            <Text style={[styles.count, styles.countAB, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.AB)}</Text>
            <Text style={[styles.count, styles.countAC, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.AC)}</Text>
            <Text style={[styles.count, styles.countBC, visualizarSexo && {fontSize: 10, lineHeight: 12}]} pointerEvents="none">{renderCount(stats.BC)}</Text>
            
            {/* Centro (Los 3) */}
            <Pressable 
              style={styles.countABCContainer}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('ABC')} onHoverOut={() => setHoveredCircle(null)}
            >
                <Text style={[styles.countABC, visualizarSexo && {fontSize: 12, lineHeight: 14}]}>{stats.ABC.total > 0 ? renderCount(stats.ABC) : '0'}</Text>
                <Text style={styles.labelABC}>Malestar{"\n"}Emocional</Text>
            </Pressable>
          </View>
        </View>

        {/* Lado Derecho: Diagrama de Venn (Porcentajes) */}
        <View style={styles.diagramSection}>
          <Text style={styles.diagramTitle}>Porcentajes sobre el total</Text>
          <View style={styles.diagramContainer}>
            {/* Círculos Interactivos */}
            <Pressable 
              style={[styles.circle, styles.circleA, hoveredCircle === 'A' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('A')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelA]} pointerEvents="none">DEPRESIÓN</Text>
            
            <Pressable 
              style={[styles.circle, styles.circleB, hoveredCircle === 'B' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('B')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelB]} pointerEvents="none">ANSIEDAD</Text>
            
            <Pressable 
              style={[styles.circle, styles.circleC, hoveredCircle === 'C' && styles.circleHovered]}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('C')} onHoverOut={() => setHoveredCircle(null)}
            />
            <Text style={[styles.label, styles.labelC]} pointerEvents="none">ESTRÉS</Text>

            {/* Conteos puros */}
            <Text style={[styles.count, styles.countA]} pointerEvents="none">{stats.A.total > 0 ? `${Math.round((stats.A.total / totalValid) * 100)}%` : ''}</Text>
            <Text style={[styles.count, styles.countB]} pointerEvents="none">{stats.B.total > 0 ? `${Math.round((stats.B.total / totalValid) * 100)}%` : ''}</Text>
            <Text style={[styles.count, styles.countC]} pointerEvents="none">{stats.C.total > 0 ? `${Math.round((stats.C.total / totalValid) * 100)}%` : ''}</Text>
            
            {/* Intersecciones de a 2 */}
            <Text style={[styles.count, styles.countAB]} pointerEvents="none">{stats.AB.total > 0 ? `${Math.round((stats.AB.total / totalValid) * 100)}%` : ''}</Text>
            <Text style={[styles.count, styles.countAC]} pointerEvents="none">{stats.AC.total > 0 ? `${Math.round((stats.AC.total / totalValid) * 100)}%` : ''}</Text>
            <Text style={[styles.count, styles.countBC]} pointerEvents="none">{stats.BC.total > 0 ? `${Math.round((stats.BC.total / totalValid) * 100)}%` : ''}</Text>
            
            {/* Centro (Los 3) */}
            <Pressable 
              style={styles.countABCContainer}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('ABC')} onHoverOut={() => setHoveredCircle(null)}
            >
                <Text style={styles.countABC}>{stats.ABC.total > 0 ? `${Math.round((stats.ABC.total / totalValid) * 100)}%` : '0%'}</Text>
                <Text style={styles.labelABC}>Malestar{"\n"}Emocional</Text>
            </Pressable>
          </View>
        </View>

      </View>

      {/* Caja de información de Hover general */}
      <View style={styles.hoverInfoBox}>
        <Text style={styles.hoverInfoText}>{renderDescription()}</Text>
      </View>

      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>
          Total analizados: {totalValid}. Sin riesgo significativo: {percentages.none}% ({stats.none.total})
        </Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  contentRow: {
    flexDirection: Dimensions.get('window').width > 700 ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  diagramSection: {
    alignItems: 'center',
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 20,
  },
  diagramContainer: {
    width: 300,
    height: 310,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  circleHovered: {
    transform: [{ scale: 1.05 }],
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  circleA: { 
    left: 10,
    top: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.4)', // Blue
  },
  circleB: { 
    left: 110,
    top: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.4)', // Emerald
  },
  circleC: { 
    left: 60,
    top: 110,
    backgroundColor: 'rgba(245, 158, 11, 0.4)', // Amber
  },
  label: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 0.5,
  },
  labelA: {
    left: 15,
    top: 5,
    color: '#1e40af',
  },
  labelB: {
    left: 215,
    top: 5,
    color: '#065f46',
  },
  labelC: {
    left: 125,
    top: 295,
    color: '#b45309',
  },
  count: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countA: { left: 65, top: 80 },
  countB: { left: 220, top: 80 },
  countC: { left: 145, top: 225 },
  
  countAB: { left: 145, top: 65 },
  countAC: { left: 85, top: 160 },
  countBC: { left: 205, top: 160 },
  
  countABCContainer: {
    position: 'absolute',
    left: 120,
    top: 125,
    alignItems: 'center',
    width: 60,
    zIndex: 20,
    padding: 5,
  },
  countABC: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  labelABC: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
    marginTop: -2,
    lineHeight: 10,
  },
  hoverInfoBox: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minHeight: 60,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hoverInfoText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '500',
  },
  legendContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500'
  }
});

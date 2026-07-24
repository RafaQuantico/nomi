import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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

export const VennDiagram: React.FC<Props> = ({ data, threshold = 2 }) => {
  const [hoveredCircle, setHoveredCircle] = useState<string | null>(null);

  const { counts, percentages, totalValid } = useMemo(() => {
    let A = 0, B = 0, C = 0;
    let AB = 0, AC = 0, BC = 0;
    let ABC = 0;
    let none = 0;

    let totalA = 0; // Total Depresión
    let totalB = 0; // Total Ansiedad
    let totalC = 0; // Total Estrés

    data.forEach(item => {
      const animo = getScore(item.q1) + getScore(item.q2);
      const ansiedad = getScore(item.q3) + getScore(item.q4);
      const sobrecarga = getScore(item.q5) + getScore(item.q6);

      const hasA = animo >= threshold;
      const hasB = ansiedad >= threshold;
      const hasC = sobrecarga >= threshold;

      if (hasA) totalA++;
      if (hasB) totalB++;
      if (hasC) totalC++;

      if (hasA && hasB && hasC) ABC++;
      else if (hasA && hasB) AB++;
      else if (hasA && hasC) AC++;
      else if (hasB && hasC) BC++;
      else if (hasA) A++;
      else if (hasB) B++;
      else if (hasC) C++;
      else none++;
    });

    const total = data.length;
    const percentages = {
      A: total > 0 ? Math.round((totalA / total) * 100) : 0,
      B: total > 0 ? Math.round((totalB / total) * 100) : 0,
      C: total > 0 ? Math.round((totalC / total) * 100) : 0,
      none: total > 0 ? Math.round((none / total) * 100) : 0,
    };

    return { 
      counts: { A, B, C, AB, AC, BC, ABC, none, totalA, totalB, totalC },
      percentages,
      totalValid: total
    };
  }, [data, threshold]);

  const renderDescription = () => {
    switch (hoveredCircle) {
      case 'A':
        return `Depresión: ${counts.totalA} estudiantes reportan síntomas frecuentes de desánimo o tristeza.`;
      case 'B':
        return `Ansiedad: ${counts.totalB} estudiantes reportan nerviosismo o preocupación recurrente.`;
      case 'C':
        return `Estrés: ${counts.totalC} estudiantes reportan alta sobrecarga o dificultad para relajarse.`;
      case 'ABC':
        return `Malestar Emocional: ${counts.ABC} estudiantes presentan las 3 dimensiones de riesgo simultáneamente. Requieren atención prioritaria.`;
      default:
        return 'Pasa el cursor sobre los círculos para ver más detalles.';
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Salud mental en usuarios</Text>
      <Text style={styles.subtitle}>Superposición de dimensiones de riesgo</Text>

      <View style={styles.contentRow}>
        {/* Lado Izquierdo: Diagrama de Venn */}
        <View style={styles.diagramSection}>
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
            <Text style={[styles.count, styles.countA]} pointerEvents="none">{counts.A > 0 ? counts.A : ''}</Text>
            <Text style={[styles.count, styles.countB]} pointerEvents="none">{counts.B > 0 ? counts.B : ''}</Text>
            <Text style={[styles.count, styles.countC]} pointerEvents="none">{counts.C > 0 ? counts.C : ''}</Text>
            
            {/* Intersecciones de a 2 */}
            <Text style={[styles.count, styles.countAB]} pointerEvents="none">{counts.AB > 0 ? counts.AB : ''}</Text>
            <Text style={[styles.count, styles.countAC]} pointerEvents="none">{counts.AC > 0 ? counts.AC : ''}</Text>
            <Text style={[styles.count, styles.countBC]} pointerEvents="none">{counts.BC > 0 ? counts.BC : ''}</Text>
            
            {/* Centro (Los 3) */}
            <Pressable 
              style={styles.countABCContainer}
              //@ts-ignore
              onHoverIn={() => setHoveredCircle('ABC')} onHoverOut={() => setHoveredCircle(null)}
            >
                <Text style={styles.countABC}>{counts.ABC > 0 ? counts.ABC : '0'}</Text>
                <Text style={styles.labelABC}>Malestar{"\n"}Emocional</Text>
            </Pressable>
          </View>
          
          <View style={styles.hoverInfoBox}>
            <Text style={styles.hoverInfoText}>{renderDescription()}</Text>
          </View>
        </View>

        {/* Lado Derecho: Porcentajes */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Porcentajes de Riesgo</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.statLabel}>Depresión</Text>
              <Text style={styles.statValue}>{percentages.A}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${percentages.A}%` as any, backgroundColor: '#3b82f6' }]} />
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.statLabel}>Ansiedad</Text>
              <Text style={styles.statValue}>{percentages.B}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${percentages.B}%` as any, backgroundColor: '#10b981' }]} />
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.statLabel}>Estrés</Text>
              <Text style={styles.statValue}>{percentages.C}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${percentages.C}%` as any, backgroundColor: '#f59e0b' }]} />
            </View>
          </View>

          <View style={[styles.statRow, { marginTop: 10 }]}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#9ca3af' }]} />
              <Text style={styles.statLabel}>Sin riesgo significativo</Text>
              <Text style={styles.statValue}>{percentages.none}%</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <Text style={styles.legendText}>
              Total analizados: {totalValid}
            </Text>
            <Text style={styles.legendText}>
              * Los alumnos pueden estar en múltiples categorías.
            </Text>
          </View>
        </View>

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
    borderColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  contentRow: {
    flexDirection: Dimensions.get('window').width > 700 ? 'row' : 'column',
    alignItems: 'flex-start',
    gap: 40,
  },
  diagramSection: {
    alignItems: 'center',
    flex: 1,
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
    transition: 'all 0.2s ease',
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
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    minHeight: 60,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hoverInfoText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsSection: {
    flex: 1,
    minWidth: 250,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  legendContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  }
});

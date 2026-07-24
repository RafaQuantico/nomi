import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardData } from '../services/webhookService';

interface Props {
  data: DashboardData[];
  threshold?: number; // Puntaje mínimo para entrar en un círculo
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
  const counts = useMemo(() => {
    let A = 0, B = 0, C = 0; // Solo uno
    let AB = 0, AC = 0, BC = 0; // Intersecciones de a dos
    let ABC = 0; // Intersección de los tres
    let none = 0;

    data.forEach(item => {
      // Las preguntas en la planilla suelen estar mapeadas así según el script
      const animo = getScore(item.q1) + getScore(item.q2);
      const ansiedad = getScore(item.q3) + getScore(item.q4);
      const sobrecarga = getScore(item.q5) + getScore(item.q6);

      const hasA = animo >= threshold; // Depresión / Ánimo
      const hasB = ansiedad >= threshold; // Ansiedad
      const hasC = sobrecarga >= threshold; // Estrés / Sobrecarga

      if (hasA && hasB && hasC) ABC++;
      else if (hasA && hasB) AB++;
      else if (hasA && hasC) AC++;
      else if (hasB && hasC) BC++;
      else if (hasA) A++;
      else if (hasB) B++;
      else if (hasC) C++;
      else none++;
    });

    return { A, B, C, AB, AC, BC, ABC, none };
  }, [data, threshold]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Salud mental en usuarios</Text>
      <Text style={styles.subtitle}>Superposición de dimensiones de riesgo</Text>
      
      <View style={styles.diagramContainer}>
        {/* Círculo A - Depresión */}
        <View style={[styles.circle, styles.circleA]} />
        <Text style={[styles.label, styles.labelA]}>DEPRESIÓN</Text>
        
        {/* Círculo B - Ansiedad */}
        <View style={[styles.circle, styles.circleB]} />
        <Text style={[styles.label, styles.labelB]}>ANSIEDAD</Text>
        
        {/* Círculo C - Estrés */}
        <View style={[styles.circle, styles.circleC]} />
        <Text style={[styles.label, styles.labelC]}>ESTRÉS</Text>

        {/* Conteos puros */}
        <Text style={[styles.count, styles.countA]}>{counts.A > 0 ? counts.A : ''}</Text>
        <Text style={[styles.count, styles.countB]}>{counts.B > 0 ? counts.B : ''}</Text>
        <Text style={[styles.count, styles.countC]}>{counts.C > 0 ? counts.C : ''}</Text>
        
        {/* Intersecciones de a 2 */}
        <Text style={[styles.count, styles.countAB]}>{counts.AB > 0 ? counts.AB : ''}</Text>
        <Text style={[styles.count, styles.countAC]}>{counts.AC > 0 ? counts.AC : ''}</Text>
        <Text style={[styles.count, styles.countBC]}>{counts.BC > 0 ? counts.BC : ''}</Text>
        
        {/* Centro (Los 3) */}
        <View style={styles.countABCContainer}>
            <Text style={styles.countABC}>{counts.ABC > 0 ? counts.ABC : '0'}</Text>
            <Text style={styles.labelABC}>Malestar{"\n"}General</Text>
        </View>
      </View>

      {/* Leyenda aclaratoria */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>
          * Se considera un usuario dentro de un círculo si su puntaje en la dimensión es ≥ {threshold}.
        </Text>
        <Text style={styles.legendText}>
          Fuera del gráfico: <Text style={{fontWeight: 'bold'}}>{counts.none}</Text> usuarios sin riesgo significativo.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginVertical: 20,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
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
    left: 125,
    top: 125,
    alignItems: 'center',
    width: 50,
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
  legendContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    width: '100%',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  }
});

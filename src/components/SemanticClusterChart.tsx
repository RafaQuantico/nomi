import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing, Dimensions } from 'react-native';
import { DashboardData } from '../services/webhookService';

interface Props {
  data: DashboardData[];
  mode: 'general' | 'comparison';
}

const CLUSTERS = [
  { id: 'C1', name: 'Ansiedad, Estrés, Agobio', color: '#ef4444', keywords: ['estres', 'ansied', 'panico', 'llorar', 'dormir', 'cansad', 'agobi', 'angusti'] },
  { id: 'C2', name: 'Carga Académica', color: '#f59e0b', keywords: ['nota', 'prueb', 'examen', 'estudio', 'estudi', 'profes', 'u', 'univer', 'colegio', 'clase'] },
  { id: 'C3', name: 'Relaciones y Apoyo', color: '#8b5cf6', keywords: ['amig', 'familia', 'polol', 'novio', 'relacion', 'pele', 'apoy', 'compañer'] },
  { id: 'C4', name: 'Pérdida, Tristeza', color: '#ec4899', keywords: ['trist', 'depr', 'sol', 'mal', 'vacio', 'desgan', 'llanto'] },
  { id: 'C5', name: 'Futuro y Vocación', color: '#14b8a6', keywords: ['futur', 'vocacion', 'carrera', 'titul', 'trabaj', 'plata', 'dinero'] },
  { id: 'C6', name: 'Normal, Tranquilo', color: '#10b981', keywords: ['bien', 'normal', 'tranquil', 'nada', 'piola', 'relax', 'feliz'] },
  { id: 'C7', name: 'Otros / Mixto', color: '#94a3b8', keywords: [] },
];

function assignCluster(text: string) {
  const lower = (text || '').toLowerCase();
  for (const cluster of CLUSTERS) {
    if (cluster.keywords.some(k => lower.includes(k))) {
      return cluster;
    }
  }
  return CLUSTERS[6]; // Otros
}

function useInView() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current as any);
      return () => observer.disconnect();
    } else {
      setTimeout(() => setIsInView(true), 500);
    }
  }, []);

  return { ref, isInView };
}

// Pseudo-random number generator for stable coordinates
function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}
const rand = sfc32(1, 2, 3, 4);

export const SemanticClusterChart: React.FC<Props> = ({ data, mode }) => {
  const { ref, isInView } = useInView();
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isInView) {
      Animated.sequence([
        Animated.timing(explosionAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.poly(4)), // Explosión rápida y desaceleración suave
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [isInView, explosionAnim, fadeAnim]);

  const { nodes, clusterStats, quotes, totalCount } = useMemo(() => {
    // Definir centros para cada cluster en un canvas de 400x400
    const centers: Record<string, { x: number, y: number }> = {
      'C1': { x: 300, y: 100 },
      'C2': { x: 100, y: 100 },
      'C3': { x: 200, y: 200 },
      'C4': { x: 100, y: 300 },
      'C5': { x: 300, y: 300 },
      'C6': { x: 200, y: 50 },
      'C7': { x: 200, y: 350 },
    };

    const stats: Record<string, number> = {};
    const clusterQuotes: Record<string, string> = {};
    const targetStats: Record<string, { escolar: number, uni: number, total: number }> = {};

    CLUSTERS.forEach(c => {
      stats[c.id] = 0;
      targetStats[c.id] = { escolar: 0, uni: 0, total: 0 };
    });

    const parsedNodes = data.map((item, index) => {
      const text = String(item.textResponse || '');
      const cluster = assignCluster(text);
      stats[cluster.id]++;
      
      const isEscolar = item.target.toLowerCase() === 'escolar';
      targetStats[cluster.id].total++;
      if (isEscolar) targetStats[cluster.id].escolar++;
      else targetStats[cluster.id].uni++;

      if (text.length > 20 && !clusterQuotes[cluster.id] && rand() > 0.5) {
        clusterQuotes[cluster.id] = text;
      }

      const center = centers[cluster.id];
      // Distribuir nodos alrededor del centro usando coordenadas polares
      const radius = rand() * 60;
      const angle = rand() * Math.PI * 2;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      return {
        id: index,
        x,
        y,
        cluster,
        isEscolar
      };
    });

    // Rellenar quotes faltantes
    CLUSTERS.forEach(c => {
      if (!clusterQuotes[c.id]) {
        const fallback = data.find(item => assignCluster(item.textResponse || '').id === c.id);
        if (fallback) clusterQuotes[c.id] = fallback.textResponse || '';
      }
    });

    // Ordenar stats por tamaño
    const sortedStats = Object.keys(stats)
      .map(id => ({
        cluster: CLUSTERS.find(c => c.id === id)!,
        count: stats[id],
        escolar: targetStats[id].escolar,
        uni: targetStats[id].uni,
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count);

    return { nodes: parsedNodes, clusterStats: sortedStats, quotes: clusterQuotes, totalCount: data.length };
  }, [data]);

  return (
    <View style={styles.container} ref={ref}>
      <Text style={styles.title}>Análisis Semántico: {mode === 'general' ? 'Clusters de Respuestas' : 'Comparativa por Grupo'}</Text>
      
      <View style={styles.row}>
        {/* Panel Izquierdo (Textos y Leyenda) */}
        <Animated.View style={[styles.textPanel, { opacity: fadeAnim }]}>
          {mode === 'general' ? (
            <View>
              {clusterStats.map((stat, i) => (
                <View key={stat.cluster.id} style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <View style={[styles.dot, { backgroundColor: stat.cluster.color }]} />
                    <Text style={styles.statTitle}>
                      ({Math.round((stat.count / totalCount) * 100)}%) {stat.cluster.name}
                    </Text>
                  </View>
                  {quotes[stat.cluster.id] ? (
                    <Text style={styles.quoteText}>"{quotes[stat.cluster.id].substring(0, 140)}{quotes[stat.cluster.id].length > 140 ? '...' : ''}"</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View>
              <Text style={styles.subTitle}>Según grupo...</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3b82f6' }]} /><Text style={styles.legendText}>Escolar</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ec4899' }]} /><Text style={styles.legendText}>Universitario</Text></View>
              </View>

              <View style={styles.barsContainer}>
                {clusterStats.map((stat) => {
                  const pEscolar = stat.escolar > 0 ? (stat.escolar / data.filter(d => d.target.toLowerCase() === 'escolar').length) * 100 : 0;
                  const pUni = stat.uni > 0 ? (stat.uni / data.filter(d => d.target.toLowerCase() === 'universitario').length) * 100 : 0;

                  return (
                    <View key={stat.cluster.id} style={styles.barStatItem}>
                      <Text style={styles.barLabel}>{stat.cluster.name}</Text>
                      <View style={styles.barPair}>
                        <View style={styles.singleBarRow}>
                          <View style={[styles.horizBar, { width: `${Math.min(pEscolar * 2, 100)}%`, backgroundColor: '#3b82f6' }]} />
                          <Text style={styles.barPct}>{Math.round(pEscolar)}%</Text>
                        </View>
                        <View style={styles.singleBarRow}>
                          <View style={[styles.horizBar, { width: `${Math.min(pUni * 2, 100)}%`, backgroundColor: '#ec4899' }]} />
                          <Text style={styles.barPct}>{Math.round(pUni)}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Panel Derecho (Mapa de Nodos) */}
        <View style={styles.graphPanel}>
          <View style={styles.canvas}>
            {nodes.map(node => {
              const color = mode === 'general' ? node.cluster.color : (node.isEscolar ? '#3b82f6' : '#ec4899');
              
              // Animación de explosión: desde el centro (200,200) hacia su X,Y final
              const animatedX = explosionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, node.x]
              });
              const animatedY = explosionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, node.y]
              });

              return (
                <Animated.View
                  key={node.id}
                  style={[
                    styles.node,
                    {
                      backgroundColor: color,
                      left: animatedX,
                      top: animatedY,
                      opacity: explosionAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 1]
                      })
                    }
                  ]}
                />
              )
            })}
          </View>
          <Animated.Text style={[styles.graphFooter, { opacity: fadeAnim }]}>N = {totalCount}</Animated.Text>
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
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
  },
  row: {
    flexDirection: Dimensions.get('window').width > 800 ? 'row' : 'column',
    gap: 30,
  },
  textPanel: {
    flex: 1,
    paddingRight: 10,
  },
  statItem: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  quoteText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 18,
    paddingLeft: 18,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 14,
    color: '#64748b',
  },
  barsContainer: {
    marginTop: 10,
  },
  barStatItem: {
    marginBottom: 16,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  barPair: {
    gap: 4,
  },
  singleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizBar: {
    height: 8,
    borderRadius: 4,
  },
  barPct: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 6,
    width: 30,
  },
  graphPanel: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 400,
  },
  canvas: {
    width: 400,
    height: 400,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  graphFooter: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  }
});

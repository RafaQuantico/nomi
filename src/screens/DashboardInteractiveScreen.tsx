import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { fetchDashboardData, DashboardData } from '../services/webhookService';

export default function DashboardInteractiveScreen() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'todos' | 'escolar' | 'universitario'>('todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchDashboardData();
      
      // Filtrar filas inválidas (ej. filas en blanco de Google Sheets) y normalizar target
      const validData = result
        .filter(r => r.target && (r.target.toString().toLowerCase().trim() === 'escolar' || r.target.toString().toLowerCase().trim() === 'universitario'))
        .map(r => ({
          ...r,
          target: r.target.toString().toLowerCase().trim(),
        }));

      setData(validData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // 1. Filtrar datos
  const filteredData = useMemo(() => {
    if (filter === 'todos') return data;
    return data.filter(item => item.target === filter);
  }, [data, filter]);

  // 2. Calcular métricas principales
  const totalTests = data.length;
  const escolarTests = data.filter(i => i.target === 'escolar').length;
  const uniTests = data.filter(i => i.target === 'universitario').length;
  const currentTotal = filteredData.length;

  // 3. Calcular porcentajes por ruta
  const routeStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Promoción': 0,
      'Prevención': 0,
      'Intervención': 0,
      'Riesgo': 0,
      'Sin clasificar': 0
    };
    
    filteredData.forEach(item => {
      let r = (item.route || '').trim().toLowerCase();
      // Remove accents for easier matching if needed, or explicitly check variations
      r = r.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (r === 'promocion') counts['Promoción']++;
      else if (r === 'prevencion') counts['Prevención']++;
      else if (r === 'intervencion') counts['Intervención']++;
      else if (r === 'riesgo') counts['Riesgo']++;
      else counts['Sin clasificar']++;
    });

    return [
      { label: 'Promoción', count: counts['Promoción'], color: '#10b981' },
      { label: 'Prevención', count: counts['Prevención'], color: '#f59e0b' },
      { label: 'Intervención', count: counts['Intervención'], color: '#ef4444' },
      { label: 'Riesgo', count: counts['Riesgo'], color: '#991b1b' },
      { label: 'Sin clasificar', count: counts['Sin clasificar'], color: '#94a3b8' },
    ].map(item => ({
      ...item,
      percentage: currentTotal > 0 ? Math.round((item.count / currentTotal) * 100) : 0
    }));
  }, [filteredData, currentTotal]);

  // 4. Analizar palabras frecuentes
  const frequentWords = useMemo(() => {
    const stopwords = ['de','la','que','el','en','y','a','los','se','del','las','un','por','con','no','una','su','para','es','al','lo','como','más','pero','sus','le','ya','o','porque','cuando','muy','sin','sobre','también','me','hasta','hay','donde','quien','desde','todo','nos','durante','todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mí','antes','algunos','qué','unos','yo','otro','otras','otra','él','tanto','esa','estos','mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo','nosotros','mi','mis','tú','te','ti','tu','tus','ellas','nosotras','vosotros','vosotras','os','mío','mía','míos','mías','tuyo','tuya','tuyos','tuyas','suyo','suya','suyos','suyas','nuestro','nuestra','nuestros','nuestras','vuestro','vuestra','vuestros','vuestras','esos','esas','este','esta','estos','estas','aquel','aquella','aquellos','aquellas','cual','cuales','quien','quienes','que'];
    
    const wordCounts: Record<string, number> = {};
    
    filteredData.forEach(item => {
      if (item.textResponse) {
        const rawWords = item.textResponse.toLowerCase().split(/\s+/);
        rawWords.forEach(w => {
          // Ignorar URLs
          if (w.startsWith('http') || w.startsWith('www')) return;
          
          const cleanWord = w.replace(/[^\wáéíóúüñ]/g, '');
          if (cleanWord.length > 3 && !stopwords.includes(cleanWord)) {
            wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerContainer}>
          <Image source={require('../../assets/Nomi_Negro.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalTests}</Text>
            <Text style={styles.metricLabel}>Pruebas Totales</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{escolarTests}</Text>
            <Text style={styles.metricLabel}>Escolares</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{uniTests}</Text>
            <Text style={styles.metricLabel}>Universitarios</Text>
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'todos' && styles.filterBtnActive]}
            onPress={() => setFilter('todos')}>
            <Text style={[styles.filterText, filter === 'todos' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'escolar' && styles.filterBtnActive]}
            onPress={() => setFilter('escolar')}>
            <Text style={[styles.filterText, filter === 'escolar' && styles.filterTextActive]}>Escolares</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'universitario' && styles.filterBtnActive]}
            onPress={() => setFilter('universitario')}>
            <Text style={[styles.filterText, filter === 'universitario' && styles.filterTextActive]}>Universitarios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados ({currentTotal} casos)</Text>
          
          <View style={styles.barsContainer}>
            {routeStats.map((stat) => (
              <View key={stat.label} style={styles.barRow}>
                <View style={styles.barLabelContainer}>
                  <Text style={styles.barLabel}>{stat.label}</Text>
                  <Text style={styles.barValue}>{stat.percentage}% ({stat.count})</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${stat.percentage}%` as any, backgroundColor: stat.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis de Respuestas Abiertas</Text>
          <Text style={styles.sectionSubtitle}>Conceptos más repetidos en el grupo seleccionado:</Text>
          
          <View style={styles.tagsContainer}>
            {frequentWords.length > 0 ? (
              frequentWords.map(([word, count]) => (
                <View key={word} style={styles.tag}>
                  <Text style={styles.tagText}>{word}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{count}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: '#888' }}>No hay suficientes datos de texto.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  scroll: { padding: 24, maxWidth: 800, width: '100%', alignSelf: 'center' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  headerLogo: { width: 100, height: 32, marginRight: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  errorText: { color: 'red', marginBottom: 16 },
  retryBtn: { padding: 12, backgroundColor: '#000', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },

  metricsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  metricCard: { flex: 1, minWidth: 120, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  metricValue: { fontSize: 32, fontWeight: '900', color: '#000' },
  metricLabel: { fontSize: 13, color: '#666', marginTop: 4, fontWeight: '600' },

  filtersContainer: { flexDirection: 'row', backgroundColor: '#eaeaea', borderRadius: 12, padding: 4, marginBottom: 32 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  filterText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#000' },

  section: { backgroundColor: '#fff', padding: 24, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 20 },
  sectionSubtitle: { fontSize: 14, color: '#555', marginBottom: 16 },

  barsContainer: { gap: 20 },
  barRow: {},
  barLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  barValue: { fontSize: 14, fontWeight: '600', color: '#666' },
  barTrack: { height: 12, backgroundColor: '#f1f1f1', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  tagText: { fontSize: 14, fontWeight: '600', color: '#333', marginRight: 6 },
  tagBadge: { backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tagBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
